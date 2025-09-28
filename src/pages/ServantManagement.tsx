import { useState } from 'react';
import ServantForm from '../components/servants/ServantForm';
import ServantList from '../components/servants/ServantList';
import { Plus } from 'lucide-react';

export default function ServantManagement() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Serviteurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Masquer le formulaire' : 'Ajouter un serviteur'}
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
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
            <option value="all">Tous les serviteurs</option>
          </select>
        </div>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un serviteur</h2>
          <ServantForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      <ServantList statusFilter={statusFilter} />
    </div>
  );
}