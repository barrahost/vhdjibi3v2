import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { EvangelizedSoul } from '../../types/evangelized.types';
import toast from 'react-hot-toast';

interface Props {
  soul: EvangelizedSoul;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditEvangelizedSoulModal({ soul, isOpen, onClose, onUpdated }: Props) {
  const [data, setData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    location: '',
    evangelizationDate: '',
    evangelizationLocation: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const d = soul.evangelizationDate
      ? new Date(soul.evangelizationDate).toISOString().split('T')[0]
      : '';
    setData({
      fullName: soul.fullName || '',
      nickname: soul.nickname || '',
      gender: soul.gender || 'male',
      phone: soul.phone || '',
      location: soul.location || '',
      evangelizationDate: d,
      evangelizationLocation: soul.evangelizationLocation || '',
      notes: soul.notes || '',
      status: soul.status || 'active',
    });
  }, [soul, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) return toast.error('Le nom est obligatoire');
    try {
      setSubmitting(true);
      await updateDoc(doc(db, 'evangelized_souls', soul.id), {
        fullName: data.fullName.trim(),
        nickname: data.nickname.trim() || null,
        gender: data.gender,
        phone: data.phone.trim(),
        location: data.location.trim(),
        evangelizationDate: data.evangelizationDate ? new Date(data.evangelizationDate) : null,
        evangelizationLocation: data.evangelizationLocation.trim() || null,
        notes: data.notes.trim() || null,
        status: data.status,
        updatedAt: new Date(),
      });
      toast.success('Âme mise à jour');
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'âme évangélisée">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénoms *</label>
            <input type="text" required value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Surnom</label>
            <input type="text" value={data.nickname}
              onChange={(e) => setData({ ...data, nickname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>

        <GenderRadioGroup value={data.gender} onChange={(g) => setData({ ...data, gender: g })} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'habitation</label>
            <input type="text" value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évangélisation</label>
            <input type="date" value={data.evangelizationDate}
              onChange={(e) => setData({ ...data, evangelizationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'évangélisation</label>
            <input type="text" value={data.evangelizationLocation}
              onChange={(e) => setData({ ...data, evangelizationLocation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3} value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select value={data.status}
            onChange={(e) => setData({ ...data, status: e.target.value as 'active' | 'inactive' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]">
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-60">
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
