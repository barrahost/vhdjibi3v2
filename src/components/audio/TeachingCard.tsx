import { Play } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface TeachingCardProps {
  id: string;
  title: string;
  speaker: string;
  date: Date;
  duration: number;
  category: string;
  theme?: string;
  thumbnail_url?: string | null;
  featured?: boolean;
  isSelected?: boolean;
  plays?: number;
  onClick: () => void;
}

const formatDurationShort = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatPlays = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function TeachingCard({
  title,
  speaker,
  date,
  duration,
  category,
  theme,
  thumbnail_url,
  featured,
  isSelected,
  plays,
  onClick
}: TeachingCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-[#00665C]' : ''
      }`}
    >
      {/* Mobile: horizontal layout (~80px) | Desktop (sm+): vertical */}
      <div className="flex flex-row sm:flex-col">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-full sm:h-32 flex-shrink-0 bg-gray-100">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-between">
          <div className="min-w-0">
            {/* Title + badges */}
            <div className="flex flex-wrap items-start justify-between gap-1.5 sm:mb-1">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 leading-tight line-clamp-2 flex-1 min-w-0">
                {title}
              </h3>
              <div className="hidden sm:flex flex-wrap gap-1">
                {featured && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    À la une
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                  {category}
                </span>
              </div>
            </div>

            {/* Speaker */}
            <p className="text-xs sm:text-sm text-gray-700 font-medium mt-0.5 sm:mb-1 truncate">
              {speaker}
            </p>

            {/* Theme — desktop only */}
            {theme && (
              <p className="hidden sm:block text-sm text-gray-600 line-clamp-1 mb-1">
                <span className="font-medium text-[#00665C]">Thème:</span> {theme}
              </p>
            )}
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between gap-2 mt-1.5 sm:mt-2 sm:pt-2 sm:border-t sm:border-gray-100">
            <div className="text-xs text-gray-500 flex items-center gap-1.5 min-w-0">
              <span className="truncate">{formatDurationShort(duration)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate">{formatDate(date)}</span>
              {typeof plays === 'number' && plays > 0 && (
                <>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatPlays(plays)} écoutes</span>
                </>
              )}
            </div>

            <div className="hidden sm:block text-xs font-medium text-[#00665C]">
              Écouter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
