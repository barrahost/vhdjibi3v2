
import { useState } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import BulkRoleAssignmentModal from '../components/users/BulkRoleAssignmentModal';
import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'shepherds' | 'adn' | 'admins'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const handleSelectionChange = (userIds: string[]) => {
    setSelectedUserIds(userIds);
  };

  const handleBulkAssignmentSuccess = () => {
    setSelectedUserIds([]);
    setShowBulkModal(false);
    toast.success('Rôles assignés avec succès');
  };

  // Get selected users data for the modal
  const selectedUsers = ((window as any).currentUsers || []).filter((user: any) => selectedUserIds.includes(user.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <div className="flex items-center space-x-3">
          {selectedUserIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Assigner un rôle ({selectedUserIds.length})
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Masquer le formulaire' : 'Ajouter un utilisateur'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un utilisateur</h2>
          <UserForm onSuccess={() => {
            setShowForm(false);
            // Afficher un message de succès
            toast.success('Utilisateur ajouté avec succès');
          }} />
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'shepherds' | 'adn' | 'admins')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="admins">Administrateurs</option>
              <option value="shepherds">Berger(e)s</option>
              <option value="adn">ADN</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
              <option value="all">Tous les statuts</option>
            </select>
          </div>
        </div>
      </div>

      <UserList 
        filter={roleFilter} 
        statusFilter={statusFilter}
        selectedUserIds={selectedUserIds}
        onSelectionChange={handleSelectionChange}
      />

      {/* Modal d'assignation en masse */}
      <BulkRoleAssignmentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedUserIds={selectedUserIds}
        selectedUsers={selectedUsers}
        onSuccess={handleBulkAssignmentSuccess}
      />
    </div>
  );
}
