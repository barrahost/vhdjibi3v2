import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyLeaderService } from '../../services/familyLeader.service';
import type { ServiceFamily, Soul } from '../../types/database.types';
import { Heart, Users, UserPlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FamilyLeaderDashboard() {
  const { user } = useAuth();
  const [family, setFamily] = useState<ServiceFamily | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [shepherds, setShepherds] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const userId = user?.id || user?.uid;

  const load = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const fam = await FamilyLeaderService.getFamilyByLeaderId(userId);
      setFamily(fam);
      if (fam) {
        const [s, sh] = await Promise.all([
          FamilyLeaderService.getSoulsByFamilyId(fam.id),
          FamilyLeaderService.getShepherdsOfFamily(fam.shepherdIds || []),
        ]);
        setSouls(s);
        setShepherds(sh);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement de votre famille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const stats = useMemo(() => {
    const total = souls.length;
    const assigned = souls.filter(s => s.shepherdId).length;
    return { total, assigned, unassigned: total - assigned };
  }, [souls]);

  const handleAssign = async (soulId: string, shepherdId: string) => {
    try {
      setSavingId(soulId);
      await FamilyLeaderService.assignShepherdToSoul(soulId, shepherdId || null);
      toast.success('Berger assigné');
      setSouls(prev => prev.map(s => s.id === soulId ? { ...s, shepherdId: shepherdId || undefined } : s));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (!family) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-amber-900">Aucune famille assignée</h2>
        <p className="text-sm text-amber-800 mt-1">
          Vous n'êtes responsable d'aucune famille de service. Contactez un administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Famille : {family.name}</h1>
        {family.description && <p className="text-sm text-gray-500 mt-1">{family.description}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500"><Heart className="w-4 h-4" /> Total âmes</div>
          <div className="text-2xl font-bold text-[#00665C] mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500"><Users className="w-4 h-4" /> Assignées</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.assigned}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500"><UserPlus className="w-4 h-4" /> Non assignées</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.unassigned}</div>
        </div>
      </div>

      {/* Liste des âmes */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Âmes de la famille</h2>
        </div>

        {souls.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Aucune âme assignée à cette famille pour le moment.
          </div>
        ) : (
          <div className="divide-y">
            {souls.map(soul => (
              <div key={soul.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {soul.fullName}
                    {soul.nickname && <span className="text-gray-500 font-normal"> ({soul.nickname})</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                    {soul.originSource && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {soul.originSource === 'culte' ? 'Culte' : 'Évangélisation'}
                      </span>
                    )}
                    <span>📞 {soul.phone}</span>
                    <span>📍 {soul.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={soul.shepherdId || ''}
                    onChange={(e) => handleAssign(soul.id, e.target.value)}
                    disabled={savingId === soul.id || shepherds.length === 0}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
                  >
                    <option value="">-- Non assigné --</option>
                    {shepherds.map(sh => (
                      <option key={sh.id} value={sh.id}>{sh.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {shepherds.length === 0 && (
          <div className="px-4 py-3 bg-amber-50 text-sm text-amber-800 border-t">
            ⚠️ Aucun berger n'est rattaché à votre famille. Contactez un administrateur pour en ajouter.
          </div>
        )}
      </div>
    </div>
  );
}
