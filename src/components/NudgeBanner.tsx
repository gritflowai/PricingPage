import React from 'react';
import { TrendingUp, Calendar, X } from 'lucide-react';

interface NudgeBannerProps {
  count: number;
  unitLabel: string; // "locations" or "users"
  onSchedule: () => void;
  onDismiss: () => void;
}

const NudgeBanner: React.FC<NudgeBannerProps> = ({
  count,
  unitLabel,
  onSchedule,
  onDismiss
}) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-4 mb-6 shadow-sm">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-blue-500 rounded-full p-2 mt-0.5 flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Unlock Custom Volume Pricing
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Organizations with <strong>{count}+ {unitLabel}</strong> typically save <strong>15-30%</strong> with our custom enterprise pricing.
            Schedule a quick 15-minute call to see your personalized quote.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onSchedule}
              className="flex items-center gap-2 bg-[#1239FF] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0F2DB8] transition-all transform hover:scale-[1.02]"
            >
              <Calendar className="w-4 h-4" />
              Schedule 15-Min Call
            </button>
            <button
              onClick={onDismiss}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 underline"
            >
              Continue with standard pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NudgeBanner;
