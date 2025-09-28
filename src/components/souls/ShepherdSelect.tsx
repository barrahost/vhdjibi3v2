import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShepherdOption } from '../../types/database.types';

interface ShepherdSelectProps {
  value: string | undefined;
  onChange: (shepherdId: string | undefined) => void;
  disabled?: boolean;
}

// Composant pour les options uniquement
function Options() {
  const [shepherds, setShepherds] = useState<ShepherdOption[]>([]);

  useEffect(() => {
    const loadShepherds = async () => {
      try {
        // Récupérer les bergers et stagiaires depuis la collection users
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['shepherd', 'intern']),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(q);
        const shepherdsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            fullName: doc.data().fullName,
            role: doc.data().role
          }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        
        setShepherds(shepherdsData);
      } catch (error) {
        console.error('Error loading shepherds:', error);
      }
    };

    loadShepherds();
  }, []);

  return (
    <>
      {shepherds.map(shepherd => (
        <option key={shepherd.id} value={shepherd.id}>
          {shepherd.fullName} {shepherd.role === 'intern' ? '(Stagiaire)' : ''}
        </option>
      ))}
    </>
  );
}

export default function ShepherdSelect({ value, onChange, disabled = false }: ShepherdSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? undefined : selectedValue);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
    >
      <option value="">Non assigné(e)</option>
      <Options />
    </select>
  );
}

ShepherdSelect.Options = Options;