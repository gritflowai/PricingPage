import React from 'react';

interface PricingCalculatorProps {
  connections: number;
  companies: number;
  isAnnual: boolean;
  basePrice: number;
  additionalPrice: number;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({ 
  connections, 
  companies,
  isAnnual, 
  basePrice, 
  additionalPrice 
}) => {
  const totalMonthlyPrice = basePrice + additionalPrice;
  const annualPrice = Math.floor(totalMonthlyPrice * 0.8);
  const currentPrice = isAnnual ? annualPrice : totalMonthlyPrice;
  const savings = isAnnual ? (totalMonthlyPrice * 12) - (annualPrice * 12) : 0;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-16">
      <div className="bg-indigo-600 text-white p-6">
        <h3 className="text-2xl font-bold mb-2">Your Personalized Price</h3>
        <p className="opacity-90">Based on your selected options</p>
      </div>
      <div className="p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-4">Selected Options</h4>
            <div className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Companies</span>
                <span className="font-medium">{companies}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Base price</span>
                <span className="font-medium">${basePrice}/mo</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">App connections</span>
                <span className="font-medium">{connections}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Additional connection cost</span>
                <span className="font-medium">${additionalPrice}/mo</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Billing cycle</span>
                <span className="font-medium">{isAnnual ? 'Annual' : 'Monthly'}</span>
              </div>
              {isAnnual && (
                <div className="flex justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Annual discount</span>
                  <span className="font-medium text-green-600">20%</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700 mb-4">Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">
                  {isAnnual ? 'Monthly equivalent' : 'Monthly price'}
                </span>
                <span className="font-medium">
                  ${isAnnual ? (annualPrice).toFixed(2) : totalMonthlyPrice}/mo
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">
                  {isAnnual ? 'Annual price' : 'Annual equivalent'}
                </span>
                <span className="font-medium">
                  ${isAnnual ? annualPrice * 12 : totalMonthlyPrice * 12}/year
                </span>
              </div>
              {isAnnual && (
                <div className="flex justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Annual savings</span>
                  <span className="font-medium text-green-600">${savings}</span>
                </div>
              )}
              <div className="pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-700 mb-2">
                    ${currentPrice}{isAnnual ? '/mo' : '/mo'}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {isAnnual ? 'Billed annually' : 'Billed monthly'}
                  </p>
                </div>
                <a
                  href="https://auth.autymate.com/Register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 block text-center"
                >
                  Start your free trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;