import { useState, useEffect } from 'react';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader: string;
}

interface EditServiceFamilyModalProps {
  family: ServiceFamily;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditServiceFamilyModal({ family, isOpen, onClose }: EditServiceFamilyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (family) {
      setFormData({
        name: family.name,
        description: family.description,
        leader: family.leader
      });
    }
  }, [family]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.name.trim()) {
        toast.error('Le nom de la famille est obligatoire');
        return;
      }

      // Vérifier si le nom existe déjà (sauf pour la même famille)
      if (formData.name.trim() !== family.name) {
        const nameQuery = query(
          collection(db, 'serviceFamilies'),
          where('name', '==', formData.name.trim())
        );
        const nameSnapshot = await getDocs(nameQuery);
        
        if (!nameSnapshot.empty) {
          toast.error('Une famille avec ce nom existe déjà');
          return;
        }
      }

      const familyRef = doc(db, 'serviceFamilies', family.id);
      await updateDoc(familyRef, {
        ...formData,
        name: formData.name.trim(),
        updatedAt: new Date()
      });
      
      toast.success('Famille modifiée avec succès');
      onClose();
    } catch (error: any) {
      console.error('Error updating service family:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier une famille"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la famille
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chef de famille
          </label>
          <input
            type="text"
            value={formData.leader}
            onChange={(e) => setFormData(prev => ({ ...prev, leader: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6">
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
    </Modal>
  );
}