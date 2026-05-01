import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Soul, Interaction } from '../../types/database.types';
import { StatCard } from './stats/StatCard';
import { Users, MessageSquare, AlertTriangle, Phone } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import PendingActionsWidget from './PendingActionsWidget';
import InteractionModal from '../interactions/InteractionModal';
import toast from 'react-hot-toast';

export function ShepherdDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSouls: 0,
    totalInteractions: 0,
    soulsNeedingAttention: 0
  });
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactionSoul, setInteractionSoul] = useState<Soul | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        console.log('🔍 [ShepherdDashboard] Loading data for user:', user.uid);
        
        // Récupérer le document utilisateur
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const userSnapshot = await getDocs(usersQuery);
        
        if (userSnapshot.empty) {
          console.error('🔍 [ShepherdDashboard] User not found in users collection');
          toast.error('Utilisateur non trouvé');
          setLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data();
        const currentShepherdId = userSnapshot.docs[0].id;
        setShepherdId(currentShepherdId);
        
        console.log('🔍 [ShepherdDashboard] User data:', {
          id: currentShepherdId,
          role: userData.role,
          businessProfiles: userData.businessProfiles
        });

        // Vérifier si l'utilisateur est un berger (nouveau ou ancien système)
        const hasShepherdProfile = userData.businessProfiles?.some(
          (profile: any) => profile.type === 'shepherd'
        );
        const hasLegacyShepherdRole = userData.role === 'shepherd' || userData.role === 'intern';
        
        if (!hasShepherdProfile && !hasLegacyShepherdRole) {
          console.error('🔍 [ShepherdDashboard] User is not a shepherd');
          toast.error('Vous devez avoir un profil Berger pour accéder à ce tableau de bord');
          setLoading(false);
          return;
        }

        console.log('🔍 [ShepherdDashboard] User is a shepherd, loading data...');

        // Récupérer les âmes
        const soulsQuery = query(
          collection(db, 'souls'),
          where('shepherdId', '==', currentShepherdId),
          where('status', '==', 'active')
        );
        const soulsSnapshot = await getDocs(soulsQuery);
        const soulsData = soulsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Soul[];
        
        console.log('🔍 [ShepherdDashboard] Found souls:', soulsData.length);
        setSouls(soulsData);

        // Récupérer les interactions
        const interactionsQuery = query(
          collection(db, 'interactions'),
          where('shepherdId', '==', currentShepherdId)
        );
        const interactionsSnapshot = await getDocs(interactionsQuery);
        const interactionsData = interactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        })) as Interaction[];

        console.log('🔍 [ShepherdDashboard] Found interactions:', interactionsData.length);

        // Calculer les statistiques
        const totalSouls = soulsData.length;
        const totalInteractions = interactionsData.length;

        // Calculer les âmes nécessitant attention (pas d'interaction depuis 14 jours)
        const attentionThreshold = new Date();
        attentionThreshold.setDate(attentionThreshold.getDate() - 14);

        const soulsNeedingAttention = soulsData.filter(soul => {
          const soulInteractions = interactionsData.filter(i => i.soulId === soul.id);
          if (soulInteractions.length === 0) return true;

          const lastInteraction = new Date(Math.max(...soulInteractions.map(i => i.date.getTime())));
          return lastInteraction < attentionThreshold;
        }).length;

        // Récupérer les interactions récentes
        const sortedInteractions = [...interactionsData]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);

        setStats({
          totalSouls,
          totalInteractions,
          soulsNeedingAttention
        });
        setRecentInteractions(sortedInteractions);
        
        console.log('🔍 [ShepherdDashboard] Stats loaded:', {
          totalSouls,
          totalInteractions,
          soulsNeedingAttention
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de bord</h1>

      {shepherdId && <PendingActionsWidget role="shepherd" shepherdId={shepherdId} />}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Mes âmes"
          value={stats.totalSouls}
          icon={Users}
          trend={`${stats.totalSouls}`}
          trendLabel="âmes assignées"
        />
        
        <StatCard
          title="Interactions"
          value={stats.totalInteractions}
          icon={MessageSquare}
          trend={stats.totalSouls > 0 
            ? `${(stats.totalInteractions / stats.totalSouls).toFixed(1)}`
            : '0'
          }
          trendLabel="par âme"
        />
        
        <StatCard
          title="Nécessitent attention"
          value={stats.soulsNeedingAttention}
          icon={AlertTriangle}
          trend={stats.totalSouls > 0
            ? `${((stats.soulsNeedingAttention / stats.totalSouls) * 100).toFixed(1)}%`
            : '0%'
          }
          trendLabel="des âmes"
          iconClassName="text-yellow-500"
        />
      </div>

      {/* Mes âmes — suivi par urgence de contact */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#00665C]">Mes âmes — suivi</h2>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {stats.soulsNeedingAttention} à contacter
          </span>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {soulsWithLastContact.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune âme assignée pour le moment
            </div>
          ) : (
            soulsWithLastContact.map(soul => {
              const badge = getContactBadge(soul.daysSince);
              return (
                <div key={soul.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{soul.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{soul.phone || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => setInteractionSoul(soul)}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#00665C] text-white rounded-lg hover:bg-[#00554C] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Contacter</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {interactionSoul && shepherdId && (
        <InteractionModal
          isOpen={!!interactionSoul}
          onClose={() => setInteractionSoul(null)}
          soulId={interactionSoul.id}
          shepherdId={shepherdId}
          soulName={interactionSoul.fullName}
        />
      )}
    </div>
  );
}