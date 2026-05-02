import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { CheckCircle2, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface EvangelizedSoulFormProps {
  onCreated?: () => void;
}

const initial = {
  gender: '' as '' | 'male' | 'female',
  fullName: '',
  nickname: '',
  phone: '',
  location: '',
  evangelizationDate: new Date().toISOString().split('T')[0],
  evangelizationLocation: '',
  notes: '',
};

export default function EvangelizedSoulForm({ onCreated }: EvangelizedSoulFormProps) {
  const navigate = useNavigate();
  const [data, setData] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<typeof initial | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) return toast.error('Le nom est obligatoire');
    if (!data.gender) return toast.error('Le genre est obligatoire');
    if (!data.location.trim()) return toast.error("Le lieu d'habitation est obligatoire");
    if (!data.evangelizationDate) return toast.error("La date d'évangélisation est obligatoire");

    const userStr = localStorage.getItem('user');
    if (!userStr) return toast.error('Session expirée. Veuillez vous reconnecter.');
    const user = JSON.parse(userStr);

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'evangelized_souls'), {
        fullName: data.fullName.trim(),
        nickname: data.nickname.trim() || null,
        gender: data.gender,
        phone: data.phone.trim(),
        location: data.location.trim(),
        evangelizationDate: new Date(data.evangelizationDate),
        evangelizationLocation: data.evangelizationLocation.trim() || null,
        notes: data.notes.trim() || null,
        evangelistId: user.id,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });

      toast.success('Âme évangélisée enregistrée');
      setSuccess(data);
      setData(initial);
      onCreated?.();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">Âme évangélisée enregistrée</h2>
            <p className="text-sm text-green-800 mt-0.5">
              <strong>{success.fullName}</strong> a bien été ajouté(e) à votre liste.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4" /> Enregistrer une autre âme
          </button>
          <button
            type="button"
            onClick={() => navigate('/ames-evangelisees')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] hover:bg-[#00665C]/10 rounded-md"
          >
            <List className="w-4 h-4" /> Voir la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénoms *</label>
          <input
            type="text"
            required
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Surnom</label>
          <input
            type="text"
            value={data.nickname}
            onChange={(e) => setData({ ...data, nickname: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
        <GenderRadioGroup
          value={data.gender as 'male' | 'female' | ''}
          onChange={(g) => setData({ ...data, gender: g as 'male' | 'female' })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            placeholder="+225..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'habitation *</label>
          <input
            type="text"
            required
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation *</label>
          <input
            type="date"
            required
            value={data.evangelizationDate}
            onChange={(e) => setData({ ...data, evangelizationDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'évangélisation</label>
          <input
            type="text"
            value={data.evangelizationLocation}
            onChange={(e) => setData({ ...data, evangelizationLocation: e.target.value })}
            placeholder="Optionnel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => setData({ ...data, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-60"
      >
        {submitting ? 'Enregistrement...' : 'Enregistrer l\'âme évangélisée'}
      </button>
    </form>
  );
}
