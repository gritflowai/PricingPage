import React, { useState, useEffect } from 'react';
import PricingToggle from './components/PricingToggle';
import CompanySlider from './components/CompanySlider';
import Settings from './components/Settings';
import ContactModal from './components/ContactModal';
import Tooltip from './components/Tooltip';
import { AlertCircle, ChevronDown, Shield, CreditCard, RefreshCw } from 'lucide-react';
import { useIframeMessaging } from './hooks/useIframeMessaging';

// Define plan types
type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale';

interface PricingTier {
  firstUnit: number;
  lastUnit: number;
  perUnit: number;
  flatFee: number;
}

interface PlanConfig {
  name: string;
  pricingTiers: PricingTier[];
  connections: number;
  usersPerCompany: number;
  scorecardsPerCompany: number | 'unlimited';
  aiTokensPerCompany: number;
  contactThreshold: number;
}

// AI Advisor pricing tier
const AI_PRICING_TIER: PricingTier[] = [
  { firstUnit: 1, lastUnit: Infinity, perUnit: 19, flatFee: 0 }
];

// Starter plan pricing tiers
const STARTER_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 9, perUnit: 90, flatFee: 0 },
  { firstUnit: 10, lastUnit: 24, perUnit: 50, flatFee: 200 },
  { firstUnit: 25, lastUnit: 34, perUnit: 34, flatFee: 300 },
  { firstUnit: 35, lastUnit: 49, perUnit: 24, flatFee: 400 }
];

// Growth plan pricing tiers
const GROWTH_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 9, perUnit: 120, flatFee: 0 },
  { firstUnit: 10, lastUnit: 24, perUnit: 80, flatFee: 400 },
  { firstUnit: 25, lastUnit: 34, perUnit: 64, flatFee: 600 },
  { firstUnit: 35, lastUnit: 49, perUnit: 38, flatFee: 800 }
];

// Scale plan pricing tiers
const SCALE_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 9, perUnit: 150, flatFee: 0 },
  { firstUnit: 10, lastUnit: 24, perUnit: 110, flatFee: 600 },
  { firstUnit: 25, lastUnit: 34, perUnit: 94, flatFee: 800 },
  { firstUnit: 35, lastUnit: 49, perUnit: 68, flatFee: 1000 }
];

// Default plan configurations
const DEFAULT_PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  'ai-advisor': {
    name: 'AI Growth Advisor',
    pricingTiers: AI_PRICING_TIER,
    connections: 0,
    usersPerCompany: 1,
    scorecardsPerCompany: 'unlimited',
    aiTokensPerCompany: 5000,
    contactThreshold: 50
  },
  'starter': {
    name: 'Starter',
    pricingTiers: STARTER_PRICING_TIERS,
    connections: 1,
    usersPerCompany: 3,
    scorecardsPerCompany: 5,
    aiTokensPerCompany: 3000,
    contactThreshold: 50
  },
  'growth': {
    name: 'Growth',
    pricingTiers: GROWTH_PRICING_TIERS,
    connections: 3,
    usersPerCompany: 5,
    scorecardsPerCompany: 10,
    aiTokensPerCompany: 5000,
    contactThreshold: 50
  },
  'scale': {
    name: 'Scale',
    pricingTiers: SCALE_PRICING_TIERS,
    connections: 5,
    usersPerCompany: 10,
    scorecardsPerCompany: 'unlimited',
    aiTokensPerCompany: 10000,
    contactThreshold: 50
  }
};

function calculateBasePrice(count: number, pricingTiers: PricingTier[]): { total: number; perUnit: number; flatFee: number } {
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

function calculateVolumeSavings(count: number, currentTierIndex: number, pricingTiers: PricingTier[]): number {
  // If we're in the first tier, there are no volume savings
  if (currentTierIndex === 0 || pricingTiers.length === 0) return 0;

  const firstTier = pricingTiers[0];
  const currentPrice = calculateBasePrice(count, pricingTiers).total;

  // Calculate what it would cost at the first tier's per-unit rate
  const firstTierPrice = count * firstTier.perUnit;

  // Calculate savings percentage
  if (firstTierPrice === 0) return 0;
  const savingsPercent = ((firstTierPrice - currentPrice) / firstTierPrice) * 100;

  return Math.max(0, Math.round(savingsPercent));
}

// Parse URL parameters for embedding configuration
function getEmbedConfig() {
  const params = new URLSearchParams(window.location.search);

  return {
    isEmbedded: params.get('embedded') === 'true',
    theme: params.get('theme') || 'default',
    hideSettings: params.get('hideSettings') === 'true',
    initialPlan: params.get('plan') as PlanType | null,
    initialCount: params.has('count') ? parseInt(params.get('count')!, 10) : null,
    initialIsAnnual: params.has('annual') ? params.get('annual') === 'true' : null,
  };
}

function App() {
  // Get embedding configuration from URL parameters
  const embedConfig = getEmbedConfig();

  const [isAnnual, setIsAnnual] = useState(embedConfig.initialIsAnnual ?? true);
  const [count, setCount] = useState(embedConfig.initialCount ?? 10);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(embedConfig.initialPlan ?? 'starter');
  const [planConfigs, setPlanConfigs] = useState<Record<PlanType, PlanConfig>>(DEFAULT_PLAN_CONFIGS);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const [resellerCommission, setResellerCommission] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [isEnterpriseRequest, setIsEnterpriseRequest] = useState(false);

  const currentPlan = planConfigs[selectedPlan];

  // Initialize iframe messaging
  const {
    isInIframe,
    sendSelectionUpdate,
    sendUserAction,
    sendEnterpriseInquiry,
  } = useIframeMessaging({ enabled: embedConfig.isEmbedded });

  // Calculate all pricing values BEFORE useEffect hooks that reference them
  const basePrice = calculateBasePrice(count, currentPlan.pricingTiers);
  const totalPrice = basePrice.total;

  // Apply wholesale discount if applicable (only for non-annual pricing)
  const wholesaleDiscountAmount = !isAnnual && wholesaleDiscount > 0
    ? totalPrice * (wholesaleDiscount / 100)
    : 0;

  const priceBeforeAnnual = totalPrice - wholesaleDiscountAmount;
  const finalPrice = isAnnual ? priceBeforeAnnual * (10/12) : priceBeforeAnnual;

  // Calculate reseller commission
  const creditCardFee = finalPrice * 0.03;
  const netAmount = finalPrice - creditCardFee;
  const resellerCommissionAmount = resellerCommission > 0
    ? netAmount * (resellerCommission / 100)
    : 0;

  const pricePerUnit = finalPrice / count;

  // Calculate monthly savings for annual billing
  const monthlySavings = isAnnual ? priceBeforeAnnual * (2/12) : 0;

  // Find current tier and next tier
  const currentTier = currentPlan.pricingTiers.find(t => count >= t.firstUnit && count <= t.lastUnit);
  const currentTierIndex = currentPlan.pricingTiers.findIndex(t => count >= t.firstUnit && count <= t.lastUnit);
  const nextTier = currentTierIndex >= 0 && currentTierIndex < currentPlan.pricingTiers.length - 1
    ? currentPlan.pricingTiers[currentTierIndex + 1]
    : null;

  // Calculate volume savings for current tier
  const volumeSavingsPercent = calculateVolumeSavings(count, currentTierIndex, currentPlan.pricingTiers);

  // Auto-trigger ContactModal when count reaches enterprise threshold
  useEffect(() => {
    if (count >= currentPlan.contactThreshold) {
      setIsEnterpriseRequest(false);
      setShowContactModal(true);
      // Send enterprise inquiry event
      sendEnterpriseInquiry(count, currentPlan.name);
    }
  }, [count, currentPlan.contactThreshold, currentPlan.name, sendEnterpriseInquiry]);

  // Send selection updates whenever pricing-related state changes
  useEffect(() => {
    if (count < currentPlan.contactThreshold) {
      sendSelectionUpdate({
        selectedPlan,
        count,
        isAnnual,
        finalPrice,
        pricePerUnit,
        totalPrice,
        monthlySavings,
        wholesaleDiscountAmount,
        resellerCommissionAmount,
        wholesaleDiscount,
        resellerCommission,
        planDetails: {
          name: currentPlan.name,
          connections: currentPlan.connections,
          users: selectedPlan === 'ai-advisor' ? count : count * currentPlan.usersPerCompany,
          scorecards: currentPlan.scorecardsPerCompany === 'unlimited'
            ? 'unlimited'
            : (selectedPlan === 'ai-advisor' ? currentPlan.scorecardsPerCompany : currentPlan.scorecardsPerCompany * count),
          aiTokens: count * currentPlan.aiTokensPerCompany,
        },
      });
    }
  }, [
    selectedPlan,
    count,
    isAnnual,
    finalPrice,
    pricePerUnit,
    totalPrice,
    monthlySavings,
    wholesaleDiscountAmount,
    resellerCommissionAmount,
    wholesaleDiscount,
    resellerCommission,
    currentPlan,
    sendSelectionUpdate,
  ]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Tooltip content
  const tooltips = {
    users: "Number of team members who can access your account",
    companies: "Number of client companies you can manage and track",
    connections: "Number of data integrations available (APIs, databases, etc.)",
    scorecards: "Number of performance scorecards you can create per company",
    aiTokens: "Monthly AI credits for automated insights and analysis"
  };

  // Calculate features based on selected plan
  const planFeatures = selectedPlan === 'ai-advisor'
    ? [
        { value: count, label: 'User(s)', icon: 'fa-sharp fa-regular fa-user', tooltip: tooltips.users },
        { value: currentPlan.connections, label: 'Connections', icon: 'fa-sharp fa-regular fa-link', tooltip: tooltips.connections },
        { value: currentPlan.scorecardsPerCompany === 'unlimited' ? '∞' : currentPlan.scorecardsPerCompany, label: 'Scorecards', icon: 'fa-sharp fa-regular fa-chart-line', tooltip: tooltips.scorecards },
        { value: (count * currentPlan.aiTokensPerCompany).toLocaleString(), label: 'AI Tokens', icon: 'fa-sharp fa-regular fa-sparkles', tooltip: tooltips.aiTokens }
      ]
    : [
        { value: count, label: 'Companies', icon: 'fa-sharp fa-regular fa-building', tooltip: tooltips.companies },
        { value: currentPlan.connections, label: 'Connections', icon: 'fa-sharp fa-regular fa-link', tooltip: tooltips.connections },
        { value: count * currentPlan.usersPerCompany, label: 'Users', icon: 'fa-sharp fa-regular fa-users', tooltip: tooltips.users },
        { value: currentPlan.scorecardsPerCompany === 'unlimited' ? '∞' : (currentPlan.scorecardsPerCompany * count).toLocaleString(), label: 'Scorecards', icon: 'fa-sharp fa-regular fa-chart-line', tooltip: tooltips.scorecards },
        { value: (count * currentPlan.aiTokensPerCompany).toLocaleString(), label: 'AI Tokens', icon: 'fa-sharp fa-regular fa-sparkles', tooltip: tooltips.aiTokens }
      ];

  const handlePricingUpdate = (
    updatedConfigs: Record<PlanType, PlanConfig>,
    newWholesaleDiscount: number,
    newResellerCommission: number
  ) => {
    setPlanConfigs(updatedConfigs);
    setWholesaleDiscount(newWholesaleDiscount);
    setResellerCommission(newResellerCommission);
  };

  // Determine background color based on theme
  const backgroundColor = embedConfig.theme === 'transparent'
    ? 'transparent'
    : 'bg-[#F0F4FF]';

  // Use min-h-fit for embedded mode to allow flexible height
  const minHeight = embedConfig.isEmbedded ? 'min-h-fit' : 'min-h-screen';

  return (
    <div className={`${minHeight} ${backgroundColor} p-2`}>
      <div className="max-w-6xl mx-auto mb-8 pt-3">
        <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 p-1 overflow-visible relative">
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={() => setSelectedPlan('ai-advisor')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'ai-advisor'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base md:text-lg">AI Growth Advisor</div>
              <div className="text-xs md:text-sm mt-1 opacity-80">$19/user • 0 connections</div>
            </button>
            <button
              onClick={() => setSelectedPlan('starter')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'starter'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base md:text-lg">Starter</div>
              <div className="text-xs md:text-sm mt-1 opacity-80">1 connection • From $90</div>
            </button>
            <button
              onClick={() => setSelectedPlan('growth')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition relative ${
                selectedPlan === 'growth'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              {/* Most Popular Badge */}
              <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] md:text-xs font-bold px-3 md:px-4 py-1 rounded-full shadow-md">
                  MOST POPULAR
                </div>
              </div>
              <div className="font-bold text-base md:text-lg">Growth</div>
              <div className="text-xs md:text-sm mt-1 opacity-80">3 connections • From $120</div>
            </button>
            <button
              onClick={() => setSelectedPlan('scale')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'scale'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base md:text-lg">Scale</div>
              <div className="text-xs md:text-sm mt-1 opacity-80">5 connections • From $150</div>
            </button>
            <button
              onClick={() => {
                setIsEnterpriseRequest(true);
                setShowContactModal(true);
              }}
              className="flex-1 px-4 py-3 rounded-md smooth-transition bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-[#180D43] hover:to-[#1239FF] hover:shadow-lg"
            >
              <div className="font-bold text-base md:text-lg">Enterprise</div>
              <div className="text-xs md:text-sm mt-1 opacity-90">Custom pricing • Unlimited</div>
            </button>
          </div>
        </div>
      </div>

      <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} monthlySavings={monthlySavings} />
      
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
                pricingTiers={currentPlan.pricingTiers}
                label={selectedPlan === 'ai-advisor' ? "Select Number of Users" : "Select Number of Companies"}
                maxCompanies={currentPlan.contactThreshold}
                contactThreshold={currentPlan.contactThreshold}
                onExceedThreshold={() => {
                  setIsEnterpriseRequest(false);
                  setShowContactModal(true);
                }}
              />

              {/* Volume Discount Indicator */}
              {selectedPlan !== 'ai-advisor' && currentTier && (
                <div className="space-y-2">
                  {/* Volume Discount Badge - Only show if there are savings */}
                  {volumeSavingsPercent > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                        SAVE {volumeSavingsPercent}% • VOLUME DISCOUNT
                      </div>
                    </div>
                  )}

                  {/* Next Tier Preview */}
                  {nextTier && (
                    <div className="text-center text-xs text-[#180D43]/70 bg-blue-50 border border-blue-100 rounded-lg py-2 px-3">
                      {(() => {
                        const companiesNeeded = nextTier.firstUnit - count;
                        const nextTierSavings = calculateVolumeSavings(nextTier.firstUnit, currentTierIndex + 1, currentPlan.pricingTiers);
                        return (
                          <>
                            <span className="font-medium text-[#1239FF]">
                              Add {companiesNeeded} more {companiesNeeded === 1 ? (selectedPlan === 'ai-advisor' ? 'user' : 'company') : (selectedPlan === 'ai-advisor' ? 'users' : 'companies')} to unlock {nextTierSavings}% savings
                            </span>
                            {nextTier.perUnit > 0 && (
                              <span className="ml-1">• ${nextTier.perUnit}/unit</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Only show Price Summary when below enterprise threshold */}
          {count < currentPlan.contactThreshold && (
            <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 overflow-hidden">
              <div className="bg-[#1239FF] text-white p-2">
                <h2 className="text-sm font-semibold">Price Summary</h2>
              </div>
              <div className="p-3">
              {/* Simplified Price Display */}
              <div className="text-center py-4">
                <div className="text-4xl md:text-5xl font-bold gradient-text-primary mb-2 animate-count" role="status" aria-live="polite" aria-label={`Price: $${formatNumber(finalPrice)} per month`}>
                  ${formatNumber(finalPrice)}
                  <span className="text-lg md:text-xl font-normal text-[#180D43]/70">/mo</span>
                </div>
                <div className="text-base md:text-lg text-[#180D43]/80 mb-1">
                  {count} {selectedPlan === 'ai-advisor' ? 'users' : 'companies'} • <span className="font-semibold text-[#1239FF]">${formatNumber(pricePerUnit)}</span> each
                </div>
                {isAnnual && (
                  <div className="text-xs md:text-sm text-green-600 font-medium">
                    Billed annually (${formatNumber(finalPrice * 12)}/year)
                  </div>
                )}
              </div>

              {/* CTA Button moved higher */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    sendUserAction('START_FREE_TRIAL', {
                      selectedPlan,
                      count,
                      isAnnual,
                      finalPrice,
                      pricePerUnit,
                      totalPrice,
                      monthlySavings,
                      wholesaleDiscountAmount,
                      resellerCommissionAmount,
                      wholesaleDiscount,
                      resellerCommission,
                      planDetails: {
                        name: currentPlan.name,
                        connections: currentPlan.connections,
                        users: selectedPlan === 'ai-advisor' ? count : count * currentPlan.usersPerCompany,
                        scorecards: currentPlan.scorecardsPerCompany === 'unlimited'
                          ? 'unlimited'
                          : (selectedPlan === 'ai-advisor' ? currentPlan.scorecardsPerCompany : currentPlan.scorecardsPerCompany * count),
                        aiTokens: count * currentPlan.aiTokensPerCompany,
                      },
                    });
                  }}
                  className="w-full bg-[#1239FF] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#1239FF]/90 smooth-transition transform hover:scale-[1.02] glow-blue hover:glow-blue-strong"
                >
                  Start Your Free Trial
                </button>

                {/* Trust Indicators */}
                <div className="flex justify-center gap-4 mt-3 text-xs text-[#180D43]/60">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Cancel anytime
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    7-day free trial
                  </span>
                </div>
              </div>

              {/* Collapsible Pricing Details */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => setShowPricingDetails(!showPricingDetails)}
                  className="flex items-center justify-center gap-2 text-sm text-[#1239FF] hover:text-[#1239FF]/80 font-medium w-full py-2"
                >
                  {showPricingDetails ? 'Hide' : 'Show'} pricing details
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPricingDetails ? 'rotate-180' : ''}`} />
                </button>

                {showPricingDetails && (
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3 mt-3 text-xs md:text-sm">
                    <div className="space-y-2">
                      <div className="border-b border-gray-200 pb-2">
                        <div className="font-medium text-sm md:text-base">{selectedPlan === 'ai-advisor' ? 'Users' : 'Companies'} ({count}):</div>
                        {basePrice.perUnit > 0 && (
                          <div className="flex justify-between text-[#180D43]/70 text-xs md:text-sm">
                            <span className="truncate mr-2">{count} × ${formatNumber(basePrice.perUnit / count)}/unit</span>
                            <span className="whitespace-nowrap">${formatNumber(basePrice.perUnit)}/mo</span>
                          </div>
                        )}
                        {basePrice.flatFee > 0 && (
                          <div className="flex justify-between text-[#180D43]/70 text-xs md:text-sm">
                            <span>Flat monthly fee</span>
                            <span className="whitespace-nowrap">${formatNumber(basePrice.flatFee)}/mo</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium mt-1 text-xs md:text-sm">
                          <span>Subtotal:</span>
                          <span className="whitespace-nowrap">${formatNumber(basePrice.total)}/mo</span>
                        </div>
                      </div>

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
                            <span>Annual discount (2 months free)</span>
                            <span>-${formatNumber(priceBeforeAnnual * (2/12))}/mo</span>
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
                        <div className="flex justify-between font-medium">
                          <span>Final Monthly Cost:</span>
                          <span className="text-[#1239FF]">${formatNumber(finalPrice)}/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="grid grid-cols-2 gap-3">
                  {planFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <i className={`${feature.icon} text-[#1239FF] text-base`} aria-label={feature.label} role="img"></i>
                      <div className="flex items-center gap-1">
                        <div>
                          <span className="font-semibold text-[#1239FF]">{feature.value}</span>
                          <span className="text-sm text-[#180D43] ml-1">{feature.label}</span>
                        </div>
                        <Tooltip content={feature.tooltip} position="top" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {!embedConfig.hideSettings && (
        <Settings
          planConfigs={planConfigs}
          wholesaleDiscount={wholesaleDiscount}
          resellerCommission={resellerCommission}
          onUpdatePricing={handlePricingUpdate}
          isEmbedded={embedConfig.isEmbedded}
        />
      )}

      <ContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setIsEnterpriseRequest(false);
        }}
        count={isEnterpriseRequest ? 0 : count}
        planName={isEnterpriseRequest ? "Enterprise" : currentPlan.name}
        unitLabel={selectedPlan === 'ai-advisor' ? 'users' : 'companies'}
        onUserAction={(action) => {
          sendUserAction(action, {
            selectedPlan,
            count,
            isAnnual,
            finalPrice,
            pricePerUnit,
            totalPrice,
            monthlySavings,
            wholesaleDiscountAmount,
            resellerCommissionAmount,
            wholesaleDiscount,
            resellerCommission,
            planDetails: {
              name: currentPlan.name,
              connections: currentPlan.connections,
              users: selectedPlan === 'ai-advisor' ? count : count * currentPlan.usersPerCompany,
              scorecards: currentPlan.scorecardsPerCompany === 'unlimited'
                ? 'unlimited'
                : (selectedPlan === 'ai-advisor' ? currentPlan.scorecardsPerCompany : currentPlan.scorecardsPerCompany * count),
              aiTokens: count * currentPlan.aiTokensPerCompany,
            },
          });
        }}
      />
    </div>
  );
}

export default App;