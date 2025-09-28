import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, MessageCircle, Phone, Users } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { formatDate } from '../utils/dateUtils';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import ShepherdFilter from '../components/souls/filters/ShepherdFilter';
import { CustomPagination } from '../components/ui/CustomPagination';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function InteractionsManagement() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [interactions, setInteractions] = useState<any[]>([]);
  const [souls, setSouls] = useState<Record<string, any>>({});
  const [shepherds, setShepherds] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState({
    field: 'date' as 'date' | 'type' | 'soulName' | 'shepherdName',
    direction: 'desc' as 'asc' | 'desc'
  });

  const columns = [
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => {
        const getIcon = () => {
          switch (value) {
            case 'call':
              return <Phone className="w-5 h-5 text-blue-600" />;
            case 'visit':
              return <Users className="w-5 h-5 text-green-600" />;
            default:
              return <MessageCircle className="w-5 h-5 text-amber-600" />;
          }
        };

        const getLabel = () => {
          switch (value) {
            case 'call':
              return 'Appel';
            case 'visit':
              return 'Visite';
            default:
              return 'Message';
          }
        };

        return (
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="text-sm font-medium">{getLabel()}</span>
          </div>
        );
      }
    },
    {
      key: 'date',
      title: 'Date',
      render: (value: Date) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'soulId',
      title: 'Âme',
      render: (value: string) => {
        const soul = souls[value];
        return soul ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2B636]/10 text-[#F2B636]">
            {soul.fullName}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Âme inconnue</span>
        );
      }
    },
    {
      key: 'shepherdId',
      title: 'Berger(e)',
      render: (value: string) => {
        const shepherd = shepherds[value];
        return shepherd ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {shepherd.fullName}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Berger(e) inconnu(e)</span>
        );
      }
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value: string) => (
        <div className="max-w-xs break-words whitespace-normal text-sm text-gray-600">
          {value}
        </div>
      )
    }
  ];

  useEffect(() => {
    if (!user) return;

    // Créer un index composé dans Firestore pour optimiser les requêtes
    // shepherdId, date DESC

    const loadData = async () => {
      try {
        let shepherdId = null;

        // Si c'est un berger, récupérer son ID
        if (!hasPermission(PERMISSIONS.MANAGE_USERS)) {
          const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', user.uid),
            where('role', 'in', ['shepherd', 'intern']),
            where('status', '==', 'active')
          );
          const userDoc = await getDocs(userQuery);
          
          if (!userDoc.empty) {
            shepherdId = userDoc.docs[0].id;
            console.log('Found user ID for interactions:', shepherdId);
          }
        }

        // Construire la requête des interactions
        let interactionsQuery;
        if (shepherdId) {
          console.log('Filtering interactions for user ID:', shepherdId);
          interactionsQuery = query( // Utiliser l'index composé
            collection(db, 'interactions'),
            where('shepherdId', '==', shepherdId),
            orderBy('date', 'desc')
          );
        } else if (selectedShepherdId) {
          console.log('Filtering interactions for selected shepherd:', selectedShepherdId);
          interactionsQuery = query(
            collection(db, 'interactions'),
            where('shepherdId', '==', selectedShepherdId),
            orderBy('date', 'desc')
          );
        } else {
          console.log('Showing all interactions (admin view)');
          interactionsQuery = query(
            collection(db, 'interactions'),
            orderBy('date', 'desc')
          );
        }

        // Écouter les changements sur les interactions
        const unsubscribe = onSnapshot(interactionsQuery, async (snapshot) => {
          const interactionsData = snapshot.docs.map(doc => ({
            id: doc.id, 
            date: doc.data().date.toDate(),
            type: doc.data().type,
            notes: doc.data().notes,
            soulId: doc.data().soulId,
            shepherdId: doc.data().shepherdId
          }));

          // Charger les informations des âmes et des bergers
          const soulsData: Record<string, any> = {};
          const shepherdsData: Record<string, any> = {};

          // Optimiser le chargement des données liées en utilisant Promise.all
          const uniqueSoulIds = [...new Set(interactionsData.map(i => i.soulId))];
          const uniqueShepherdIds = [...new Set(interactionsData.map(i => i.shepherdId))];

          const [soulDocs, shepherdDocs] = await Promise.all([
            Promise.all(uniqueSoulIds.map(id => getDoc(doc(db, 'souls', id)))),
            Promise.all(uniqueShepherdIds.map(id => getDoc(doc(db, 'users', id))))
          ]);

          soulDocs.forEach(doc => {
            if (doc.exists()) {
              soulsData[doc.id] = {
                id: doc.id,
                fullName: doc.data().fullName
              };
            }
          });

          shepherdDocs.forEach(doc => {
            if (doc.exists()) {
              shepherdsData[doc.id] = {
                id: doc.id,
                fullName: doc.data().fullName
              };
            }
          });

          // Mettre à jour l'état
          setSouls(soulsData);
          setShepherds(shepherdsData);
          setInteractions(interactionsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading interactions:', error);
        toast.error('Erreur lors du chargement des interactions');
        setLoading(false);
      }
    };

    loadData();
  }, [user, selectedShepherdId, hasPermission]);

  // Filtrer les interactions
  const filteredInteractions = interactions.filter(interaction => {
    const soul = souls[interaction.soulId];
    const shepherd = shepherds[interaction.shepherdId];
    
    if (!soul || !shepherd) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      soul.fullName.toLowerCase().includes(searchLower) ||
      shepherd.fullName.toLowerCase().includes(searchLower) ||
      interaction.notes.toLowerCase().includes(searchLower)
    );
  });

  // Trier les interactions
  const sortedInteractions = [...filteredInteractions].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    switch (field) {
      case 'date':
        return (a.date.getTime() - b.date.getTime()) * modifier;
      case 'type':
        return a.type.localeCompare(b.type) * modifier;
      case 'soulName':
        return souls[a.soulId]?.fullName.localeCompare(souls[b.soulId]?.fullName) * modifier;
      case 'shepherdName':
        return shepherds[a.shepherdId]?.fullName.localeCompare(shepherds[b.shepherdId]?.fullName) * modifier;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInteractions.length / ITEMS_PER_PAGE);
  const paginatedInteractions = sortedInteractions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedShepherdId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des interactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Interactions</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          
          {hasPermission(PERMISSIONS.MANAGE_USERS) && (
            <ShepherdFilter
              value={selectedShepherdId}
              onChange={setSelectedShepherdId}
            />
          )}
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une interaction par âme, berger ou notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredInteractions.length} résultat{filteredInteractions.length !== 1 ? 's' : ''} trouvé{filteredInteractions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Table */}
        <CustomTable
          data={paginatedInteractions}
          columns={columns}
        />

        {totalPages > 1 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedInteractions.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </div>
  );
}