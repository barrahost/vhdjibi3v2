import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StatDetail {
  label: string;
  value: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  trendLabel: string;
  iconClassName?: string;
  className?: string;
  details?: StatDetail[];
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  iconClassName = "text-[#F2B636]",
  className = '',
  details
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-[#00665C] relative ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-semibold text-[#00665C]">{value}</p>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-[#F2B636]">{trend}</span> {trendLabel}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${iconClassName}`} />
      </div>
      
      {details && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          <div className={`
            mt-4 pt-4 border-t space-y-2 transition-all duration-300
            ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
          `}>
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-sm text-gray-600">{detail.label}</span>
                <span className="text-sm font-medium text-gray-900">{detail.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}