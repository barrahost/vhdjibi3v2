import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GeneralStats } from './stats/GeneralStats';
import { RetentionStats } from './stats/RetentionStats';
import { InteractionStats } from './stats/InteractionStats';
import { SpiritualStats } from './stats/SpiritualStats';
import { RecentActivity } from './stats/RecentActivity';
import toast from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    try {
      // Écouter les changements sur les âmes
      const soulsQuery = query(collection(db, 'souls'));
      const unsubscribeSouls = onSnapshot(soulsQuery, () => {}, (error) => {
        console.error('Error listening to souls:', error);
        setError('Erreur lors de la mise à jour des données');
        toast.error('Erreur de synchronisation');
      });
      unsubscribes.push(unsubscribeSouls);

      // Écouter les changements sur les utilisateurs (incluant les bergers)
      const usersQuery = query(collection(db, 'users'));
      const unsubscribeUsers = onSnapshot(usersQuery, () => {}, (error) => {
        console.error('Error listening to users:', error);
        setError('Erreur lors de la mise à jour des données');
        toast.error('Erreur de synchronisation');
      });
      unsubscribes.push(unsubscribeUsers);

      // Écouter les changements sur les interactions
      const interactionsQuery = query(collection(db, 'interactions'));
      const unsubscribeInteractions = onSnapshot(interactionsQuery, () => {}, (error) => {
        console.error('Error listening to interactions:', error);
        setError('Erreur lors de la mise à jour des données');
        toast.error('Erreur de synchronisation');
      });
      unsubscribes.push(unsubscribeInteractions);

      setLoading(false);
    } catch (error) {
      console.error('Error setting up dashboard listeners:', error);
      setError('Erreur lors de l\'initialisation du tableau de bord');
      toast.error('Erreur lors du chargement du tableau de bord');
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement du tableau de bord...</div>
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
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général & Activité</TabsTrigger>
          <TabsTrigger value="spiritual">Progression Spirituelle</TabsTrigger>
          <TabsTrigger value="retention">Rétention</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <h2 className="text-lg font-semibold text-[#00665C] mt-4">
            Statistiques générales
          </h2>
          <GeneralStats />
          <h2 className="text-lg font-semibold text-[#00665C] mt-4">
            Activités récentes
          </h2>
          <RecentActivity />
        </TabsContent>

        <TabsContent value="spiritual" className="space-y-6">
          <h2 className="text-lg font-semibold text-[#00665C] mt-4">
            Progression spirituelle
          </h2>
          <SpiritualStats />
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <h2 className="text-lg font-semibold text-[#00665C] mt-4">
            Statistiques de rétention
          </h2>
          <RetentionStats />
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <h2 className="text-lg font-semibold text-[#00665C] mt-4">
            Statistiques des interactions
          </h2>
          <InteractionStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}