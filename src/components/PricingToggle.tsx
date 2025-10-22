import React from 'react';

interface PricingToggleProps {
  isAnnual: boolean;
  setIsAnnual: (value: boolean) => void;
}

const PricingToggle: React.FC<PricingToggleProps> = ({ isAnnual, setIsAnnual }) => {
  return (
    <div className="flex justify-center items-center mb-12">
      <span className={`mr-3 text-base font-medium ${!isAnnual ? 'text-indigo-900' : 'text-gray-500'}`}>
        Monthly
      </span>
      <button
        className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200"
        onClick={() => setIsAnnual(!isAnnual)}
        aria-pressed={isAnnual}
        aria-labelledby="annual-billing-label"
      >
        <span className="sr-only">Enable annual billing</span>
        <span
          className={`${
            isAnnual ? 'translate-x-9 bg-indigo-600' : 'translate-x-1 bg-white'
          } inline-block h-6 w-6 transform rounded-full transition-transform duration-200 ease-in-out shadow-md`}
        />
      </button>
      <span id="annual-billing-label" className={`ml-3 text-base font-medium ${isAnnual ? 'text-indigo-900' : 'text-gray-500'}`}>
        Annual <span className="ml-1 text-sm text-green-600 font-medium">Save 20%</span>
      </span>
    </div>
  );
};

export default PricingToggle;