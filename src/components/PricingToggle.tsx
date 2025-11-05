import React from 'react';

interface PricingToggleProps {
  isAnnual: boolean;
  setIsAnnual: (value: boolean) => void;
  monthlySavings?: number;
  isEmbedded?: boolean;
  disabled?: boolean;
}

const PricingToggle: React.FC<PricingToggleProps> = ({ isAnnual, setIsAnnual, monthlySavings, isEmbedded = false, disabled = false }) => {
  // Use compact bottom margin for embedded mode
  const bottomMargin = isEmbedded ? 'mb-3' : 'mb-4';

  return (
    <div className={`flex flex-col items-center ${bottomMargin}`}>
      <div
        className={`bg-white rounded-lg shadow-md p-1 inline-flex glow-blue ${disabled ? 'opacity-50' : ''}`}
        role="group"
        aria-label="Billing frequency selector"
      >
        <button
          onClick={() => setIsAnnual(false)}
          disabled={disabled}
          aria-label="Monthly billing"
          aria-pressed={!isAnnual}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-md font-semibold text-sm sm:text-base smooth-transition ${
            !isAnnual
              ? 'bg-[#1239FF] text-white shadow-sm'
              : 'bg-transparent text-gray-600 hover:text-gray-800'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          disabled={disabled}
          aria-label="Annual billing, save 2 months"
          aria-pressed={isAnnual}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-md font-semibold text-sm sm:text-base smooth-transition flex items-center gap-2 ${
            isAnnual
              ? 'bg-[#1239FF] text-white shadow-sm'
              : 'bg-transparent text-gray-600 hover:text-gray-800'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          Annual
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1239FF] text-white"
            aria-hidden="true"
          >
            2 MONTHS FREE
          </span>
        </button>
      </div>

      {/* You Save Callout */}
      {isAnnual && monthlySavings && monthlySavings > 0 && (
        <div className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-1.5 rounded-full shadow-lg animate-count">
          <span className="text-xs sm:text-sm font-bold">
            You Save ${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month with annual billing!
          </span>
        </div>
      )}
    </div>
  );
};

export default PricingToggle;