import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { Plus, FileSpreadsheet, Search, Pencil, Trash2, User as UserIcon, RotateCcw, Megaphone, Info, CheckCircle2, Download } from 'lucide-react';
import { CustomTable } from '../components/ui/CustomTable';
import { CustomPagination } from '../components/ui/CustomPagination';
import { formatDate, formatDateForExcel } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser, isADNUser, isEvangelistUser } from '../utils/roleHelpers';
import EvangelizedSoulForm from '../components/evangelizedSouls/EvangelizedSoulForm';
import EditEvangelizedSoulModal from '../components/evangelizedSouls/EditEvangelizedSoulModal';
import ImportToSoulModal from '../components/evangelizedSouls/ImportToSoulModal';
import { EvangelizedSoul } from '../types/evangelized.types';
import { formatGender } from '../utils/formatting/genderFormat';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function EvangelizedSoulManagement() {
  const { user, userRole, activeRole } = useAuth();
  const [souls, setSouls] = useState<EvangelizedSoul[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EvangelizedSoul | null>(null);
  const [importing, setImporting] = useState<EvangelizedSoul | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [importFilter, setImportFilter] = useState<'pending' | 'imported' | 'all'>('pending');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const roleForCheck = { role: (activeRole || userRole) as string };
  const isAdmin = isAdminUser(roleForCheck);
  const isADN = isADNUser(roleForCheck);
  const isEvangelist = isEvangelistUser({
    role: (activeRole || userRole) as string,
    businessProfiles: (user as any)?.businessProfiles,
  });
  const canImportToSouls = isAdmin || isADN;
  const canCreateEvangelized = isAdmin || isEvangelist;
  const userId = user ? (user as any).id || (user as any).uid : null;

  useEffect(() => {
    if (!userId) return;

    const constraints: any[] = [];
    // Admin/ADN voient toute la liste; les autres (évangélistes) voient seulement les leurs.
    if (!isAdmin && !isADN) {
      constraints.push(where('evangelistId', '==', userId));
    }
    if (statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, 'evangelized_souls'), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            ...v,
            evangelizationDate: v.evangelizationDate?.toDate?.() ?? v.evangelizationDate,
            createdAt: v.createdAt?.toDate?.() ?? v.createdAt,
            updatedAt: v.updatedAt?.toDate?.() ?? v.updatedAt,
          } as EvangelizedSoul;
        });
        setSouls(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading evangelized souls:', err);
        toast.error('Erreur lors du chargement');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId, isAdmin, isADN, statusFilter]);

  useEffect(() => setCurrentPage(1), [searchTerm, dateRange, statusFilter, importFilter]);

  const filtered = souls.filter((s) => {
    // Filtre import
    const isImported = !!s.importedToSoulId || s.status === 'imported';
    if (importFilter === 'pending' && isImported) return false;
    if (importFilter === 'imported' && !isImported) return false;

    const term = searchTerm.toLowerCase();
    const matches =
      !term ||
      s.fullName.toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term) ||
      (s.location || '').toLowerCase().includes(term);
    if (!matches) return false;
    if (dateRange.startDate && s.evangelizationDate) {
      if (new Date(s.evangelizationDate) < new Date(dateRange.startDate)) return false;
    }
    if (dateRange.endDate && s.evangelizationDate) {
      const end = new Date(dateRange.endDate);
      end.setDate(end.getDate() + 1);
      if (new Date(s.evangelizationDate) > end) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasActiveFilters =
    searchTerm !== '' ||
    dateRange.startDate !== '' ||
    dateRange.endDate !== '' ||
    statusFilter !== 'active' ||
    importFilter !== 'pending';

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('active');
    setImportFilter('pending');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette âme évangélisée ?')) return;
    try {
      await deleteDoc(doc(db, 'evangelized_souls', id));
      toast.success('Âme supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      'Nom et Prénoms': s.fullName,
      'Surnom': s.nickname || '',
      'Genre': formatGender(s.gender),
      'Téléphone': (s.phone || '').replace('+225', ''),
      "Lieu d'habitation": s.location,
      "Date d'évangélisation": s.evangelizationDate ? formatDateForExcel(s.evangelizationDate) : '',
      "Lieu d'évangélisation": s.evangelizationLocation || '',
      'Notes': s.notes || '',
      'Statut': s.status === 'imported' ? 'Importée' : s.status === 'active' ? 'Actif' : 'Inactif',
      'Importée le': s.importedAt ? formatDateForExcel(s.importedAt) : '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Âmes évangélisées');
    XLSX.writeFile(wb, `ames-evangelisees-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Âmes évangélisées');
    XLSX.writeFile(wb, `ames-evangelisees-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    {
      key: 'photoURL',
      title: 'Photo',
      render: (value: string | null) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'fullName',
      title: 'Nom et Prénoms',
      render: (value: string, s: EvangelizedSoul) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {s.nickname && <span className="ml-2 text-sm text-gray-500">({s.nickname})</span>}
        </div>
      ),
    },
    { key: 'phone', title: 'Téléphone', render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    { key: 'location', title: 'Lieu', render: (v: string) => <span className="text-gray-600">{v || '-'}</span> },
    {
      key: 'evangelizationDate',
      title: "Date d'évangélisation",
      render: (v: Date) => <span className="text-gray-600">{v ? formatDate(v) : '-'}</span>,
    },
    {
      key: 'evangelizationLocation',
      title: "Lieu d'évangélisation",
      render: (v: string) => <span className="text-gray-600">{v || '-'}</span>,
    },
    {
      key: 'importStatus',
      title: 'État',
      render: (_: any, s: EvangelizedSoul) => {
        const isImported = !!s.importedToSoulId || s.status === 'imported';
        if (isImported) {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              title={s.importedAt ? `Importée le ${formatDate(new Date(s.importedAt))}` : 'Importée'}
            >
              <CheckCircle2 className="w-3 h-3" />
              Importée
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            À importer
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, s: EvangelizedSoul) => {
        const isImported = !!s.importedToSoulId || s.status === 'imported';
        return (
          <div className="flex justify-end items-center gap-2">
            {canImportToSouls && !isImported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImporting(s);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md"
                title="Importer parmi les âmes de l'église"
              >
                <Download className="w-3.5 h-3.5" />
                Importer
              </button>
            )}
            {(isAdmin || isEvangelist) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(s);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {isAdmin && !isImported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s.id);
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des âmes évangélisées...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-[#00665C]" />
          Âmes évangélisées
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </button>
          {canCreateEvangelized && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? 'Masquer le formulaire' : 'Ajouter une âme évangélisée'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p>
            Les <strong>âmes évangélisées</strong> ne sont <strong>pas comptabilisées</strong> parmi
            les âmes de l'église tant qu'elles n'ont pas effectué leur première visite au culte.
          </p>
          {canImportToSouls && (
            <p className="mt-1">
              Le jour où l'âme vient au culte, cliquez sur <strong>« Importer »</strong> pour
              l'ajouter à la liste des âmes de l'église.
            </p>
          )}
        </div>
      </div>

      {showForm && canCreateEvangelized && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-[#00665C] mb-4">Ajouter une âme évangélisée</h2>
          <EvangelizedSoulForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-[#00665C] hover:underline"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation (début)</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation (fin)</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <Search className="w-4 h-4 absolute left-3 top-9 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, téléphone, lieu..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État import</label>
            <select
              value={importFilter}
              onChange={(e) => setImportFilter(e.target.value as 'pending' | 'imported' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="pending">À importer</option>
              <option value="imported">Importées</option>
              <option value="all">Toutes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="all">Tous</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <CustomTable columns={columns} data={paginated} />
        {paginated.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {hasActiveFilters
              ? 'Aucune âme évangélisée ne correspond à vos filtres.'
              : "Aucune âme évangélisée pour l'instant. Cliquez sur \"Ajouter\" pour commencer."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {editing && (
        <EditEvangelizedSoulModal
          soul={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
        />
      )}

      {importing && (
        <ImportToSoulModal
          soul={importing}
          isOpen={!!importing}
          onClose={() => setImporting(null)}
        />
      )}
    </div>
  );
}
