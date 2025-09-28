import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Send, X, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { SMSService } from '../../services/sms.service';
import { SMSTemplate, SMSRecipient, SMS_VARIABLES } from '../../types/sms.types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface SMSFormProps {
  assignedSouls: SMSRecipient[];
}

const MAX_SMS_LENGTH = 125; // Reduced to 125 to allow for appending user info

export default function SMSForm({ assignedSouls }: SMSFormProps) {
  const { user } = useAuth();
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState({ fullName: '', phone: '' });

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;
      
      try {
        // Get user info from Firestore
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserInfo({
            fullName: userData.fullName || '',
            phone: userData.phone || ''
          });
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, [user]);

  // Charger les modèles actifs
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesQuery = query(
          collection(db, 'smsTemplates'),
          where('status', '==', 'active'),
          orderBy('title', 'asc')
        );
        
        const snapshot = await getDocs(templatesQuery);
        setTemplates(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SMSTemplate)));
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Erreur lors du chargement des modèles');
      }
    };

    loadTemplates();
  }, []);

  // Charger le brouillon
  useEffect(() => {
    const draft = localStorage.getItem('sms_draft');
    if (draft) {
      const { message, recipients } = JSON.parse(draft);
      setMessage(message || '');
      setSelectedRecipients(new Set(recipients || []));
    }
  }, []);

  // Sauvegarder le brouillon
  useEffect(() => {
    localStorage.setItem('sms_draft', JSON.stringify({
      message,
      recipients: Array.from(selectedRecipients)
    }));
  }, [message, selectedRecipients]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
      setCharacterCount(template.content.length);
    }
  };

  const replaceVariables = (text: string, soul: SMSRecipient) => {
    let result = text;
    SMS_VARIABLES.forEach(variable => {
      if (variable.key === '[nom]') {
        result = result.replace(variable.key, soul.fullName);
      }
      // Autres variables...
    });
    return result;
  };

  const handleSend = async () => {
    if (selectedRecipients.size === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    try {
      // Check if we have sufficient credits
      const creditCheck = await SMSService.checkSufficientCredits();
      if (!creditCheck.sufficient) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
        return;
      }
      
      setIsSending(true);
      const selectedSouls = assignedSouls.filter(soul => selectedRecipients.has(soul.id));
      
      try {
        // Get user surname (first part of fullName)
        // Get first two names from user's full name (or just one if that's all they have)
        const nameParts = userInfo.fullName.split(' ');
        const userSignatureName = nameParts.length > 1 
          ? `${nameParts[0]} ${nameParts[1]}`
          : nameParts[0] || '';
        const userPhone = userInfo.phone.replace('+225', '') || '';
        
        // Append user info to the message
        const userSignature = `\n- ${userSignatureName} (${userPhone})`;

        // Validate message length for each recipient after personalization
        for (const soul of selectedSouls) {
          const personalizedMessage = message
            .replace(/\[nom\]/g, soul.fullName)
            .replace(/\[surnom\]/g, soul.nickname || soul.fullName.split(' ')[0])
            + userSignature;
          
          if (personalizedMessage.length > 160) { // Still check against 160 as that's the SMS limit
            throw new Error(`Le message personnalisé pour ${soul.fullName} dépasse la limite de caractères`);
          }
        }

        const results = await SMSService.sendBatchSMS({
          recipients: selectedSouls.map(soul => ({
            id: soul.id,
            fullName: soul.fullName,
            nickname: soul.nickname,
            phone: soul.phone
          })),
          message: message + userSignature,
          templateId: selectedTemplate || undefined
        });

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        if (successful > 0) {
          toast.success(`${successful} message(s) envoyé(s) avec succès`);
        }
        if (failed > 0) {
          toast.error(`${failed} message(s) non envoyé(s)`);
        }

        if (failed === 0) {
          setMessage('');
          setSelectedRecipients(new Set());
          setSelectedTemplate('');
          localStorage.removeItem('sms_draft');
        }
      } catch (error) {
        throw error;
      }
    } catch (error: any) {
      if (error.message.includes('Crédit SMS insuffisant')) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      } else {
        toast.error(error.message || 'Erreur lors de l\'envoi des messages');
      }
    }
    setIsSending(false);
  };

  const filteredSouls = assignedSouls.filter(soul => 
    soul.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Destinataires ({selectedRecipients.size} sélectionné(s))
        </label>
        
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une âme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
          <div className="p-2 border-b bg-gray-50">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedRecipients.size === filteredSouls.length}
                onChange={() => {
                  if (selectedRecipients.size === filteredSouls.length) {
                    setSelectedRecipients(new Set());
                  } else {
                    setSelectedRecipients(new Set(filteredSouls.map(soul => soul.id)));
                  }
                }}
                className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
              />
              <span className="text-sm font-medium">Tout sélectionner</span>
            </label>
          </div>
          
          <div className="divide-y">
            {filteredSouls.map(soul => (
              <label key={soul.id} className="flex items-center p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRecipients.has(soul.id)}
                  onChange={() => {
                    const newSelected = new Set(selectedRecipients);
                    if (newSelected.has(soul.id)) {
                      newSelected.delete(soul.id);
                    } else {
                      newSelected.add(soul.id);
                    }
                    setSelectedRecipients(newSelected);
                  }}
                  className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                />
                <span className="ml-2 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{soul.fullName}</span>
                  <span className="block text-sm text-gray-500">{soul.phone}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Modèle de message
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="">Sélectionnez un modèle</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              const text = e.target.value;
              if (text.length <= MAX_SMS_LENGTH) {
                setMessage(text);
                setCharacterCount(text.length);
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="Votre message..."
          />
          <div className={`mt-1 text-sm ${
            characterCount > MAX_SMS_LENGTH - 20 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {characterCount}/{MAX_SMS_LENGTH} caractères
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Votre nom et numéro seront automatiquement ajoutés à la fin du message.
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setMessage('');
            setSelectedRecipients(new Set());
            setSelectedTemplate('');
            localStorage.removeItem('sms_draft');
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X className="w-4 h-4 mr-2 inline-block" />
          Effacer
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || !message.trim() || selectedRecipients.size === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 flex items-center"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSending ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}