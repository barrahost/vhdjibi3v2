import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { Soul } from '../../types/database.types';
import { SMSTemplate } from '../../types/sms.types';
import { SMSService } from '../../services/sms.service';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const MAX_SMS_LENGTH = 125; // Reduced to 125 to allow for appending user info

interface UndecidedSoulMessageModalProps {
  soul: Soul;
  isOpen: boolean;
  onClose: () => void;
}

export default function UndecidedSoulMessageModal({
  soul,
  isOpen,
  onClose
}: UndecidedSoulMessageModalProps) {
  const { user } = useAuth();
  const [template, setTemplate] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ fullName: '', phone: '' });

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
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

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

  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setTemplate(templateId);
      setMessage(selectedTemplate.content);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Get user surname (first part of fullName)
      // Get first two names from user's full name (or just one if that's all they have)
      const nameParts = userInfo.fullName.split(' ');
      const userSignatureName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1]}`
        : nameParts[0] || '';
      const userPhone = userInfo.phone.replace('+225', '') || '';
      
      // Append user info to the message
      const userSignature = `\n- ${userSignatureName} (${userPhone})`;
      
      // Personalize message
      const personalizedMessage = message
        .replace(/\[nom\]/g, soul.fullName)
        .replace(/\[surnom\]/g, soul.nickname || soul.fullName.split(' ')[0])
        + userSignature;

      await SMSService.sendSMS(
        soul.phone.replace('+225', ''),
        personalizedMessage,
        soul.fullName,
        soul.nickname
      );

      toast.success('Message envoyé avec succès');
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Crédit SMS insuffisant')) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      } else {
        console.error('Error sending message:', error);
        toast.error('Erreur lors de l\'envoi du message');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Envoyer un message à ${soul.fullName}`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modèles de message
          </label>
          <select
            value={template}
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
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_SMS_LENGTH}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            placeholder="Votre message..."
          />
          <p className={`mt-1 text-sm ${
            message.length > MAX_SMS_LENGTH - 20 ? 'text-amber-600' : 'text-gray-500'
          }`}>
            {message.length}/{MAX_SMS_LENGTH} caractères maximum
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Votre nom et numéro seront automatiquement ajoutés à la fin du message.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}