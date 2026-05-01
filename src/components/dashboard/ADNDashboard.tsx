import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StatCard } from './stats/StatCard';
import { Users, UserCheck, UserX, User, AlertTriangle } from 'lucide-react';
import { RecentActivity } from './stats/RecentActivity';
import { SoulEvolutionChart } from './stats/SoulEvolutionChart';
import toast from 'react-hot-toast';

export function ADNDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSouls: 0,
    activeAssignedSouls: 0,
    activeUnassignedSouls: 0,
    undecidedSouls: 0,
    newSoulsThisMonth: 0,
    activeAssignedMaleCount: 0,
    activeAssignedFemaleCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer toutes les âmes enregistrées
        const soulsRef = collection(db, 'souls');
        const allSoulsQuery = query(soulsRef);
        const snapshot = await getDocs(allSoulsQuery);
        
        if (!snapshot) {
          throw new Error("Impossible de récupérer les données");
        }

        const souls = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            shepherdId: data.shepherdId as string | undefined,
            isUndecided: data.isUndecided as boolean,
            gender: data.gender as string,
            status: data.status as string,
          };
        });

        // Total des âmes enregistrées
        const totalSouls = souls.length;
        
        // Total des âmes actives et assignées
        const activeAssignedSouls = souls.filter(soul => 
          soul.status === 'active' && soul.shepherdId && !soul.isUndecided
        ).length;
        
        // Total des âmes actives et non assignées
        const activeUnassignedSouls = souls.filter(soul => 
          soul.status === 'active' && !soul.shepherdId && !soul.isUndecided
        ).length;
        
        // Total des âmes indécises
        const undecidedSouls = souls.filter(soul => soul.isUndecided).length;

        // Nouvelles âmes ce mois (30 derniers jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newSoulsThisMonth = souls.filter(soul => {
          const createdAt = soul.createdAt instanceof Date ? soul.createdAt : new Date(soul.createdAt);
          return createdAt >= thirtyDaysAgo;
        }).length;

        // Total des âmes hommes actives et assignées
        const activeAssignedMaleCount = souls.filter(soul => 
          soul.status === 'active' && soul.shepherdId && !soul.isUndecided && soul.gender === 'male'
        ).length;
        
        // Total des âmes femmes actives et assignées
        const activeAssignedFemaleCount = souls.filter(soul => 
          soul.status === 'active' && soul.shepherdId && !soul.isUndecided && soul.gender === 'female'
        ).length;

        setStats({
          totalSouls,
          activeAssignedSouls,
          activeUnassignedSouls,
          undecidedSouls,
          newSoulsThisMonth,
          activeAssignedMaleCount,
          activeAssignedFemaleCount
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching ADN stats:', error);
        setError("Erreur lors du chargement des statistiques");
        toast.error("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord ADN</h1>

      {/* Première ligne de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total des âmes enregistrées"
          value={stats.totalSouls}
          icon={Users}
          trend={`${stats.totalSouls}`}
          trendLabel="âmes au total"
        />
        
        <StatCard
          title="Total des âmes actives et assignées"
          value={stats.activeAssignedSouls}
          icon={UserCheck}
          trend={`${((stats.activeAssignedSouls / stats.totalSouls) * 100).toFixed(1)}%`}
          trendLabel="du total"
          iconClassName="text-green-600"
        />
        
        <StatCard
          title="Total des âmes actives et non assignées"
          value={stats.activeUnassignedSouls}
          icon={Users}
          trend={`${stats.totalSouls ? ((stats.activeUnassignedSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="du total"
          iconClassName="text-blue-600"
        />

        <StatCard
          title="Nouvelles âmes (Mois)"
          value={stats.newSoulsThisMonth}
          icon={UserCheck}
          trend={`${stats.totalSouls ? ((stats.newSoulsThisMonth / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="du total"
          iconClassName="text-emerald-600"
        />
        
        <StatCard
          title="Total des âmes indécises"
          value={stats.undecidedSouls}
          icon={AlertTriangle}
          trend={`${stats.totalSouls ? ((stats.undecidedSouls / stats.totalSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="du total"
          iconClassName="text-amber-600"
        />

        <StatCard
          title="Total des âmes hommes actifs et assignés"
          value={stats.activeAssignedMaleCount}
          icon={User}
          trend={`${stats.activeAssignedSouls ? ((stats.activeAssignedMaleCount / stats.activeAssignedSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="des assignés actifs"
          iconClassName="text-blue-600"
        />

        <StatCard
          title="Total des âmes femmes actives et assignées"
          value={stats.activeAssignedFemaleCount}
          icon={User}
          trend={`${stats.activeAssignedSouls ? ((stats.activeAssignedFemaleCount / stats.activeAssignedSouls) * 100).toFixed(1) : '0'}%`}
          trendLabel="des assignées actives"
          iconClassName="text-pink-600"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Évolution des âmes enregistrées
        </h2>
        <SoulEvolutionChart />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">
          Activités récentes
        </h2>
        <RecentActivity />
      </div>
    </div>
  );
}