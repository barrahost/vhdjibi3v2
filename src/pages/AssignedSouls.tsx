import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Soul } from '../types/database.types';
import { MessagesSquare, Pencil, Search } from 'lucide-react';
import EditSoulModal from '../components/souls/EditSoulModal';
import InteractionModal from '../components/interactions/InteractionModal';
import { formatDate } from '../utils/dateUtils';
import { CustomTable } from '../components/ui/CustomTable';
import toast from 'react-hot-toast';

export default function AssignedSouls() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [editingSoul, setEditingSoul] = useState<Soul | null>(null);
  const [interactingSoul, setInteractingSoul] = useState<Soul | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'fullName' as keyof Soul,
    direction: 'asc' as 'asc' | 'desc'
  });

  const columns = [
    {
      key: 'fullName',
      title: 'Nom et Prénoms',
      render: (value: string, soul: Soul) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {soul.nickname && (
            <span className="ml-2 text-sm text-gray-500">
              ({soul.nickname})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Téléphone',
      render: (value: string) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'location',
      title: 'Lieu d\'habitation',
      render: (value: string) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'firstVisitDate',
      title: 'Date de première visite',
      render: (value: Date) => (
        <span className="text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, soul: Soul) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInteractingSoul(soul);
            }}
            className="p-1 text-[#00665C] hover:bg-[#00665C]/10 rounded transition-colors"
            title="Interactions"
          >
            <MessagesSquare className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingSoul(soul);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const loadAssignedSouls = async () => {
    if (!user) return;

    try {
      // Récupérer l'utilisateur depuis la collection users
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', user.uid),
        where('status', '==', 'active')
      );
      const userDoc = await getDocs(userQuery);
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        const currentUserId = userDoc.docs[0].id;
        
        // Vérifier si l'utilisateur a le profil berger actif ou l'ancien rôle berger
        const hasShepherdProfile = userData.businessProfiles?.some((profile: any) => 
          profile.type === 'shepherd' && profile.isActive
        );
        const hasOldShepherdRole = userData.role === 'shepherd' || userData.role === 'intern';
        
        if (hasShepherdProfile || hasOldShepherdRole) {
          setShepherdId(currentUserId);

          // Récupérer les âmes assignées
          const soulsQuery = query(
            collection(db, 'souls'),
            where('shepherdId', '==', currentUserId),
            where('status', '==', 'active')
          );
          const soulsSnapshot = await getDocs(soulsQuery);
          
          setSouls(soulsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Soul)));
        } else {
          toast.error('Profil berger requis pour voir les âmes assignées');
        }
      } else {
        toast.error('Utilisateur non trouvé');
      }
    } catch (error) {
      console.error('Error loading souls:', error);
      toast.error('Erreur lors du chargement des âmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedSouls();
  }, [user]);

  // Filtrer les âmes
  const filteredSouls = souls.filter(soul =>
    soul.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trier les âmes
  const sortedSouls = [...filteredSouls].sort((a, b) => {
    const { field, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    if (field === 'firstVisitDate') {
      return (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * modifier;
    }

    return String(a[field]).localeCompare(String(b[field])) * modifier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mes Âmes Assignées</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une âme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <CustomTable
        data={sortedSouls}
        columns={columns}
      />

      {editingSoul && shepherdId && (
        <EditSoulModal
          soul={editingSoul}
          isOpen={!!editingSoul}
          onClose={() => setEditingSoul(null)}
          onUpdate={() => {
            setEditingSoul(null);
            loadAssignedSouls();
          }}
        />
      )}

      {interactingSoul && shepherdId && (
        <InteractionModal
          isOpen={!!interactingSoul}
          onClose={() => setInteractingSoul(null)}
          soulId={interactingSoul.id}
          shepherdId={shepherdId}
          soulName={interactingSoul.fullName}
        />
      )}
    </div>
  );
}