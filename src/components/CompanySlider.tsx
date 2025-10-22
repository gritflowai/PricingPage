import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface PricingTier {
  firstUnit: number;
  lastUnit: number;
  perUnit: number;
  flatFee: number;
}

interface CompanySliderProps {
  companies: number;
  setCompanies: (value: number) => void;
  minCompanies?: number;
  maxCompanies?: number;
  pricingTiers: PricingTier[];
  label: string;
}

const CompanySlider: React.FC<CompanySliderProps> = ({
  companies,
  setCompanies,
  minCompanies = 1,
  maxCompanies = 150,
  pricingTiers,
  label
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(companies.toString());
  const isAIMode = label.includes("User");

  function calculatePrice(companies: number): { price: number; tier: PricingTier } {
    const tier = pricingTiers.find(t => companies >= t.firstUnit && companies <= t.lastUnit);
    if (!tier) return { price: 0, tier: pricingTiers[0] };

    const price = tier.perUnit === 0 ? tier.flatFee : (companies * tier.perUnit) + tier.flatFee;
    return { price, tier };
  }

  const { price, tier } = calculatePrice(companies);
  const pricePerUnit = price / companies;

  const handleIncrement = () => {
    const newValue = Math.min(companies + 1, maxCompanies);
    setCompanies(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(companies - 1, minCompanies);
    setCompanies(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      const boundedValue = Math.min(Math.max(numValue, minCompanies), maxCompanies);
      setCompanies(boundedValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) {
      setInputValue(companies.toString());
    } else {
      const boundedValue = Math.min(Math.max(numValue, minCompanies), maxCompanies);
      setCompanies(boundedValue);
      setInputValue(boundedValue.toString());
    }
  };

  const unitLabel = isAIMode ? "user" : "company";

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-xl font-semibold text-center text-[#180D43] mb-6">
        {label}
      </h3>

      {!isAIMode && (
        <div className="grid grid-cols-4 gap-2 mb-8 text-center">
          {['Starter', 'Growth', 'Scale', 'Enterprise'].map((plan, index) => (
            <div
              key={plan}
              className={`p-2 rounded ${
                (companies > 46 && plan === 'Enterprise') || 
                (companies <= 46 && index === Math.floor(companies / 15))
                  ? 'bg-[#1239FF] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="text-sm font-medium">{plan}</div>
              <div className="text-xs mt-1">
                {index === 0 ? '1-5' : index === 1 ? '6-14' : index === 2 ? '15-46' : '47+'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-8">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-20 text-center bg-[#1239FF] text-white px-3 py-1 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1239FF]/50"
              autoFocus
              min={minCompanies}
              max={maxCompanies}
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="bg-[#1239FF] text-white px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-[#1239FF]/90 transition-colors"
            >
              {companies}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <input
            type="range"
            min={minCompanies}
            max={maxCompanies}
            value={companies}
            onChange={(e) => {
              setCompanies(parseInt(e.target.value));
              setInputValue(e.target.value);
            }}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1239FF]"
          />
          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {companies > 50 && (
        <div className="bg-[#F0F4FF] rounded-lg p-3 mb-6 text-center">
          <p className="text-[#1239FF] font-medium mb-1">Need more than 50 {unitLabel}s?</p>
          <a 
            href="#" 
            className="inline-block px-4 py-1.5 bg-white text-[#1239FF] rounded-full text-sm font-medium hover:bg-[#1239FF] hover:text-white transition-colors"
          >
            Contact us for Enterprise pricing
          </a>
        </div>
      )}

      <div className="text-center space-y-4">
        <div className="flex items-baseline justify-center gap-2">
          <div className="text-5xl font-bold text-[#180D43]">
            {companies}
          </div>
          <div className="text-xl text-[#180D43]/70">{unitLabel}s</div>
        </div>

        <div className="flex items-baseline justify-center gap-2">
          <div className="text-5xl font-bold text-[#1239FF]">
            ${price.toLocaleString()}
          </div>
          <div className="text-xl text-[#180D43]/70">/ month</div>
        </div>

        <div className="text-lg text-[#180D43]">
          only ${pricePerUnit.toFixed(2)} per {unitLabel}
        </div>
      </div>
    </div>
  );
};

export default CompanySlider;