import { Search } from 'lucide-react';

interface TeachingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSpeaker: string;
  onSpeakerChange: (value: string) => void;
  categories: string[];
  speakers: string[];
}

interface ChipsRowProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  allLabel: string;
}

function ChipsRow({ options, selected, onChange, allLabel }: ChipsRowProps) {
  const baseChip =
    'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap';
  const activeChip = 'bg-[#00665C] text-white border-[#00665C]';
  const idleChip = 'bg-white text-gray-600 border-gray-200 hover:border-gray-300';

  return (
    <div className="overflow-x-auto flex gap-2 pb-1 -mx-1 px-1 scrollbar-hide">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`${baseChip} ${selected === '' ? activeChip : idleChip}`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`${baseChip} ${selected === opt ? activeChip : idleChip}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function TeachingFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSpeaker,
  onSpeakerChange,
  categories,
  speakers
}: TeachingFiltersProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search bar — same on all viewports */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un audio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {/* Mobile: chips scrollables */}
      <div className="sm:hidden space-y-2">
        {categories.length > 0 && (
          <ChipsRow
            options={categories}
            selected={selectedCategory}
            onChange={onCategoryChange}
            allLabel="Toutes les catégories"
          />
        )}
        {speakers.length > 0 && (
          <ChipsRow
            options={speakers}
            selected={selectedSpeaker}
            onChange={onSpeakerChange}
            allLabel="Tous les orateurs"
          />
        )}
      </div>

      {/* Desktop: selects */}
      <div className="hidden sm:flex sm:space-x-4">
        <div className="flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={selectedSpeaker}
            onChange={(e) => onSpeakerChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Tous les orateurs</option>
            {speakers.map(speaker => (
              <option key={speaker} value={speaker}>{speaker}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
