import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Servant } from '../../types/servant.types';
import { Search, ArrowUpDown } from 'lucide-react';
import ServantListItem from './ServantListItem';
import EditServantModal from './EditServantModal';
import { CustomPagination } from '../ui/CustomPagination';
import { useDepartments } from '../../hooks/useDepartments';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

type SortField = 'fullName' | 'department' | 'isHead';
type SortDirection = 'asc' | 'desc';

interface ServantListProps {
  statusFilter: 'all' | 'active' | 'inactive';
}

export default function ServantList({ statusFilter }: ServantListProps) {
  const [servants, setServants] = useState<Servant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingServant, setEditingServant] = useState<Servant | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'fullName',
    direction: 'asc'
  });
  const { departments } = useDepartments();

  // Charger les serviteurs
  useEffect(() => {
    let baseQuery;
    
    if (selectedDepartmentId) {
      baseQuery = query(
        collection(db, 'servants'),
        where('departmentId', '==', selectedDepartmentId),
        orderBy('createdAt', 'desc')
      );
    } else {
      baseQuery = query(
        collection(db, 'servants'),
        orderBy('createdAt', 'desc')
      );
    }

    // Add status filter if not 'all'
    if (statusFilter !== 'all') {
      if (selectedDepartmentId) {
        baseQuery = query(
          collection(db, 'servants'),
          where('departmentId', '==', selectedDepartmentId),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      } else {
        baseQuery = query(
          collection(db, 'servants'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }
    }
    
    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const servantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Servant));
      setServants(servantsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading servants:', error);
      toast.error('Erreur lors du chargement des serviteurs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDepartmentId, statusFilter]);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartmentId]);

  // Filtrer les serviteurs
  const filteredServants = servants.filter(servant =>
    servant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servant.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trier les serviteurs
  const sortedServants = [...filteredServants].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    switch (field) {
      case 'fullName':
        return a.fullName.localeCompare(b.fullName) * modifier;
      case 'isHead':
        return ((a.isHead === b.isHead) ? 0 : a.isHead ? 1 : -1) * modifier;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedServants.length / ITEMS_PER_PAGE);
  const paginatedServants = sortedServants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Obtenir le nom du département
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Département inconnu';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement des serviteurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un serviteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        
        <div className="w-full md:w-64">
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Tous les départements</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="group flex items-center space-x-1"
                  >
                    <span>Nom et Prénoms</span>
                    <ArrowUpDown className={`w-4 h-4 transition-colors ${
                      sortConfig.field === 'fullName' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('isHead')}
                    className="group flex items-center space-x-1"
                  >
                    <span>Rôle</span>
                    <ArrowUpDown className={`w-4 h-4 transition-colors ${
                      sortConfig.field === 'isHead' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedServants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun serviteur trouvé
                  </td>
                </tr>
              ) : (
                paginatedServants.map((servant) => (
                  <ServantListItem
                    key={servant.id}
                    servant={servant}
                    departmentName={getDepartmentName(servant.departmentId)}
                    onEdit={() => setEditingServant(servant)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredServants.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>

      {editingServant && (
        <EditServantModal
          servant={editingServant}
          isOpen={!!editingServant}
          onClose={() => setEditingServant(null)}
          departmentName={getDepartmentName(editingServant.departmentId)}
        />
      )}
    </div>
  );
}