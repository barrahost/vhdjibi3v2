import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Input } from '../../ui/Input';
import { LocationField } from '../form/LocationField';
import { GenderRadioGroup } from '../../ui/GenderRadioGroup';
import ShepherdSelect from '../ShepherdSelect';
import { Switch } from '../../ui/Switch';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface GeneralInfoTabProps {
  data: {
    gender: string;
    fullName: string;
    nickname: string;
    phone: string;
    location: string;
    coordinates: { latitude: number; longitude: number; } | null;
    firstVisitDate: string;
    shepherdId: string | undefined;
    isUndecided: boolean;
    status: 'active' | 'inactive';
    photo: File | null;
  };
  onChange: (data: any) => void;
  isShepherd?: boolean;
  currentShepherdId?: string | undefined;
}

export function GeneralInfoTab({ data, onChange, isShepherd, currentShepherdId }: GeneralInfoTabProps) {
  const [shepherdName, setShepherdName] = useState<string | null>(null);
  const [shepherdRole, setShepherdRole] = useState<string | null>(null);

  // Charger le nom du berger si une âme est assignée
  useEffect(() => {
    const loadShepherdName = async () => {
      if (!data.shepherdId) {
        setShepherdName(null);
        setShepherdRole(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', data.shepherdId));
        if (userDoc.exists()) {
          setShepherdName(userDoc.data().fullName);
          setShepherdRole(userDoc.data().role);
        } else {
          setShepherdName('Berger non trouvé');
          setShepherdRole(null);
        }
      } catch (error) {
        console.error('Error loading shepherd name:', error);
        setShepherdName('Erreur de chargement');
        setShepherdRole(null);
      }
    };

    loadShepherdName();
  }, [data.shepherdId]);

  const handleShepherdChange = (shepherdId: string | undefined) => {
    // Si c'est un berger, il ne peut pas changer l'assignation
    if (isShepherd && shepherdId !== currentShepherdId) {
      toast.error('En tant que berger, vous ne pouvez pas modifier l\'assignation');
      return;
    }
    onChange({ ...data, shepherdId: shepherdId === '' ? undefined : shepherdId });
  };

  return (
    <div className="space-y-4">
      <GenderRadioGroup
        value={data.gender}
        onChange={(gender) => onChange({ ...data, gender })}
      />

      <Input
        label="Nom et Prénoms"
        id="fullName"
        type="text"
        required
        placeholder="ex: Patrice Tano"
        value={data.fullName}
        onChange={(e) => onChange({ ...data, fullName: e.target.value })}
      />

      <Input
        label="Surnom"
        id="nickname"
        type="text"
        placeholder="ex: Pat"
        value={data.nickname}
        onChange={(e) => onChange({ ...data, nickname: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            +225
          </span>
          <input
            type="tel"
            required
            placeholder="0757000203"
            value={data.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              const truncated = value.slice(0, 10);
              onChange({ ...data, phone: truncated });
            }}
            className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            maxLength={10}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Entrez les 10 chiffres du numéro
        </p>
      </div>

      <LocationField
        location={data.location}
        coordinates={data.coordinates}
        onLocationChange={(location) => onChange({ ...data, location })}
        onCoordinatesChange={(coordinates) => onChange({ ...data, coordinates })}
      />

      <div className="space-y-2">
        <Switch
          checked={data.isUndecided || false}
          onCheckedChange={(checked) => {
            onChange({
              ...data,
              isUndecided: checked === true,
              // Si l'âme devient indécise, on retire l'assignation du berger
              shepherdId: checked ? undefined : data.shepherdId
            });
          }}
          label="Âme Indécis(e)"
          description="Cette âme n'est pas encore prête à être suivie"
          disabled={isShepherd || false}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Statut de l'âme
        </label>
        <select
          value={data.status}
          onChange={(e) => onChange({ ...data, status: e.target.value as 'active' | 'inactive' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          disabled={isShepherd || false}
        >
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <p className="text-sm text-gray-500">
          Une âme inactive n'apparaîtra plus dans les listes principales
        </p>
        {isShepherd && (
          <p className="mt-1 text-sm text-gray-500">
            En tant que berger(e), vous ne pouvez pas modifier le statut des âmes
          </p>
        )}
      </div>

      <Input
        label="Date de première visite"
        id="firstVisitDate"
        type="date"
        required
        value={data.firstVisitDate}
        onChange={(e) => onChange({ ...data, firstVisitDate: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Berger(e) ou Stagiaire assigné(e)
        </label>
        <ShepherdSelect
          value={data.shepherdId}
          onChange={handleShepherdChange}
          disabled={isShepherd || data.isUndecided}
        />
        {isShepherd && (
          <p className="mt-1 text-sm text-gray-500">
            En tant que berger(e) ou stagiaire, vous êtes automatiquement assigné(e) aux âmes que vous modifiez
          </p>
        )}
        {shepherdName && !isShepherd && (
          <p className="mt-1 text-sm text-gray-500">
            {shepherdRole === 'intern' ? 'Stagiaire' : 'Berger(e)'} actuel(le): {shepherdName}
          </p>
        )}
      </div>
    </div>
  );
}