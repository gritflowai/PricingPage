import React, { useState } from 'react';
import PricingToggle from './components/PricingToggle';
import ConnectionSlider from './components/ConnectionSlider';
import CompanySlider from './components/CompanySlider';
import Settings from './components/Settings';
import { Check, AlertCircle } from 'lucide-react';

const DEFAULT_PRICING_TIERS = [
  { firstUnit: 1, lastUnit: 5, perUnit: 53, flatFee: 0 },
  { firstUnit: 6, lastUnit: 10, perUnit: 0, flatFee: 280 },
  { firstUnit: 11, lastUnit: 14, perUnit: 28, flatFee: 280 },
  { firstUnit: 15, lastUnit: 25, perUnit: 0, flatFee: 400 },
  { firstUnit: 26, lastUnit: 46, perUnit: 15, flatFee: 25 },
  { firstUnit: 47, lastUnit: 50, perUnit: 0, flatFee: 720 },
  { firstUnit: 51, lastUnit: Infinity, perUnit: 12, flatFee: 120 }
];

const AI_PRICING_TIER = [
  { firstUnit: 1, lastUnit: Infinity, perUnit: 19, flatFee: 0 }
];

function calculateBasePrice(count: number, pricingTiers: typeof DEFAULT_PRICING_TIERS): { total: number; perUnit: number; flatFee: number } {
  const tier = pricingTiers.find(t => count >= t.firstUnit && count <= t.lastUnit);
  if (!tier) return { total: 0, perUnit: 0, flatFee: 0 };

  if (tier.perUnit === 0) {
    // For flat fee tiers, just return the flat fee
    return {
      total: tier.flatFee,
      perUnit: 0,
      flatFee: tier.flatFee
    };
  } else {
    // For per-unit pricing tiers, calculate total based on count
    return {
      total: tier.flatFee + (count * tier.perUnit),
      perUnit: count * tier.perUnit,
      flatFee: tier.flatFee
    };
  }
}

function App() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [connections, setConnections] = useState(1);
  const [count, setCount] = useState(10);
  const [pricingTiers, setPricingTiers] = useState(DEFAULT_PRICING_TIERS);
  const [connectionPrice, setConnectionPrice] = useState(12);
  const [useSimplePricing, setUseSimplePricing] = useState(false);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const [resellerCommission, setResellerCommission] = useState(0);

  const currentTiers = useSimplePricing ? AI_PRICING_TIER : pricingTiers;
  const basePrice = calculateBasePrice(count, currentTiers);
  const additionalConnectionCost = useSimplePricing ? 0 : (connections - 1) * connectionPrice * count;
  const totalPrice = basePrice.total + additionalConnectionCost;
  
  // Apply wholesale discount if applicable (only for non-annual pricing)
  const wholesaleDiscountAmount = !isAnnual && wholesaleDiscount > 0 
    ? totalPrice * (wholesaleDiscount / 100) 
    : 0;
  
  const priceBeforeAnnual = totalPrice - wholesaleDiscountAmount;
  const finalPrice = isAnnual ? priceBeforeAnnual * 0.8 : priceBeforeAnnual;
  
  // Calculate reseller commission
  const creditCardFee = finalPrice * 0.03;
  const netAmount = finalPrice - creditCardFee;
  const resellerCommissionAmount = resellerCommission > 0 
    ? netAmount * (resellerCommission / 100) 
    : 0;

  const pricePerUnit = finalPrice / count;

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const standardFeatures = [
    { value: count, label: 'Companies' },
    { value: connections, label: 'Connections' },
    { value: count * 5, label: 'Users', note: '$5 per additional user' },
    { value: 10 + count, label: 'Scorecards' },
    { value: count * 5000, label: 'AI Tokens' }
  ];

  const simpleFeatures = [
    { value: count, label: 'User(s)' },
    { value: '∞', label: 'Manual Scorecards' },
    { value: count * 5000, label: 'AI Tokens' }
  ];

  const handlePricingUpdate = (
    newTiers: typeof DEFAULT_PRICING_TIERS, 
    newConnectionPrice: number,
    newWholesaleDiscount: number,
    newResellerCommission: number
  ) => {
    setPricingTiers(newTiers);
    setConnectionPrice(newConnectionPrice);
    setWholesaleDiscount(newWholesaleDiscount);
    setResellerCommission(newResellerCommission);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] p-2">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setUseSimplePricing(false)}
            className={`px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105 ${!useSimplePricing ? 'bg-[#1239FF] text-white shadow-lg' : 'bg-white text-[#1239FF]'}`}
          >
            <div className="text-xl font-bold mb-1">Standard Connection Plan</div>
            <div className="text-sm opacity-90">Starting at $53</div>
          </button>
          <button
            onClick={() => setUseSimplePricing(true)}
            className={`px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105 ${useSimplePricing ? 'bg-[#1239FF] text-white shadow-lg' : 'bg-white text-[#1239FF]'}`}
          >
            <div className="text-xl font-bold mb-1">AI Growth Advisor Only</div>
            <div className="text-sm opacity-90">Starting at $19 - No Connection</div>
          </button>
        </div>
      </div>

      <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
      
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 overflow-hidden">
            <div className="bg-[#1239FF] text-white p-2">
              <h2 className="text-sm font-semibold">Configure Your Plan</h2>
            </div>
            <div className="p-3 space-y-4">
              <CompanySlider 
                companies={count}
                setCompanies={setCount}
                pricingTiers={currentTiers}
                label={useSimplePricing ? "Select Number of Users" : "Select Number of Companies"}
              />
              {!useSimplePricing && (
                <ConnectionSlider 
                  connections={connections}
                  setConnections={setConnections}
                  companies={count}
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 overflow-hidden">
            <div className="bg-[#1239FF] text-white p-2">
              <h2 className="text-sm font-semibold">Price Summary</h2>
            </div>
            <div className="p-3">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <h3 className="font-medium mb-2">Calculation Breakdown:</h3>
                
                <div className="space-y-2">
                  <div className="border-b border-gray-200 pb-2">
                    <div className="font-medium">{useSimplePricing ? 'Users' : 'Companies'} ({count}):</div>
                    {basePrice.perUnit > 0 && (
                      <div className="flex justify-between text-[#180D43]/70">
                        <span>{count} {useSimplePricing ? 'users' : 'companies'} × ${formatNumber(basePrice.perUnit / count)}/unit</span>
                        <span>${formatNumber(basePrice.perUnit)}/mo</span>
                      </div>
                    )}
                    {basePrice.flatFee > 0 && (
                      <div className="flex justify-between text-[#180D43]/70">
                        <span>Flat monthly fee</span>
                        <span>${formatNumber(basePrice.flatFee)}/mo</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium mt-1">
                      <span>Subtotal:</span>
                      <span>${formatNumber(basePrice.total)}/mo</span>
                    </div>
                  </div>

                  {!useSimplePricing && connections > 1 && (
                    <div className="border-b border-gray-200 pb-2">
                      <div className="font-medium">Additional Connections ({connections - 1}):</div>
                      <div className="flex justify-between text-[#180D43]/70">
                        <span>{connections - 1} connections × {count} companies × ${connectionPrice}</span>
                        <span>${formatNumber(additionalConnectionCost)}/mo</span>
                      </div>
                    </div>
                  )}

                  {wholesaleDiscount > 0 && !isAnnual && (
                    <div className="border-b border-gray-200 pb-2">
                      <div className="flex justify-between text-blue-600">
                        <span>Wholesale discount ({wholesaleDiscount}%)</span>
                        <span>-${formatNumber(wholesaleDiscountAmount)}/mo</span>
                      </div>
                    </div>
                  )}

                  {isAnnual && (
                    <div className="border-b border-gray-200 pb-2">
                      <div className="flex justify-between text-green-600">
                        <span>Annual discount (20%)</span>
                        <span>-${formatNumber(priceBeforeAnnual * 0.2)}/mo</span>
                      </div>
                    </div>
                  )}

                  {resellerCommission > 0 && (
                    <div className="border-b border-gray-200 pb-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[#180D43]/70">
                          <span>Credit card fee (3%)</span>
                          <span>-${formatNumber(creditCardFee)}/mo</span>
                        </div>
                        <div className="flex justify-between text-[#180D43]/70">
                          <span>Net amount</span>
                          <span>${formatNumber(netAmount)}/mo</span>
                        </div>
                        <div className="flex justify-between text-blue-600 pt-1 border-t border-gray-200">
                          <span>Reseller commission ({resellerCommission}%)</span>
                          <span>${formatNumber(resellerCommissionAmount)}/mo</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">Total Monthly Cost:</span>
                      <div>
                        <span className="text-3xl font-bold text-[#1239FF]">${formatNumber(finalPrice)}</span>
                        <span className="text-sm text-[#180D43]/70 ml-1">/mo</span>
                      </div>
                    </div>
                    <div className="text-sm text-[#180D43]/70 mt-1">
                      ${formatNumber(pricePerUnit)} per {useSimplePricing ? 'user' : 'company'}
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-green-600 mt-1">
                        Billed annually (${formatNumber(finalPrice * 12)})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {wholesaleDiscount > 0 && isAnnual && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    Wholesale pricing is not available with annual billing. Switch to monthly billing to apply the wholesale discount.
                  </div>
                </div>
              )}

              <div className="bg-[#F0F4FF] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#180D43] mb-3">Plan Includes</h3>
                <div className="grid grid-cols-3 divide-x divide-gray-200">
                  {(useSimplePricing ? simpleFeatures : standardFeatures).map((feature, index) => (
                    <div key={index} className="px-4 text-center">
                      <div className="text-2xl font-bold text-[#1239FF] mb-1">
                        {feature.value}
                      </div>
                      <div className="text-sm text-[#180D43]">{feature.label}</div>
                      {feature.note && (
                        <div className="text-[10px] text-[#180D43]/70 mt-0.5">{feature.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="w-full bg-[#1239FF] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#1239FF]/90 transition-all transform hover:scale-[1.02] shadow-lg">
                  Start Your 7 Day Free Trial
                </button>
                <p className="text-center text-sm text-[#180D43]/70">No card required</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!useSimplePricing && (
        <Settings
          pricingTiers={pricingTiers}
          connectionPrice={connectionPrice}
          onUpdatePricing={handlePricingUpdate}
        />
      )}
    </div>
  );
}

export default App;