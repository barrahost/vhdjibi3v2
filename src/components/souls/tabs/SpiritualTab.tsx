import { SpiritualProfile } from '../../../types/database.types';
import { ProgressionForm } from '../progression/ProgressionForm';
import { ProgressionTimeline } from '../progression/ProgressionTimeline';

interface SpiritualTabProps {
  data: SpiritualProfile;
  onChange: (data: SpiritualProfile) => void;
}

export function SpiritualTab({ data, onChange }: SpiritualTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-[#00665C] mb-4">
          Mettre à jour le profil
        </h3>
        <ProgressionForm value={data} onChange={onChange} />
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#00665C] mb-4">
          Progression spirituelle
        </h3>
        <ProgressionTimeline spiritualProfile={data} />
      </div>
    </div>
  );
}