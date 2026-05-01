import { useState, useEffect } from 'react';
import { addDoc, collection, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EditSoulTabs } from './tabs/EditSoulTabs';
import { SMSTemplate } from '../../types/sms.types';
import { SMSService } from '../../services/sms.service';
import { PhotoUpload } from '../ui/PhotoUpload';
import { StorageService } from '../../services/storage.service';
import toast from 'react-hot-toast';

export default function SoulForm() {
  const [formData, setFormData] = useState({
    general: {
      gender: '',
      fullName: '',
      nickname: '',
      phone: '',
      location: '',
      coordinates: null as { latitude: number; longitude: number; } | null,
      firstVisitDate: new Date().toISOString().split('T')[0],
      shepherdId: undefined as string | undefined,
      isUndecided: false,
      photo: null as File | null,
      status: 'active' as 'active' | 'inactive',
      originSource: '' as '' | 'culte' | 'evangelisation',
      serviceFamilyId: undefined as string | undefined,
    },
    spiritual: {
      isBornAgain: false,
      isBaptized: false,
      isEnrolledInAcademy: false,
      isEnrolledInLifeBearers: false,
      departments: []
    }
  });
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await SMSService.getTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Erreur lors du chargement des modèles');
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate SMS template selection
      if (!selectedTemplate) {
        toast.error('Veuillez sélectionner un modèle de message de bienvenue');
        return;
      }

      // Validation de base
      if (!formData.general.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }

      if (!formData.general.gender) {
        toast.error('Le genre est obligatoire');
        return;
      }

      if (!formData.general.location.trim()) {
        toast.error("Le lieu d'habitation est obligatoire");
        return;
      }

      if (!formData.general.originSource) {
        toast.error("La provenance de l'âme est obligatoire");
        return;
      }

      // Préparer les données pour Firestore
      const soulData = {
        fullName: formData.general.fullName.trim(),
        nickname: formData.general.nickname.trim() || null,
        gender: formData.general.gender,
        phone: formData.general.phone,
        isUndecided: formData.general.isUndecided,
        location: formData.general.location.trim(),
        coordinates: formData.general.coordinates,
        firstVisitDate: new Date(formData.general.firstVisitDate),
        shepherdId: formData.general.shepherdId,
        originSource: formData.general.originSource,
        serviceFamilyId: formData.general.serviceFamilyId || null,
        spiritualProfile: formData.spiritual,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      // Ajouter à Firestore
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      const user = JSON.parse(userStr);
      
      let photoURL: string | undefined = undefined;
      if (formData.general.photo) {
        // Générer un ID unique pour l'âme pour le chemin de la photo
        const soulIdForPhoto = `soul_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        photoURL = await StorageService.uploadProfilePhoto(soulIdForPhoto, formData.general.photo);
      }

      const docRef = await addDoc(collection(db, 'souls'), {
        ...soulData,
        createdBy: user.id,
        photoURL: photoURL || null
      });
      
      if (!docRef.id) {
        throw new Error("Erreur lors de l'ajout de l'âme");
      }

      // Send welcome SMS
      try {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) {
          throw new Error('Modèle de message non trouvé');
        }
        
        // Check if we have sufficient credits
        const creditCheck = await SMSService.checkSufficientCredits();
        if (!creditCheck.sufficient) {
          toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
          toast.success('Âme ajoutée avec succès, mais le SMS de bienvenue n\'a pas été envoyé.');
          
          // Reset form
          setFormData({
          general: {
            gender: '',
            fullName: '',
            nickname: '',
            phone: '',
            location: '',
            coordinates: null,
            firstVisitDate: new Date().toISOString().split('T')[0],
            shepherdId: undefined,
            isUndecided: false,
            photo: null,
            status: 'active' as 'active' | 'inactive'
            },
            spiritual: {
              isBornAgain: false,
              isBaptized: false,
              isEnrolledInAcademy: false,
              isEnrolledInLifeBearers: false,
              departments: []
            }
          });
          
          return;
        }
        
        await SMSService.sendSMS(
          soulData.phone.replace('+225', ''),
          template.content,
          soulData.fullName,
          soulData.nickname || undefined
        );

        // Create interaction record
        await SMSService.createSMSInteraction(
          user.id,
          docRef.id,
          template.content,
          new Date()
        );
      } catch (smsError) {
        console.error('Error sending welcome SMS:', smsError);
        // Delete the soul if SMS fails
        if (smsError instanceof Error && smsError.message.includes('Crédit SMS insuffisant')) {
          toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
          toast.success('Âme ajoutée avec succès, mais le SMS de bienvenue n\'a pas été envoyé.');
        } else {
          await deleteDoc(doc(db, 'souls', docRef.id));
          throw new Error('Erreur lors de l\'envoi du SMS de bienvenue. L\'âme n\'a pas été ajoutée.');
        }
      }

      // Réinitialiser le formulaire
      setFormData({
        general: {
          gender: '',
          fullName: '',
          nickname: '',
          phone: '',
          location: '',
          coordinates: null,
          firstVisitDate: new Date().toISOString().split('T')[0],
          shepherdId: undefined,
          isUndecided: false,
          photo: null,
          status: 'active' as 'active' | 'inactive'
        },
        spiritual: {
          isBornAgain: false,
          isBaptized: false,
          isEnrolledInAcademy: false,
          isEnrolledInLifeBearers: false,
          departments: []
        }
      });

      toast.success('Âme ajoutée avec succès');
    } catch (error) {
      console.error('Error adding soul:', error);
      toast.error("Erreur lors de l'ajout de l'âme");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message de bienvenue *
        </label>
        <select
          required
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={loadingTemplates}
        >
          <option value="">Sélectionner un modèle de message de bienvenue</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          * Champ obligatoire
        </p>
        {loadingTemplates && (
          <p className="mt-1 text-sm text-gray-500">
            Chargement des modèles...
          </p>
        )}
        {!loadingTemplates && templates.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            Aucun modèle de message disponible dans la catégorie "Suivi"
          </p>
        )}
      </div>

      <PhotoUpload
        onChange={(file) => setFormData(prev => ({
          ...prev,
          general: { ...prev.general, photo: file }
        }))}
      />

      <EditSoulTabs
        data={formData}
        onChange={setFormData}
      />

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C]"
      >
        Ajouter une âme
      </button>
    </form>
  );
}