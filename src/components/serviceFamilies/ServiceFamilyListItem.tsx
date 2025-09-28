import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader: string;
}

interface ServiceFamilyListItemProps {
  family: ServiceFamily;
  onEdit: () => void;
}

export default function ServiceFamilyListItem({ family, onEdit }: ServiceFamilyListItemProps) {
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette famille ?')) {
      try {
        await deleteDoc(doc(db, 'serviceFamilies', family.id));
        toast.success('Famille supprimée avec succès');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{family.name}</h3>
            {family.leader && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                <Users className="w-3 h-3 mr-1" />
                {family.leader}
              </span>
            )}
          </div>
          {family.description && (
            <p className="mt-1 text-sm text-gray-500">{family.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}