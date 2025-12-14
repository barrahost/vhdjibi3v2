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
  onClick: () => void;
}

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
  onClick
}: TeachingCardProps) {
  // Format duration to minutes:seconds
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-[#00665C]' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail - Full width on mobile, fixed width on desktop */}
        <div className="w-full sm:w-32 sm:h-32 flex-shrink-0">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-32 sm:h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-32 sm:h-full bg-gray-100 flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Title and badges */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                {title}
              </h3>
              <div className="flex flex-wrap gap-1">
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
            <p className="text-sm text-gray-700 font-medium mb-1">{speaker}</p>
            
            {/* Theme */}
            {theme && (
              <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                <span className="font-medium text-[#00665C]">Thème:</span> {theme}
              </p>
            )}
          </div>

          {/* Footer info */}
          <div className="flex flex-wrap items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex items-center">
              <span className="mr-2">{formatDate(date)}</span>
              <span className="hidden sm:inline mx-1">•</span>
              <span className="hidden sm:inline">{formatDuration(duration)}</span>
            </div>
            
            <div className="text-xs font-medium text-[#00665C]">
              Écouter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}