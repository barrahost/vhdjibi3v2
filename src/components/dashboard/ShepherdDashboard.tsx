import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Soul, Interaction } from '../../types/database.types';
import { StatCard } from './stats/StatCard';
import { Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
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
  const [loading, setLoading] = useState(true);

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

        // Calculer les âmes nécessitant attention (pas d'interaction depuis 5 jours)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        
        const soulsNeedingAttention = soulsData.filter(soul => {
          const soulInteractions = interactionsData.filter(i => i.soulId === soul.id);
          if (soulInteractions.length === 0) return true;
          
          const lastInteraction = new Date(Math.max(...soulInteractions.map(i => i.date.getTime())));
          return lastInteraction < fiveDaysAgo;
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

      {/* Interactions récentes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-[#00665C]">
            Interactions récentes
          </h2>
        </div>
        <div className="divide-y">
          {recentInteractions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune interaction récente
            </div>
          ) : (
            recentInteractions.map(interaction => {
              const soul = souls.find(s => s.id === interaction.soulId);
              return (
                <div key={interaction.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {soul?.fullName || 'Âme inconnue'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {interaction.type === 'call' ? 'Appel' :
                         interaction.type === 'visit' ? 'Visite' : 'Message'}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(interaction.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {interaction.notes}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}