import React from 'react';
import { Check } from 'lucide-react';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: number;
  isAnnual: boolean;
  additionalPrice?: number;
  connections?: number;
  features: PricingFeature[];
  isPopular?: boolean;
  buttonText?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  isAnnual,
  additionalPrice = 0,
  connections = 1,
  features,
  isPopular = false,
  buttonText = 'Get started'
}) => {
  const finalPrice = price + (additionalPrice * (connections - 1));
  const annualPrice = Math.floor(finalPrice * 0.8); // 20% discount for annual
  const displayPrice = isAnnual ? annualPrice : finalPrice;

  return (
    <div className={`bg-white rounded-xl overflow-hidden ${isPopular ? 'border-2 border-indigo-500 shadow-lg' : 'border border-gray-200 shadow'} flex flex-col`}>
      {isPopular && (
        <div className="bg-indigo-500 text-white text-center py-1.5 text-sm font-medium">
          Most popular
        </div>
      )}
      <div className="p-6 md:p-8 flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="mt-4 mb-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">${displayPrice}</span>
            <span className="text-gray-600 ml-2">/{isAnnual ? 'year' : 'month'}</span>
          </div>
          {isAnnual && (
            <p className="text-sm text-green-600 mt-1">
              Save ${finalPrice * 12 - annualPrice * 12} annually
            </p>
          )}
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${feature.included ? 'text-green-500' : 'text-gray-300'}`} />
              <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-500'}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6 pb-8">
        <button
          className={`w-full py-3 px-4 rounded-lg text-center font-medium ${
            isPopular
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } transition-colors duration-200`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;