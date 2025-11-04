import React, { useState, useEffect } from 'react';
import PricingToggle from './components/PricingToggle';
import CompanySlider from './components/CompanySlider';
import Settings from './components/Settings';
import ContactModal from './components/ContactModal';
import Tooltip from './components/Tooltip';
import RoleSelector from './components/RoleSelector';
import FeatureComparison from './components/FeatureComparison';
import { AlertCircle, ChevronDown, Shield, CreditCard, RefreshCw } from 'lucide-react';
import { useIframeMessaging } from './hooks/useIframeMessaging';
import { calculateCustomDiscount, type DiscountType } from './utils/discountCalculator';

// Define plan types
type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale';

// Define user types for role selection
type UserType = 'cpa' | 'franchisee' | 'smb';

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
  metricsPerScorecard: number;
  aiTokensPerDollar: number;
  historicDataYears: number;
  contactThreshold: number;
  stripeProductId: string;
  features: {
    dailySync: boolean;
    immediateSyncCommand: boolean;
    billingFlexibility: boolean;
    customBranding: boolean;
  };
}

// AI Advisor pricing tiers (volume discounts for users)
const AI_PRICING_TIER: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 19, flatFee: 0 },
  { firstUnit: 6, lastUnit: 14, perUnit: 17, flatFee: 0 },
  { firstUnit: 15, lastUnit: 29, perUnit: 15, flatFee: 0 },
  { firstUnit: 30, lastUnit: 49, perUnit: 12, flatFee: 0 },
  { firstUnit: 50, lastUnit: 999, perUnit: 10, flatFee: 0 }
];

// Starter plan pricing tiers
const STARTER_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 90, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 50, flatFee: 200 },
  { firstUnit: 16, lastUnit: 30, perUnit: 35, flatFee: 425 },
  { firstUnit: 31, lastUnit: 50, perUnit: 25, flatFee: 725 },
  { firstUnit: 51, lastUnit: 999, perUnit: 20, flatFee: 975 }
];

// Growth plan pricing tiers
const GROWTH_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 180, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 100, flatFee: 400 },
  { firstUnit: 16, lastUnit: 30, perUnit: 65, flatFee: 925 },
  { firstUnit: 31, lastUnit: 50, perUnit: 55, flatFee: 1225 },
  { firstUnit: 51, lastUnit: 999, perUnit: 50, flatFee: 1475 }
];

// Scale plan pricing tiers
const SCALE_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 350, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 200, flatFee: 750 },
  { firstUnit: 16, lastUnit: 30, perUnit: 125, flatFee: 1875 },
  { firstUnit: 31, lastUnit: 50, perUnit: 100, flatFee: 2625 },
  { firstUnit: 51, lastUnit: 999, perUnit: 85, flatFee: 3375 }
];

// Default plan configurations (synced with Stripe metadata)
export const DEFAULT_PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  'ai-advisor': {
    name: 'AI Growth Advisor',
    pricingTiers: AI_PRICING_TIER,
    connections: 0,
    usersPerCompany: 1,
    scorecardsPerCompany: 'unlimited',
    metricsPerScorecard: 999,
    aiTokensPerDollar: 166666,
    historicDataYears: 0,
    contactThreshold: 50,
    stripeProductId: 'prod_7YtGm3ZhA2kR1Q5B',
    features: {
      dailySync: false,
      immediateSyncCommand: false,
      billingFlexibility: false,
      customBranding: false
    }
  },
  'starter': {
    name: 'Starter',
    pricingTiers: STARTER_PRICING_TIERS,
    connections: 1,
    usersPerCompany: 3,
    scorecardsPerCompany: 12,
    metricsPerScorecard: 10,
    aiTokensPerDollar: 166666,
    historicDataYears: 2,
    contactThreshold: 50,
    stripeProductId: 'prod_9WlNx5UpL8dC4V6M',
    features: {
      dailySync: true,
      immediateSyncCommand: false,
      billingFlexibility: false,
      customBranding: false
    }
  },
  'growth': {
    name: 'Growth',
    pricingTiers: GROWTH_PRICING_TIERS,
    connections: 3,
    usersPerCompany: 5,
    scorecardsPerCompany: 25,
    metricsPerScorecard: 15,
    aiTokensPerDollar: 166666,
    historicDataYears: 3,
    contactThreshold: 50,
    stripeProductId: 'prod_3QpHz8EvN1sB7K2X',
    features: {
      dailySync: true,
      immediateSyncCommand: true,
      billingFlexibility: true,
      customBranding: true
    }
  },
  'scale': {
    name: 'Scale',
    pricingTiers: SCALE_PRICING_TIERS,
    connections: 5,
    usersPerCompany: 8,
    scorecardsPerCompany: 25,
    metricsPerScorecard: 15,
    aiTokensPerDollar: 166666,
    historicDataYears: 4,
    contactThreshold: 50,
    stripeProductId: 'prod_6RtKx2JmF4aL9D7T',
    features: {
      dailySync: true,
      immediateSyncCommand: true,
      billingFlexibility: true,
      customBranding: true
    }
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

// Format large numbers with abbreviations (k for thousands, M for millions, B for billions)
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

// Parse URL parameters for embedding configuration
function getEmbedConfig() {
  const params = new URLSearchParams(window.location.search);

  // Parse discount parameters
  let discountType: DiscountType = null;
  let discountValue = 0;
  let discountLabel = '';

  const discountTypeParam = params.get('discountType');
  if (discountTypeParam === 'percentage' || discountTypeParam === 'fixed') {
    discountType = discountTypeParam;
    discountValue = params.has('discountValue') ? parseFloat(params.get('discountValue')!) : 0;
    discountLabel = params.get('discountLabel') || '';
  }

  return {
    isEmbedded: params.get('embedded') === 'true',
    theme: params.get('theme') || 'default',
    hideSettings: params.get('hideSettings') === 'true',
    initialPlan: params.get('plan') as PlanType | null,
    initialCount: params.has('count') ? parseInt(params.get('count')!, 10) : null,
    initialIsAnnual: params.has('annual') ? params.get('annual') === 'true' : null,
    initialDiscountType: discountType,
    initialDiscountValue: discountValue,
    initialDiscountLabel: discountLabel,
    initialRoyaltyProcessingEnabled: params.get('royaltyProcessing') === 'true',
    initialRoyaltyBaseFee: params.has('royaltyBaseFee') ? parseFloat(params.get('royaltyBaseFee')!) : null,
    initialRoyaltyPerTransaction: params.has('royaltyPerTx') ? parseFloat(params.get('royaltyPerTx')!) : null,
    initialEstimatedTransactions: params.has('royaltyTxCount') ? parseInt(params.get('royaltyTxCount')!) : null,
  };
}

// Load saved settings from localStorage
function loadSavedSettings(): {
  planConfigs: Record<PlanType, PlanConfig>;
  wholesaleDiscount: number;
  resellerCommission: number;
  customDiscountType: DiscountType;
  customDiscountValue: number;
  customDiscountLabel: string;
  customDiscountReason: string;
  royaltyProcessingEnabled: boolean;
  royaltyBaseFee: number;
  royaltyPerTransaction: number;
  estimatedTransactions: number;
} {
  try {
    const saved = localStorage.getItem('pricingSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new fields are present
      const mergedConfigs = Object.keys(DEFAULT_PLAN_CONFIGS).reduce((acc, key) => {
        const planKey = key as PlanType;
        acc[planKey] = {
          ...DEFAULT_PLAN_CONFIGS[planKey],
          ...parsed.planConfigs[planKey],
          features: {
            ...DEFAULT_PLAN_CONFIGS[planKey].features,
            ...(parsed.planConfigs[planKey]?.features || {})
          }
        };
        return acc;
      }, {} as Record<PlanType, PlanConfig>);

      return {
        planConfigs: mergedConfigs,
        wholesaleDiscount: parsed.wholesaleDiscount || 0,
        resellerCommission: parsed.resellerCommission || 0,
        customDiscountType: parsed.customDiscountType || null,
        customDiscountValue: parsed.customDiscountValue || 0,
        customDiscountLabel: parsed.customDiscountLabel || '',
        customDiscountReason: parsed.customDiscountReason || '',
        royaltyProcessingEnabled: parsed.royaltyProcessingEnabled || false,
        royaltyBaseFee: parsed.royaltyBaseFee !== undefined ? parsed.royaltyBaseFee : 0,
        royaltyPerTransaction: parsed.royaltyPerTransaction !== undefined ? parsed.royaltyPerTransaction : 1.82,
        estimatedTransactions: parsed.estimatedTransactions !== undefined ? parsed.estimatedTransactions : 2
      };
    }
  } catch (error) {
    console.error('Failed to load saved settings:', error);
  }
  return {
    planConfigs: DEFAULT_PLAN_CONFIGS,
    wholesaleDiscount: 0,
    resellerCommission: 0,
    customDiscountType: null,
    customDiscountValue: 0,
    customDiscountLabel: '',
    customDiscountReason: '',
    royaltyProcessingEnabled: false,
    royaltyBaseFee: 0,
    royaltyPerTransaction: 1.82,
    estimatedTransactions: 2
  };
}

// Terminology helper function for role-based language
function getTerminology(userType: UserType): {
  singular: string;
  plural: string;
  capitalized: string;
} {
  switch (userType) {
    case 'cpa':
      return { singular: 'client', plural: 'clients', capitalized: 'Clients' };
    case 'franchisee':
      return { singular: 'location', plural: 'locations', capitalized: 'Locations' };
    case 'smb':
      return { singular: 'company', plural: 'companies', capitalized: 'Companies' };
  }
}

function App() {
  // Get embedding configuration from URL parameters
  const embedConfig = getEmbedConfig();

  // Load saved settings
  const savedSettings = loadSavedSettings();

  const [userType, setUserType] = useState<UserType>('franchisee'); // Default to franchisee (target market)
  const [isAnnual, setIsAnnual] = useState(embedConfig.initialIsAnnual ?? true);
  const [count, setCount] = useState(embedConfig.initialCount ?? 10);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(embedConfig.initialPlan ?? 'starter');
  const [planConfigs, setPlanConfigs] = useState<Record<PlanType, PlanConfig>>(savedSettings.planConfigs);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(savedSettings.wholesaleDiscount);
  const [resellerCommission, setResellerCommission] = useState(savedSettings.resellerCommission);
  // URL parameters take precedence over saved settings for discounts
  const [customDiscountType, setCustomDiscountType] = useState<DiscountType>(
    embedConfig.initialDiscountType ?? savedSettings.customDiscountType
  );
  const [customDiscountValue, setCustomDiscountValue] = useState(
    embedConfig.initialDiscountValue || savedSettings.customDiscountValue
  );
  const [customDiscountLabel, setCustomDiscountLabel] = useState(
    embedConfig.initialDiscountLabel || savedSettings.customDiscountLabel
  );
  const [customDiscountReason, setCustomDiscountReason] = useState(savedSettings.customDiscountReason);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [isEnterpriseRequest, setIsEnterpriseRequest] = useState(false);

  // Royalty Payment Processing state (URL parameters take precedence over saved settings)
  const [royaltyProcessingEnabled, setRoyaltyProcessingEnabled] = useState(
    embedConfig.initialRoyaltyProcessingEnabled || savedSettings.royaltyProcessingEnabled
  );
  const [royaltyBaseFee, setRoyaltyBaseFee] = useState(
    embedConfig.initialRoyaltyBaseFee ?? savedSettings.royaltyBaseFee
  );
  const [royaltyPerTransaction, setRoyaltyPerTransaction] = useState(
    embedConfig.initialRoyaltyPerTransaction ?? savedSettings.royaltyPerTransaction
  );
  const [estimatedTransactions, setEstimatedTransactions] = useState(
    embedConfig.initialEstimatedTransactions ?? savedSettings.estimatedTransactions
  );

  const currentPlan = planConfigs[selectedPlan];

  // Get terminology based on user type
  const terminology = getTerminology(userType);

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

  // Calculate custom discount (applied after volume discount)
  const customDiscountAmount = calculateCustomDiscount(
    totalPrice,
    customDiscountType,
    customDiscountValue
  );

  // Apply wholesale discount if applicable (only for non-annual pricing)
  // Note: Wholesale and custom discounts are mutually exclusive
  const wholesaleDiscountAmount = !isAnnual && wholesaleDiscount > 0 && customDiscountAmount === 0
    ? totalPrice * (wholesaleDiscount / 100)
    : 0;

  const priceAfterDiscounts = totalPrice - customDiscountAmount - wholesaleDiscountAmount;
  const priceBeforeAnnual = priceAfterDiscounts;
  const finalPrice = isAnnual ? priceBeforeAnnual * (10/12) : priceBeforeAnnual;

  // Calculate reseller commission
  const creditCardFee = finalPrice * 0.03;
  const netAmount = finalPrice - creditCardFee;
  const resellerCommissionAmount = resellerCommission > 0
    ? netAmount * (resellerCommission / 100)
    : 0;

  // Calculate royalty processing fees (if enabled)
  const royaltyProcessingFee = royaltyProcessingEnabled
    ? (royaltyBaseFee * count) + (royaltyPerTransaction * estimatedTransactions * count)
    : 0;

  // Final price includes royalty processing
  const finalPriceWithRoyalty = finalPrice + royaltyProcessingFee;

  const pricePerUnit = finalPriceWithRoyalty / count;

  // Calculate AI tokens dynamically based on final price
  const calculatedAiTokens = Math.round(finalPrice * currentPlan.aiTokensPerDollar);

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
        finalPrice: finalPriceWithRoyalty,
        pricePerUnit,
        totalPrice,
        monthlySavings,
        wholesaleDiscountAmount,
        resellerCommissionAmount,
        wholesaleDiscount,
        resellerCommission,
        customDiscount: customDiscountAmount > 0 && customDiscountType ? {
          type: customDiscountType,
          value: customDiscountValue,
          label: customDiscountLabel,
          reason: customDiscountReason,
          discountAmount: customDiscountAmount
        } : null,
        royaltyProcessing: royaltyProcessingEnabled ? {
          enabled: true,
          baseFee: royaltyBaseFee,
          perTransaction: royaltyPerTransaction,
          estimatedTransactions: estimatedTransactions,
          totalFee: royaltyProcessingFee
        } : null,
        priceBreakdown: {
          subtotal: totalPrice,
          volumeDiscount: 0, // Volume discount is baked into totalPrice from tiers
          customDiscount: customDiscountAmount,
          wholesaleDiscount: wholesaleDiscountAmount,
          annualSavings: monthlySavings,
          royaltyProcessingFee: royaltyProcessingFee,
          finalMonthlyPrice: finalPriceWithRoyalty
        },
        planDetails: {
          name: currentPlan.name,
          connections: currentPlan.connections,
          users: selectedPlan === 'ai-advisor' ? count : count * currentPlan.usersPerCompany,
          scorecards: currentPlan.scorecardsPerCompany === 'unlimited'
            ? 'unlimited'
            : (selectedPlan === 'ai-advisor' ? currentPlan.scorecardsPerCompany : currentPlan.scorecardsPerCompany * count),
          aiTokens: calculatedAiTokens,
        },
      });
    }
  }, [
    selectedPlan,
    count,
    isAnnual,
    finalPrice,
    finalPriceWithRoyalty,
    pricePerUnit,
    totalPrice,
    monthlySavings,
    wholesaleDiscountAmount,
    resellerCommissionAmount,
    wholesaleDiscount,
    resellerCommission,
    customDiscountType,
    customDiscountValue,
    customDiscountLabel,
    customDiscountReason,
    customDiscountAmount,
    royaltyProcessingEnabled,
    royaltyBaseFee,
    royaltyPerTransaction,
    estimatedTransactions,
    royaltyProcessingFee,
    currentPlan,
    calculatedAiTokens,
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
    metricsPerScorecard: "Number of key performance indicators tracked per scorecard",
    aiTokens: "You receive $0.25 in AI tokens for every $1 spent on your plan (25% of plan cost). Choose any AI model you want - more expensive models just use tokens faster. Use for insights, recommendations, and automations.",
    historicData: "Years of historical data retention and analysis",
    dailySync: "Automatic daily synchronization of your data",
    immediateSync: "On-demand instant data sync whenever you need it",
    billingFlexibility: "Flexible payment terms and billing options",
    customBranding: "White-label customization with your company branding"
  };

  // Calculate features based on selected plan
  const planFeatures = selectedPlan === 'ai-advisor'
    ? [
        { value: count, label: 'User(s)', icon: 'fa-sharp fa-regular fa-user', tooltip: tooltips.users },
        { value: currentPlan.scorecardsPerCompany === 'unlimited' ? '∞' : currentPlan.scorecardsPerCompany, label: 'Manual Scorecards', icon: 'fa-sharp fa-regular fa-chart-line', tooltip: 'Create unlimited manual scorecards for tracking your metrics' },
        { value: '∞', label: 'Metrics per Scorecard', icon: 'fa-sharp fa-regular fa-gauge-high', tooltip: 'Add unlimited metrics to each scorecard' },
        { value: formatLargeNumber(calculatedAiTokens), label: 'AI Tokens', icon: 'fa-sharp fa-regular fa-sparkles', tooltip: tooltips.aiTokens }
      ]
    : [
        { value: count, label: terminology.capitalized, icon: 'fa-sharp fa-regular fa-building', tooltip: tooltips.companies },
        { value: currentPlan.connections, label: 'Connections', icon: 'fa-sharp fa-regular fa-link', tooltip: tooltips.connections },
        { value: count * currentPlan.usersPerCompany, label: 'Users', icon: 'fa-sharp fa-regular fa-users', tooltip: tooltips.users },
        { value: currentPlan.scorecardsPerCompany === 'unlimited' ? '∞' : (currentPlan.scorecardsPerCompany * count).toLocaleString(), label: 'Scorecards', icon: 'fa-sharp fa-regular fa-chart-line', tooltip: tooltips.scorecards },
        { value: currentPlan.metricsPerScorecard, label: 'Metrics per Scorecard', icon: 'fa-sharp fa-regular fa-gauge-high', tooltip: tooltips.metricsPerScorecard },
        { value: formatLargeNumber(calculatedAiTokens), label: 'AI Tokens', icon: 'fa-sharp fa-regular fa-sparkles', tooltip: tooltips.aiTokens },
        { value: `${currentPlan.historicDataYears} Yr${currentPlan.historicDataYears > 1 ? 's' : ''}`, label: 'Historic Data', icon: 'fa-sharp fa-regular fa-clock-rotate-left', tooltip: tooltips.historicData }
      ];

  // Feature flags with visual indicators
  const featureFlags = [
    {
      enabled: currentPlan.features.dailySync,
      label: 'Daily Sync',
      icon: 'fa-sharp fa-regular fa-arrows-rotate',
      tooltip: tooltips.dailySync
    },
    {
      enabled: currentPlan.features.immediateSyncCommand,
      label: 'Immediate Sync Command',
      icon: 'fa-sharp fa-regular fa-bolt',
      tooltip: tooltips.immediateSync
    },
    {
      enabled: currentPlan.features.billingFlexibility,
      label: 'Billing Flexibility',
      icon: 'fa-sharp fa-regular fa-credit-card',
      tooltip: tooltips.billingFlexibility
    },
    {
      enabled: currentPlan.features.customBranding,
      label: 'Custom Branding',
      icon: 'fa-sharp fa-regular fa-palette',
      tooltip: tooltips.customBranding
    }
  ];

  const handlePricingUpdate = (
    updatedConfigs: Record<PlanType, PlanConfig>,
    newWholesaleDiscount: number,
    newResellerCommission: number,
    newCustomDiscountType: DiscountType,
    newCustomDiscountValue: number,
    newCustomDiscountLabel: string,
    newCustomDiscountReason: string,
    newRoyaltyProcessingEnabled: boolean,
    newRoyaltyBaseFee: number,
    newRoyaltyPerTransaction: number,
    newEstimatedTransactions: number
  ) => {
    setPlanConfigs(updatedConfigs);
    setWholesaleDiscount(newWholesaleDiscount);
    setResellerCommission(newResellerCommission);
    setCustomDiscountType(newCustomDiscountType);
    setCustomDiscountValue(newCustomDiscountValue);
    setCustomDiscountLabel(newCustomDiscountLabel);
    setCustomDiscountReason(newCustomDiscountReason);
    setRoyaltyProcessingEnabled(newRoyaltyProcessingEnabled);
    setRoyaltyBaseFee(newRoyaltyBaseFee);
    setRoyaltyPerTransaction(newRoyaltyPerTransaction);
    setEstimatedTransactions(newEstimatedTransactions);

    // Save to localStorage
    try {
      localStorage.setItem('pricingSettings', JSON.stringify({
        planConfigs: updatedConfigs,
        wholesaleDiscount: newWholesaleDiscount,
        resellerCommission: newResellerCommission,
        customDiscountType: newCustomDiscountType,
        customDiscountValue: newCustomDiscountValue,
        customDiscountLabel: newCustomDiscountLabel,
        customDiscountReason: newCustomDiscountReason,
        royaltyProcessingEnabled: newRoyaltyProcessingEnabled,
        royaltyBaseFee: newRoyaltyBaseFee,
        royaltyPerTransaction: newRoyaltyPerTransaction,
        estimatedTransactions: newEstimatedTransactions
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Determine background color based on theme
  const backgroundColor = embedConfig.theme === 'transparent'
    ? 'transparent'
    : 'bg-[#F0F4FF]';

  // Use min-h-fit for embedded mode to allow flexible height
  const minHeight = embedConfig.isEmbedded ? 'min-h-fit' : 'min-h-screen';

  // Compact spacing for embedded mode
  const outerPadding = embedConfig.isEmbedded ? 'p-0' : 'p-2';
  const topMargin = embedConfig.isEmbedded ? 'pt-0' : 'pt-3';
  const bottomMargin = embedConfig.isEmbedded ? 'mb-2' : 'mb-8';
  const gridGap = embedConfig.isEmbedded ? 'gap-2' : 'gap-3';

  return (
    <div className={`${minHeight} ${backgroundColor}`}>
      {/* Role Selector at the very top */}
      <RoleSelector selected={userType} onChange={setUserType} isEmbedded={embedConfig.isEmbedded} />

      <div className={outerPadding}>
        <div className={`max-w-6xl mx-auto ${bottomMargin} ${topMargin}`}>
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
              <div className="font-bold text-sm sm:text-base md:text-lg">AI Growth Advisor</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">$19/user • 0 connections</div>
            </button>
            <button
              onClick={() => setSelectedPlan('starter')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'starter'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Starter</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">1 connection • From $90</div>
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
              <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] md:text-xs font-bold px-2 sm:px-3 md:px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                  MOST POPULAR
                </div>
              </div>
              <div className="font-bold text-sm sm:text-base md:text-lg">Growth</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">3 connections • From $120</div>
            </button>
            <button
              onClick={() => setSelectedPlan('scale')}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'scale'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Scale</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">5 connections • From $150</div>
            </button>
            <button
              onClick={() => {
                setIsEnterpriseRequest(true);
                setShowContactModal(true);
              }}
              className="flex-1 px-4 py-3 rounded-md smooth-transition bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-[#180D43] hover:to-[#1239FF] hover:shadow-lg"
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Enterprise</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-90">Custom pricing • Unlimited</div>
            </button>
          </div>
        </div>
      </div>

      <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} monthlySavings={monthlySavings} isEmbedded={embedConfig.isEmbedded} />

      <div className="max-w-4xl mx-auto">
        <div className={`grid md:grid-cols-2 ${gridGap}`}>
          <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 overflow-hidden">
            <div className="bg-[#1239FF] text-white p-2">
              <h2 className="text-sm font-semibold">Configure Your Plan</h2>
            </div>
            <div className="p-3 space-y-4">
              <CompanySlider
                companies={count}
                setCompanies={setCount}
                pricingTiers={currentPlan.pricingTiers}
                label={selectedPlan === 'ai-advisor' ? "Select Number of Users" : `Select Number of ${terminology.capitalized}`}
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

                  {/* Next Tier Preview - Enhanced for Conversion */}
                  {nextTier && (
                    <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 shadow-lg hover:shadow-xl smooth-transition transform hover:scale-[1.02] cursor-pointer">
                      {/* Animated Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20 animate-pulse"></div>

                      {/* Content */}
                      <div className="relative px-4 py-3 text-center">
                        {(() => {
                          const companiesNeeded = nextTier.firstUnit - count;
                          const nextTierSavings = calculateVolumeSavings(nextTier.firstUnit, currentTierIndex + 1, currentPlan.pricingTiers);
                          const potentialSavingsAmount = Math.round((finalPrice * nextTierSavings) / (100 - nextTierSavings));

                          return (
                            <>
                              {/* Eye-catching Header */}
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-amber-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                                  Unlock Bigger Savings
                                </span>
                              </div>

                              {/* Main Message */}
                              <div className="text-sm font-bold text-gray-900 mb-1">
                                Add just <span className="text-xl text-amber-600">{companiesNeeded}</span> more {companiesNeeded === 1 ? (selectedPlan === 'ai-advisor' ? 'user' : terminology.singular) : (selectedPlan === 'ai-advisor' ? 'users' : terminology.plural)}
                              </div>

                              {/* Savings Highlight */}
                              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-300 shadow-md">
                                <span className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                  {nextTierSavings}% OFF
                                </span>
                                {nextTier.perUnit > 0 && potentialSavingsAmount > 0 && (
                                  <span className="text-sm text-gray-700 font-semibold">
                                    Save ~${potentialSavingsAmount}/mo
                                  </span>
                                )}
                              </div>

                              {/* Unit Price */}
                              {nextTier.perUnit > 0 && (
                                <div className="mt-2 text-xs text-gray-600 font-medium">
                                  Next tier: ${nextTier.perUnit}/unit
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Decorative Corner Elements */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-300/30 to-transparent rounded-bl-full"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-tr-full"></div>
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
                <div className="text-4xl md:text-5xl font-bold gradient-text-primary mb-2 animate-count" role="status" aria-live="polite" aria-label={`Price: $${formatNumber(finalPriceWithRoyalty)} per month`}>
                  ${formatNumber(finalPriceWithRoyalty)}
                  <span className="text-lg md:text-xl font-normal text-[#180D43]/70">/mo</span>
                </div>
                <div className="text-base md:text-lg text-[#180D43]/80 mb-1">
                  {count} {selectedPlan === 'ai-advisor' ? 'users' : terminology.plural} • <span className="font-semibold text-[#1239FF]">${formatNumber(pricePerUnit)}</span> each
                </div>
                {isAnnual && (
                  <div className="text-xs md:text-sm text-green-600 font-medium">
                    Billed annually (${formatNumber(finalPriceWithRoyalty * 12)}/year)
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
                      finalPrice: finalPriceWithRoyalty,
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
                        aiTokens: calculatedAiTokens,
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
                        <div className="font-medium text-sm md:text-base">{selectedPlan === 'ai-advisor' ? 'Users' : terminology.capitalized} ({count}):</div>
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

                      {customDiscountAmount > 0 && (
                        <div className="border-b border-gray-200 pb-2">
                          <div className="flex justify-between text-green-600">
                            <span>
                              {customDiscountLabel || 'Custom Discount'}
                              {customDiscountType === 'percentage' && ` (${customDiscountValue}%)`}
                            </span>
                            <span>-${formatNumber(customDiscountAmount)}/mo</span>
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

                      {royaltyProcessingEnabled && (
                        <div className="border-b border-gray-200 pb-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[#180D43]/70 font-medium">
                              <span>Royalty processing ({count} {terminology.plural})</span>
                              <span>${formatNumber(royaltyProcessingFee)}/mo</span>
                            </div>
                            {royaltyBaseFee > 0 && (
                              <div className="flex justify-between text-xs text-[#180D43]/50 ml-4">
                                <span>• Base fee ({count} × ${formatNumber(royaltyBaseFee)})</span>
                                <span>${formatNumber(royaltyBaseFee * count)}/mo</span>
                              </div>
                            )}
                            {royaltyPerTransaction > 0 && estimatedTransactions > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-[#180D43]/50 ml-4">
                                  <span>• Transaction fees (~{estimatedTransactions} txns @ ${formatNumber(royaltyPerTransaction)})</span>
                                  <span>${formatNumber(royaltyPerTransaction * estimatedTransactions * count)}/mo</span>
                                </div>
                              </>
                            )}
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
                          <span className="text-[#1239FF]">${formatNumber(finalPriceWithRoyalty)}/mo</span>
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

              {wholesaleDiscount > 0 && customDiscountAmount > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    Custom discounts cannot be combined with wholesale pricing. Please use one or the other.
                  </div>
                </div>
              )}

              <div className="bg-[#F0F4FF] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#180D43] mb-3">Plan Includes</h3>

                {/* Primary Features - Always visible (first 4 for standard plans, all for AI advisor) */}
                <div className="grid grid-cols-2 gap-3">
                  {planFeatures.slice(0, selectedPlan === 'ai-advisor' ? planFeatures.length : 4).map((feature, index) => (
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

                {/* Collapsible Additional Details - Only for non-AI Advisor plans */}
                {selectedPlan !== 'ai-advisor' && (
                  <>
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setShowPlanDetails(!showPlanDetails)}
                      className="flex items-center justify-center gap-2 text-sm text-[#1239FF] hover:text-[#1239FF]/80 font-medium w-full py-2 mt-3"
                    >
                      {showPlanDetails ? 'Hide' : 'Show'} additional details
                      <ChevronDown className={`w-4 h-4 transition-transform ${showPlanDetails ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expandable Section */}
                    {showPlanDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        {/* Additional Quantifiable Features (indexes 4+) */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {planFeatures.slice(4).map((feature, index) => (
                            <div key={index + 4} className="flex items-center gap-2">
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

                        {/* Feature Flags */}
                        {featureFlags.filter(feature => feature.enabled).length > 0 && (
                          <>
                            <h4 className="text-xs font-semibold text-[#180D43] mb-2 uppercase tracking-wide">Additional Features</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {featureFlags.filter(feature => feature.enabled).map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <i className={`${feature.icon} text-[#1239FF] text-base`} aria-label={feature.label} role="img"></i>
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <i className="fa-sharp fa-solid fa-circle-check text-green-600 text-sm"></i>
                                      <span className="text-sm text-[#180D43]">
                                        {feature.label}
                                      </span>
                                      <Tooltip content={feature.tooltip} position="top" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <FeatureComparison selectedPlan={selectedPlan} />

      {!embedConfig.hideSettings && (
        <Settings
          planConfigs={planConfigs}
          wholesaleDiscount={wholesaleDiscount}
          resellerCommission={resellerCommission}
          customDiscountType={customDiscountType}
          customDiscountValue={customDiscountValue}
          customDiscountLabel={customDiscountLabel}
          customDiscountReason={customDiscountReason}
          royaltyProcessingEnabled={royaltyProcessingEnabled}
          royaltyBaseFee={royaltyBaseFee}
          royaltyPerTransaction={royaltyPerTransaction}
          estimatedTransactions={estimatedTransactions}
          onUpdatePricing={handlePricingUpdate}
          isEmbedded={embedConfig.isEmbedded}
          terminology={terminology}
          defaultPlanConfigs={DEFAULT_PLAN_CONFIGS}
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
        unitLabel={selectedPlan === 'ai-advisor' ? 'users' : terminology.plural}
        onUserAction={(action) => {
          sendUserAction(action, {
            selectedPlan,
            count,
            isAnnual,
            finalPrice: finalPriceWithRoyalty,
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
              aiTokens: calculatedAiTokens,
            },
          });
        }}
      />
      </div>
    </div>
  );
}

export default App;