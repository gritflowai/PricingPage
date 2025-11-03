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
  contactThreshold?: number;
  onExceedThreshold?: () => void;
}

const CompanySlider: React.FC<CompanySliderProps> = ({
  companies,
  setCompanies,
  minCompanies = 1,
  maxCompanies = 150,
  pricingTiers,
  label,
  contactThreshold,
  onExceedThreshold
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(companies.toString());
  const [tierCrossing, setTierCrossing] = useState(false);
  const isAIMode = label.includes("User");

  const handleIncrement = () => {
    const newValue = Math.min(companies + 1, maxCompanies);
    setCompanies(newValue);
    setInputValue(newValue.toString());
    if (contactThreshold && newValue > contactThreshold && onExceedThreshold) {
      onExceedThreshold();
    }
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
      if (contactThreshold && boundedValue > contactThreshold && onExceedThreshold) {
        onExceedThreshold();
      }
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    checkTierCrossing(companies, value);
    setCompanies(value);
    setInputValue(value.toString());
    if (contactThreshold && value > contactThreshold && onExceedThreshold) {
      onExceedThreshold();
    }
  };

  const checkTierCrossing = (oldValue: number, newValue: number) => {
    const oldTier = pricingTiers.find(t => oldValue >= t.firstUnit && oldValue <= t.lastUnit);
    const newTier = pricingTiers.find(t => newValue >= t.firstUnit && newValue <= t.lastUnit);

    if (oldTier && newTier && oldTier !== newTier) {
      setTierCrossing(true);
      setTimeout(() => setTierCrossing(false), 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      handleDecrement();
    }
  };

  // Extract unit label from the label prop (e.g., "Select Number of Locations" → "location")
  const unitLabel = isAIMode
    ? "user"
    : label.toLowerCase().includes('location')
      ? 'location'
      : label.toLowerCase().includes('client')
        ? 'client'
        : 'company';

  // Calculate slider percentage for gradient
  const sliderPercent = ((companies - minCompanies) / (maxCompanies - minCompanies)) * 100;

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-xl font-semibold text-center text-[#180D43] mb-8">
        {label}
      </h3>

      <div className="relative mb-8">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-24 text-center bg-[#1239FF] text-white px-4 py-2 rounded-full text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1239FF]/50 glow-blue"
              autoFocus
              min={minCompanies}
              max={maxCompanies}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="bg-[#1239FF] text-white px-4 py-2 rounded-full text-lg font-bold cursor-pointer hover:bg-[#1239FF]/90 smooth-transition glow-blue hover:glow-blue-strong"
            >
              {companies}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 smooth-transition hover:scale-110"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="range"
            min={minCompanies}
            max={maxCompanies}
            value={companies}
            onChange={handleSliderChange}
            onKeyDown={handleKeyDown}
            className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-gradient ${tierCrossing ? 'pulse-glow' : ''}`}
            style={{ '--slider-percent': `${sliderPercent}%` } as React.CSSProperties}
            aria-label={`Select number of ${unitLabel}s`}
            aria-valuemin={minCompanies}
            aria-valuemax={maxCompanies}
            aria-valuenow={companies}
          />
          <button
            onClick={handleIncrement}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 smooth-transition hover:scale-110"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-[#180D43]/70">
        Select the number of {unitLabel}s for your plan
      </div>
    </div>
  );
};

export default CompanySlider;