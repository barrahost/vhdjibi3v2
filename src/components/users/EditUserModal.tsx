import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { PhotoUpload } from '../ui/PhotoUpload';
import { LocationField } from '../souls/form/LocationField';
import { MenuAssignment } from './MenuAssignment';
import { StorageService } from '../../services/storage.service';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { User } from '../../types/user.types';
import { BaseRole } from '../../types/permission.types';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordResetModal from './PasswordResetModal';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    phone: '',
    roles: {
      primary: '' as BaseRole,
      secondary: [] as BaseRole[]
    },
    additionalMenus: [] as string[],
    status: 'active' as 'active' | 'inactive',
    location: '',
    coordinates: null as { latitude: number; longitude: number; } | null,
    useGeolocation: false,
    photo: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userExplicitlyRemovedPhoto, setUserExplicitlyRemovedPhoto] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Handle both old single role format and new roles object format
      let roles;
      if (user.roles && typeof user.roles === 'object') {
        roles = user.roles;
      } else {
        // Convert old single role format to new format
        roles = {
          primary: (user.role || 'admin') as BaseRole,
          secondary: []
        };
      }

      setFormData({
        fullName: user.fullName,
        nickname: user.nickname || '',
        phone: user.phone?.replace('+225', '') || '',
        roles,
        additionalMenus: user.additionalMenus || [],
        status: user.status || 'active',
        location: user.location || '',
        coordinates: user.coordinates || null,
        useGeolocation: !!user.coordinates,
        photo: null
      });
      // Reset the photo removal flag when opening the modal
      setUserExplicitlyRemovedPhoto(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    try {
      // Set submitting state at the start
      setIsSubmitting(true);
      
      console.log('Starting user update process');
      
      // Determine which collection to update
      const docRef = user.fromAdminsCollection 
        ? doc(db, 'admins', user.id)
        : doc(db, 'users', user.id);

      // Get current user data to ensure we have the latest photoURL
      const currentUserDoc = await getDoc(docRef);
      const currentUserData = currentUserDoc.data();
      let photoURL = currentUserData?.photoURL;

      console.log('Current photoURL:', photoURL);
      console.log('Form photo state:', formData.photo === null ? 'explicitly null' : formData.photo ? 'new file' : 'undefined/unchanged');
      console.log('User explicitly removed photo:', userExplicitlyRemovedPhoto);

      // Only delete the photo if the user explicitly clicked the remove button
      if (userExplicitlyRemovedPhoto && photoURL) {
        try {
          console.log('Deleting photo because user explicitly removed it:', photoURL);
          await StorageService.deleteProfilePhoto(photoURL);
          console.log('Photo deleted successfully');
        } catch (deleteError) {
          console.error('Error deleting photo:', deleteError);
          // Continue with update even if delete fails
        }
      }

      // Always set photoURL to null if user explicitly removed photo
      if (userExplicitlyRemovedPhoto) {
        photoURL = null;
      }

      // Validation de base
      if (!formData.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }

      // Upload de la nouvelle photo si elle existe
      if (formData.photo) {
        try {
          console.log('Uploading new photo for user:', user.uid);
          
          // If there's an existing photo, delete it first
          if (photoURL) {
            try {
              console.log('Deleting existing photo before upload:', photoURL);
              await StorageService.deleteProfilePhoto(photoURL);
              console.log('Old photo deleted successfully');
            } catch (deleteError) {
              console.error('Error deleting old photo:', deleteError);
              // Continue with upload even if delete fails
            }
          }
          
          const newPhotoURL = await StorageService.uploadProfilePhoto(user.uid, formData.photo);
          photoURL = newPhotoURL;
          console.log('New photo URL:', newPhotoURL);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Erreur lors du téléchargement de la photo');
          return;
        }
      }

      // Validation du numéro de téléphone
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
        return;
      }

      // Préparer les données pour la mise à jour
      const updateData: any = {
        fullName: formData.fullName.trim(),
        nickname: formData.nickname?.trim() || null,
        phone: phoneValidation.formattedNumber,
        roles: formData.roles,
        additionalMenus: formData.additionalMenus,
        role: formData.roles.primary, // Update the top-level role field to match the primary role
        status: formData.status,
        location: formData.location?.trim() || null,
        coordinates: formData.useGeolocation ? formData.coordinates : null,
        updatedAt: new Date()
      };
      
      // Only include photoURL in the update if it has changed
      if (formData.photo || userExplicitlyRemovedPhoto) {
        updateData.photoURL = photoURL;
        console.log('Including photoURL in update:', photoURL);
      } else {
        console.log('Not updating photoURL field, keeping existing value');
      }

      // Mise à jour dans Firestore
      await updateDoc(docRef, updateData);
      
      // Log the updated data for debugging
      console.log('Updated user data:', updateData);
      

      toast.success('Utilisateur modifié avec succès');
      success = true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier un utilisateur"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <PhotoUpload
          onChange={(file) => setFormData(prev => ({ ...prev, photo: file }))}
          currentPhotoURL={user.photoURL}
          setUserExplicitlyRemovedPhoto={setUserExplicitlyRemovedPhoto}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom et Prénoms
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surnom
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <LocationField
          location={formData.location}
          coordinates={formData.coordinates}
          useGeolocation={formData.useGeolocation}
          onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
          onCoordinatesChange={(coordinates) => setFormData(prev => ({ 
            ...prev, 
            coordinates,
            useGeolocation: !!coordinates 
          }))}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              +225
            </span>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const truncated = value.slice(0, 10);
                setFormData(prev => ({ ...prev, phone: truncated }));
              }}
              className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
          />
          <p className="mt-1 text-sm text-gray-500">
            L'email ne peut pas être modifié
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rôle Principal
          </label>
          <select
            value={formData.roles.primary}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              roles: {
                ...prev.roles,
                primary: e.target.value as BaseRole
              }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="admin">Administrateur</option>
            <option value="shepherd">Berger(e)</option>
            <option value="adn">ADN</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rôles Secondaires
          </label>
          <div className="space-y-2">
            {(['admin', 'shepherd', 'adn'] as BaseRole[]).map(role => (
              role !== formData.roles.primary && (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.secondary.includes(role)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        roles: {
                          ...prev.roles,
                          secondary: e.target.checked
                            ? [...prev.roles.secondary, role]
                            : prev.roles.secondary.filter(r => r !== role)
                        }
                      }));
                    }}
                    className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {role === 'admin' ? 'Administrateur' :
                     role === 'adn' ? 'ADN' : 'Berger(e)'}
                  </span>
                </label>
              )
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Sélectionnez les rôles additionnels pour cet utilisateur
          </p>
        </div>

        {/* Additional Menus Section - Only show for shepherds */}
        {formData.roles.primary === 'shepherd' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menus Additionnels
            </label>
            <MenuAssignment 
              selectedMenus={formData.additionalMenus}
              onChange={(menus) => setFormData(prev => ({ ...prev, additionalMenus: menus }))}
            />
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez les menus additionnels à attribuer à cet utilisateur
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={() => setShowPasswordResetModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 flex items-center"
          >
            <Key className="w-4 h-4 mr-2" />
            Réinitialiser le mot de passe
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
      
      {showPasswordResetModal && (
        <PasswordResetModal
          isOpen={showPasswordResetModal}
          onClose={() => setShowPasswordResetModal(false)}
          user={{
            id: user.id,
            uid: user.uid,
            fullName: user.fullName
          }}
        />
      )}
    </Modal>
  );
}