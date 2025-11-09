import React, { useState, useEffect } from 'react';
import PricingToggle from './components/PricingToggle';
import CompanySlider from './components/CompanySlider';
import Settings from './components/Settings';
import ContactModal from './components/ContactModal';
import ClickWrapModal from './components/ClickWrapModal';
import Tooltip from './components/Tooltip';
import RoleSelector from './components/RoleSelector';
import FeatureComparison from './components/FeatureComparison';
import { QuoteModeBanner } from './components/QuoteModeBanner';
import SocialProofBadges from './components/SocialProofBadges';
import NudgeBanner from './components/NudgeBanner';
import FormIdErrorBanner from './components/FormIdErrorBanner';
import { ProfitSprintOffer } from './components/ProfitSprintOffer';
import { SalesScriptPanel } from './components/SalesScriptPanel';
import { AlertCircle, ChevronDown, Shield, CreditCard, RefreshCw, Copy, BarChart3, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useIframeMessaging } from './hooks/useIframeMessaging';
import { calculateCustomDiscount, type DiscountType } from './utils/discountCalculator';
import { useQuoteMode } from './hooks/useQuoteMode';
import * as quoteApi from './lib/quoteApi';
import type { QuoteStatus, QuoteSummary } from './types/quote';
import { DEFAULT_PLAN_CONFIGS, type PlanType, type PlanConfig, type PricingTier } from './config/planConfigs';

// Define user types for role selection
type UserType = 'cpa' | 'franchisee' | 'smb';

function calculateBasePrice(count: number, pricingTiers: PricingTier[]): { total: number; perUnit: number; flatFee: number } {
  let tier = pricingTiers.find(t => count >= t.firstUnit && count <= t.lastUnit);

  // If no tier found (count exceeds all tiers), use the last tier
  if (!tier && pricingTiers.length > 0) {
    tier = pricingTiers[pricingTiers.length - 1];
  }

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

  // Parse userType parameter
  const userTypeParam = params.get('userType');
  let initialUserType: UserType | null = null;
  if (userTypeParam === 'cpa' || userTypeParam === 'franchisee' || userTypeParam === 'smb') {
    initialUserType = userTypeParam;
  }

  return {
    isEmbedded: params.get('embedded') === 'true',
    theme: params.get('theme') || 'default',
    hideSettings: params.get('hideSettings') === 'true',
    adminMode: params.get('admin') === 'true',
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
    initialOnboardingFeeAmount: params.has('onboardingFee') ? parseFloat(params.get('onboardingFee')!) : null,
    initialOnboardingFeeTitle: params.get('onboardingTitle') || null,
    initialOnboardingFeeDescription: params.get('onboardingDesc') || null,
    // Projected locations parameter
    projectedLocations: params.has('projectedLocations') ? parseInt(params.get('projectedLocations')!, 10) : null,
    // Quote mode parameters
    mode: params.get('mode') || 'calculator',
    formId: params.get('formId') || null,
    expiresInDays: parseInt(params.get('quoteExpiresInDays') || '14', 10),
    showPricingDetails: params.get('showPricingDetails') === 'true',
    // User type parameter
    initialUserType,
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
  onboardingFeeAmount: number;
  onboardingFeeTitle: string;
  onboardingFeeDescription: string;
  quoteStartDate: string;
  quoteExpirationDays: number;
  customTermsEnabled: boolean;
  customTermsTitle: string;
  customTermsContent: string;
  // Training offer settings
  trainingOfferEnabled: boolean;
  trainingOfferBasePrice: number;
  trainingOfferSinglePayment: boolean;
  trainingOfferTwoPayment: boolean;
  trainingOfferThreePayment: boolean;
  trainingOfferSpotsAvailable: number;
  trainingOfferHeadlinePrimary: string;
  trainingOfferHeadlineSecondary: string;
  trainingOfferGuaranteeEnabled: boolean;
  trainingOfferGuaranteeText: string;
  trainingOfferTestimonialName: string;
  trainingOfferTestimonialRole: string;
  trainingOfferTestimonialQuote: string;
  trainingOfferUrgencyText: string;
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
        estimatedTransactions: parsed.estimatedTransactions !== undefined ? parsed.estimatedTransactions : 2,
        onboardingFeeAmount: parsed.onboardingFeeAmount || 0,
        onboardingFeeTitle: parsed.onboardingFeeTitle || 'Custom Onboarding Fee',
        onboardingFeeDescription: parsed.onboardingFeeDescription || 'Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.',
        quoteStartDate: parsed.quoteStartDate || new Date().toISOString().split('T')[0],
        quoteExpirationDays: parsed.quoteExpirationDays ?? 14,
        customTermsEnabled: parsed.customTermsEnabled ?? false,
        customTermsTitle: parsed.customTermsTitle || 'Custom Terms & Conditions',
        customTermsContent: parsed.customTermsContent || '',
        // Training offer settings
        trainingOfferEnabled: parsed.trainingOfferEnabled ?? false,
        trainingOfferBasePrice: parsed.trainingOfferBasePrice ?? 3800,
        trainingOfferSinglePayment: parsed.trainingOfferSinglePayment ?? true,
        trainingOfferTwoPayment: parsed.trainingOfferTwoPayment ?? false,
        trainingOfferThreePayment: parsed.trainingOfferThreePayment ?? false,
        trainingOfferSpotsAvailable: parsed.trainingOfferSpotsAvailable ?? 3,
        trainingOfferHeadlinePrimary: parsed.trainingOfferHeadlinePrimary || 'The $118,121 Problem Hiding in Your P&L',
        trainingOfferHeadlineSecondary: parsed.trainingOfferHeadlineSecondary || 'Transform Your Financial Literacy Into 30-50% Higher Profit Margins',
        trainingOfferGuaranteeEnabled: parsed.trainingOfferGuaranteeEnabled ?? true,
        trainingOfferGuaranteeText: parsed.trainingOfferGuaranteeText || "14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund",
        trainingOfferTestimonialName: parsed.trainingOfferTestimonialName || 'Jane Smith',
        trainingOfferTestimonialRole: parsed.trainingOfferTestimonialRole || 'CEO, F45 Fitness Franchise',
        trainingOfferTestimonialQuote: parsed.trainingOfferTestimonialQuote || 'Found $15,000 in hidden profit in my very first P&L review session. The AI insights were eye-opening.',
        trainingOfferUrgencyText: parsed.trainingOfferUrgencyText || 'Limited spots available - Only 3 clients accepted this month'
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
    estimatedTransactions: 2,
    onboardingFeeAmount: 0,
    onboardingFeeTitle: 'Custom Onboarding Fee',
    onboardingFeeDescription: 'Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.',
    quoteStartDate: new Date().toISOString().split('T')[0],
    quoteExpirationDays: 14,
    customTermsEnabled: false,
    customTermsTitle: 'Custom Terms & Conditions',
    customTermsContent: '',
    // Training offer defaults
    trainingOfferEnabled: false,
    trainingOfferBasePrice: 3800,
    trainingOfferSinglePayment: true,
    trainingOfferTwoPayment: true,
    trainingOfferThreePayment: true,
    trainingOfferSpotsAvailable: 3,
    trainingOfferHeadlinePrimary: 'The $118,121 Problem Hiding in Your P&L',
    trainingOfferHeadlineSecondary: 'Transform Your Financial Literacy Into 30-50% Higher Profit Margins',
    trainingOfferGuaranteeEnabled: true,
    trainingOfferGuaranteeText: "14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund",
    trainingOfferTestimonialName: 'Jane Smith',
    trainingOfferTestimonialRole: 'CEO, F45 Fitness Franchise',
    trainingOfferTestimonialQuote: 'Found $15,000 in hidden profit in my very first P&L review session. The AI insights were eye-opening.',
    trainingOfferUrgencyText: 'Limited spots available - Only 3 clients accepted this month'
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

  const [userType, setUserType] = useState<UserType>(embedConfig.initialUserType ?? 'franchisee'); // Default to franchisee (target market)
  const [isAnnual, setIsAnnual] = useState(embedConfig.initialIsAnnual ?? true);
  const [count, setCount] = useState(embedConfig.initialCount ?? 10);
  // Projected locations only available in quote mode
  const [projectedLocations, setProjectedLocations] = useState<number | null>(
    embedConfig.mode === 'quote' ? (embedConfig.projectedLocations ?? null) : null
  );
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
  const [showPricingDetails, setShowPricingDetails] = useState(embedConfig.showPricingDetails || false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [isEnterpriseRequest, setIsEnterpriseRequest] = useState(false);
  const [showNudgeBanner, setShowNudgeBanner] = useState(false);
  const [nudgeBannerDismissed, setNudgeBannerDismissed] = useState(false);

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

  // Onboarding Fee state (URL parameters take precedence over saved settings)
  const [onboardingFeeAmount, setOnboardingFeeAmount] = useState(
    embedConfig.initialOnboardingFeeAmount ?? savedSettings.onboardingFeeAmount
  );
  const [onboardingFeeTitle, setOnboardingFeeTitle] = useState(
    embedConfig.initialOnboardingFeeTitle ?? savedSettings.onboardingFeeTitle
  );
  const [onboardingFeeDescription, setOnboardingFeeDescription] = useState(
    embedConfig.initialOnboardingFeeDescription ?? savedSettings.onboardingFeeDescription
  );

  // Custom Terms & SOW state
  const [customTermsEnabled, setCustomTermsEnabled] = useState(
    savedSettings.customTermsEnabled ?? false
  );
  const [customTermsTitle, setCustomTermsTitle] = useState(
    savedSettings.customTermsTitle ?? 'Custom Terms & Conditions'
  );
  const [customTermsContent, setCustomTermsContent] = useState(
    savedSettings.customTermsContent ?? ''
  );

  // Training Offer state
  const [trainingOfferEnabled, setTrainingOfferEnabled] = useState(
    savedSettings.trainingOfferEnabled ?? false
  );
  const [trainingOfferBasePrice, setTrainingOfferBasePrice] = useState(
    savedSettings.trainingOfferBasePrice ?? 3800
  );
  const [trainingOfferSinglePayment, setTrainingOfferSinglePayment] = useState(
    savedSettings.trainingOfferSinglePayment ?? true
  );
  const [trainingOfferTwoPayment, setTrainingOfferTwoPayment] = useState(
    savedSettings.trainingOfferTwoPayment ?? false
  );
  const [trainingOfferThreePayment, setTrainingOfferThreePayment] = useState(
    savedSettings.trainingOfferThreePayment ?? false
  );
  const [trainingOfferSpotsAvailable, setTrainingOfferSpotsAvailable] = useState(
    savedSettings.trainingOfferSpotsAvailable ?? 3
  );
  const [trainingOfferHeadlinePrimary, setTrainingOfferHeadlinePrimary] = useState(
    savedSettings.trainingOfferHeadlinePrimary ?? 'The $118,121 Problem Hiding in Your P&L'
  );
  const [trainingOfferHeadlineSecondary, setTrainingOfferHeadlineSecondary] = useState(
    savedSettings.trainingOfferHeadlineSecondary ?? 'Transform Your Financial Literacy Into 30-50% Higher Profit Margins'
  );
  const [trainingOfferGuaranteeEnabled, setTrainingOfferGuaranteeEnabled] = useState(
    savedSettings.trainingOfferGuaranteeEnabled ?? true
  );
  const [trainingOfferGuaranteeText, setTrainingOfferGuaranteeText] = useState(
    savedSettings.trainingOfferGuaranteeText ?? "14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund"
  );
  const [trainingOfferTestimonialName, setTrainingOfferTestimonialName] = useState(
    savedSettings.trainingOfferTestimonialName ?? 'Jane Smith'
  );
  const [trainingOfferTestimonialRole, setTrainingOfferTestimonialRole] = useState(
    savedSettings.trainingOfferTestimonialRole ?? 'CEO, F45 Fitness Franchise'
  );
  const [trainingOfferTestimonialQuote, setTrainingOfferTestimonialQuote] = useState(
    savedSettings.trainingOfferTestimonialQuote ?? 'Found $15,000 in hidden profit in my very first P&L review session. The AI insights were eye-opening.'
  );
  const [trainingOfferUrgencyText, setTrainingOfferUrgencyText] = useState(
    savedSettings.trainingOfferUrgencyText ?? 'Limited spots available - Only 3 clients accepted this month'
  );

  // Computed training offer variables for compatibility
  const paymentOptionsArray = [];
  if (trainingOfferSinglePayment) paymentOptionsArray.push('1');
  if (trainingOfferTwoPayment) paymentOptionsArray.push('2');
  if (trainingOfferThreePayment) paymentOptionsArray.push('3');
  const trainingOfferPaymentOptions = paymentOptionsArray.join(',') || '1,2,3';
  const trainingOfferHeadline = trainingOfferHeadlinePrimary;
  const trainingOfferSubheadline = trainingOfferHeadlineSecondary;

  // Quote mode state
  const [quoteMode, setQuoteMode] = useState(embedConfig.mode === 'quote');
  const [showClickWrapModal, setShowClickWrapModal] = useState(false);
  const [formId, setFormId] = useState<string | null>(embedConfig.formId);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('draft');
  const [quoteExpiresAt, setQuoteExpiresAt] = useState<string | null>(null);
  const [quoteLockedAt, setQuoteLockedAt] = useState<string | null>(null);
  const [quoteAcceptedAt, setQuoteAcceptedAt] = useState<string | null>(null);
  const [currentPricingModelId, setCurrentPricingModelId] = useState<string | null>(null);
  const [waitingForInit, setWaitingForInit] = useState(false);
  const [quoteLoadComplete, setQuoteLoadComplete] = useState(false); // Track if initial quote load is done

  // Admin mode state (for salespeople)
  const [adminMode, setAdminMode] = useState(embedConfig.adminMode);

  // Quote expiration settings (admin-configurable)
  const [quoteStartDate, setQuoteStartDate] = useState<string>(
    savedSettings.quoteStartDate || new Date().toISOString().split('T')[0]
  );
  const [quoteExpirationDays, setQuoteExpirationDays] = useState<number>(
    savedSettings.quoteExpirationDays ?? 14 // Default 14 days (research-backed optimal)
  );

  // UI state for royalty add-on
  const [showRoyaltyAddon, setShowRoyaltyAddon] = useState(false);

  const currentPlan = planConfigs[selectedPlan];

  // Get terminology based on user type
  const terminology = getTerminology(userType);

  // Initialize iframe messaging
  const {
    isInIframe,
    sendSelectionUpdate,
    sendUserAction,
    sendEnterpriseInquiry,
    sendQuoteMessage,
    sendQuoteError,
    incomingMessage,
  } = useIframeMessaging({
    enabled: embedConfig.isEmbedded,
    isEmbedded: embedConfig.isEmbedded
  });

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

  // Subscription pricing (used for per-unit and scaling calculations)
  const subscriptionPrice = finalPrice;
  const subscriptionPricePerUnit = subscriptionPrice / count;

  // Grand total includes subscription + optional add-ons (used for quotes/checkout)
  const grandTotal = subscriptionPrice + royaltyProcessingFee;

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

  // Calculate projected pricing (if projectedLocations is set)
  const calculateProjectedPrice = (projectedCount: number) => {
    if (!projectedCount || projectedCount <= 0) return 0;

    // Use same calculation flow as current pricing
    const projectedBasePrice = calculateBasePrice(projectedCount, currentPlan.pricingTiers);
    const projectedTotalPrice = projectedBasePrice.total;

    // Apply custom discount
    const projectedCustomDiscountAmount = calculateCustomDiscount(
      projectedTotalPrice,
      customDiscountType,
      customDiscountValue
    );

    // Apply wholesale discount (only for non-annual pricing, mutually exclusive with custom)
    const projectedWholesaleDiscountAmount = !isAnnual && wholesaleDiscount > 0 && projectedCustomDiscountAmount === 0
      ? projectedTotalPrice * (wholesaleDiscount / 100)
      : 0;

    const projectedPriceAfterDiscounts = projectedTotalPrice - projectedCustomDiscountAmount - projectedWholesaleDiscountAmount;
    const projectedFinalPrice = isAnnual ? projectedPriceAfterDiscounts * (10/12) : projectedPriceAfterDiscounts;

    // Return subscription-only price (royalty fees excluded from scaling comparisons)
    return projectedFinalPrice;
  };

  const projectedPrice = projectedLocations ? calculateProjectedPrice(projectedLocations) : null;
  const projectedPricePerUnit = projectedPrice && projectedLocations ? projectedPrice / projectedLocations : null;
  const savingsPerUnit = projectedPricePerUnit ? subscriptionPricePerUnit - projectedPricePerUnit : null;

  // Determine if controls should be disabled (locked, accepted, or expired)
  const isLocked = quoteMode && (quoteStatus === 'locked' || quoteStatus === 'accepted' || quoteStatus === 'expired');

  // Set count to 1 when Small Business Owner is selected
  useEffect(() => {
    if (userType === 'smb') {
      setCount(1);
    }
  }, [userType]);

  // Auto-trigger ContactModal when count reaches enterprise threshold (skip for admins)
  useEffect(() => {
    if (count >= currentPlan.contactThreshold && !isLocked && !adminMode) {
      setIsEnterpriseRequest(false);
      setShowContactModal(true);
      // Send enterprise inquiry event
      sendEnterpriseInquiry(count, currentPlan.name);
    }
  }, [count, currentPlan.contactThreshold, currentPlan.name, sendEnterpriseInquiry, isLocked, adminMode]);

  // Show nudge banner when count crosses nudge threshold (but below contact threshold)
  useEffect(() => {
    if (
      count >= currentPlan.nudgeThreshold &&
      count < currentPlan.contactThreshold &&
      !nudgeBannerDismissed &&
      !isLocked &&
      !adminMode
    ) {
      setShowNudgeBanner(true);
    } else {
      setShowNudgeBanner(false);
    }
  }, [count, currentPlan.nudgeThreshold, currentPlan.contactThreshold, nudgeBannerDismissed, isLocked, adminMode]);

  // Reset dismissed state when plan changes
  useEffect(() => {
    setNudgeBannerDismissed(false);
  }, [selectedPlan]);

  // Sync royalty addon visibility with enabled state
  useEffect(() => {
    if (royaltyProcessingEnabled) {
      setShowRoyaltyAddon(true);
    }
  }, [royaltyProcessingEnabled]);

  // Quote mode initialization - Two-phase approach
  useEffect(() => {
    if (!quoteMode) {
      // Not in quote mode - no quote to load
      setQuoteLoadComplete(true);
      return;
    }

    const initializeQuote = async () => {
      try {
        if (formId) {
          // Phase 1: Try to load existing quote
          try {
            console.log('[PricingCalculator] Attempting to load existing quote for formId:', formId);
            const existingQuote = await quoteApi.getQuote(formId);

            // Successfully loaded existing quote
            console.log('[PricingCalculator] Loaded existing quote:', existingQuote.id);

            // Update state from loaded quote
            setQuoteStatus(existingQuote.status);
            setQuoteExpiresAt(existingQuote.expires_at);
            setQuoteLockedAt(existingQuote.locked_at);
            setQuoteAcceptedAt(existingQuote.accepted_at || null);
            setCurrentPricingModelId(existingQuote.pricing_model_id);

            // Set selections from quote
            if (existingQuote.selected_plan) {
              setSelectedPlan(existingQuote.selected_plan as PlanType);
            }
            if (existingQuote.count) {
              setCount(existingQuote.count);
            }
            if (existingQuote.is_annual !== undefined) {
              setIsAnnual(existingQuote.is_annual);
            }

            // Restore settings from selection_raw
            if (existingQuote.selection_raw) {
              const raw = existingQuote.selection_raw as any;

              // Restore user type
              if (raw.userType) {
                setUserType(raw.userType);
              }

              // Restore projected locations
              if (raw.projectedLocations) {
                setProjectedLocations(raw.projectedLocations);
              } else {
                setProjectedLocations(null);
              }

              // Restore custom discount
              if (raw.customDiscount) {
                setCustomDiscountType(raw.customDiscount.type || null);
                setCustomDiscountValue(raw.customDiscount.value || 0);
                setCustomDiscountLabel(raw.customDiscount.label || '');
                setCustomDiscountReason(raw.customDiscount.reason || '');
              } else {
                // Clear custom discount if not in quote
                setCustomDiscountType(null);
                setCustomDiscountValue(0);
                setCustomDiscountLabel('');
                setCustomDiscountReason('');
              }

              // Restore royalty processing
              if (raw.royaltyProcessing) {
                setRoyaltyProcessingEnabled(raw.royaltyProcessing.enabled || false);
                setRoyaltyBaseFee(raw.royaltyProcessing.baseFee || 0);
                setRoyaltyPerTransaction(raw.royaltyProcessing.perTransaction || 1.82);
                setEstimatedTransactions(raw.royaltyProcessing.estimatedTransactions || 2);
              } else {
                // Clear royalty processing if not in quote
                setRoyaltyProcessingEnabled(false);
                setRoyaltyBaseFee(0);
                setRoyaltyPerTransaction(1.82);
                setEstimatedTransactions(2);
              }

              // Restore onboarding fee
              if (raw.onboardingFee) {
                setOnboardingFeeAmount(raw.onboardingFee.amount || 0);
                setOnboardingFeeTitle(raw.onboardingFee.title || 'Custom Onboarding Fee');
                setOnboardingFeeDescription(raw.onboardingFee.description || 'Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.');
              } else {
                // Clear onboarding fee if not in quote
                setOnboardingFeeAmount(0);
                setOnboardingFeeTitle('Custom Onboarding Fee');
                setOnboardingFeeDescription('Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.');
              }

              // Restore custom terms
              if (raw.customTerms) {
                setCustomTermsEnabled(raw.customTerms.enabled || false);
                setCustomTermsTitle(raw.customTerms.title || 'Custom Terms & Conditions');
                setCustomTermsContent(raw.customTerms.content || '');
              } else {
                // Clear custom terms if not in quote
                setCustomTermsEnabled(false);
                setCustomTermsTitle('Custom Terms & Conditions');
                setCustomTermsContent('');
              }

              // Restore Training Offer settings
              if (raw.trainingOffer) {
                const offer = raw.trainingOffer;
                setTrainingOfferEnabled(offer.enabled || false);
                setTrainingOfferBasePrice(offer.basePrice || 3800);
                setTrainingOfferSinglePayment(offer.singlePayment || false);
                setTrainingOfferTwoPayment(offer.twoPayment || false);
                setTrainingOfferThreePayment(offer.threePayment || false);
                setTrainingOfferSpotsAvailable(offer.spotsAvailable || 3);
                setTrainingOfferHeadlinePrimary(offer.headline || 'The $118,121 Problem Hiding in Your P&L');
                setTrainingOfferHeadlineSecondary(offer.subheadline || 'Transform Your Financial Literacy Into 30-50% Higher Profit Margins');
                setTrainingOfferGuaranteeEnabled(offer.guaranteeEnabled !== undefined ? offer.guaranteeEnabled : true);
                setTrainingOfferGuaranteeText(offer.guaranteeText || "14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund");
              } else {
                // Clear training offer if not in quote
                setTrainingOfferEnabled(false);
                setTrainingOfferBasePrice(3800);
                setTrainingOfferSinglePayment(false);
                setTrainingOfferTwoPayment(false);
                setTrainingOfferThreePayment(false);
                setTrainingOfferSpotsAvailable(3);
                setTrainingOfferHeadlinePrimary('The $118,121 Problem Hiding in Your P&L');
                setTrainingOfferHeadlineSecondary('Transform Your Financial Literacy Into 30-50% Higher Profit Margins');
                setTrainingOfferGuaranteeEnabled(true);
                setTrainingOfferGuaranteeText("14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund");
              }

              // Restore showPricingDetails state
              if (raw.showPricingDetails !== undefined) {
                setShowPricingDetails(raw.showPricingDetails);
              }
            }

            // Send QUOTE_ID_READY to parent after successful load
            sendQuoteMessage('QUOTE_ID_READY', {
              id: formId,
              status: existingQuote.status,
              version: existingQuote.version || 1,
            });

            // Mark quote load as complete to enable auto-save
            setQuoteLoadComplete(true);
            console.log('[PricingCalculator] Quote loaded successfully, sent QUOTE_ID_READY');
          } catch (error: any) {
            // Phase 2: Quote doesn't exist - wait for INIT_QUOTE message
            if (error?.message?.includes('Quote not found') || error?.message?.includes('404')) {
              console.log('[PricingCalculator] Quote not found, waiting for INIT_QUOTE message from parent...');
              setWaitingForInit(true);
              // Mark as complete since we're waiting for INIT_QUOTE (new quote scenario)
              setQuoteLoadComplete(true);
              // Don't send error - this is expected for new quotes
            } else {
              // Real error (network, etc.) - report it
              throw error;
            }
          }
        } else {
          // No Form ID provided in quote mode - this is an error condition
          // Do not auto-generate a Form ID - user must provide one via query parameter
          // The error banner will display to inform the user
          console.error('[PricingCalculator] Quote mode requires a formId parameter in the URL');
          sendQuoteError(
            'Quote mode requires a formId parameter in the URL',
            'VALIDATION_ERROR'
          );
          // Mark as complete even though there's an error (prevents auto-save loop)
          setQuoteLoadComplete(true);
          return;
        }
      } catch (error) {
        console.error('[PricingCalculator] Failed to initialize quote:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to initialize quote',
          'UNKNOWN',
          { error }
        );
        // Mark as complete even on error to prevent auto-save loop
        setQuoteLoadComplete(true);
      }
    };

    initializeQuote();
  }, []); // Only run once on mount

  // Send selection updates whenever pricing-related state changes
  useEffect(() => {
    if (count < currentPlan.contactThreshold || isLocked || adminMode) {
      sendSelectionUpdate({
        userType,
        selectedPlan,
        count,
        isAnnual,
        finalPrice: grandTotal,
        subscriptionPrice: subscriptionPrice,
        subscriptionPricePerUnit: subscriptionPricePerUnit,
        totalPrice,
        monthlySavings,
        wholesaleDiscountAmount,
        resellerCommissionAmount,
        wholesaleDiscount,
        resellerCommission,
        projectedLocations: projectedLocations,
        projectedPrice: projectedPrice,
        projectedPricePerUnit: projectedPricePerUnit,
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
          subscriptionPrice: subscriptionPrice,
          royaltyProcessingFee: royaltyProcessingFee,
          finalMonthlyPrice: grandTotal
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
    userType,
    selectedPlan,
    count,
    isAnnual,
    finalPrice,
    subscriptionPrice,
    grandTotal,
    subscriptionPricePerUnit,
    totalPrice,
    monthlySavings,
    wholesaleDiscountAmount,
    resellerCommissionAmount,
    wholesaleDiscount,
    resellerCommission,
    projectedLocations,
    projectedPrice,
    projectedPricePerUnit,
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
    isLocked,
    adminMode,
  ]);

  // Debounced quote updates (only in draft mode)
  useEffect(() => {
    console.log('[Auto-Save Debug]', {
      quoteMode,
      quoteStatus,
      formId,
      count,
      quoteLoadComplete,
      shouldSave: quoteMode && quoteStatus === 'draft' && formId && quoteLoadComplete
    });

    // Don't auto-save until initial quote load is complete
    if (!quoteMode || quoteStatus !== 'draft' || !formId || !quoteLoadComplete) return;

    const timer = setTimeout(async () => {
      console.log('[Auto-Save] Attempting to save quote with count:', count);
      try {
        const summary: QuoteSummary = {
          subtotal: totalPrice,
          final_monthly_price: grandTotal,
          subscription_price: subscriptionPrice,
          subscription_price_per_unit: subscriptionPricePerUnit,
          annual_savings: monthlySavings,
          price_breakdown: {
            subtotal: totalPrice,
            volumeDiscount: 0,
            customDiscount: customDiscountAmount,
            wholesaleDiscount: wholesaleDiscountAmount,
            annualSavings: monthlySavings,
            subscriptionPrice: subscriptionPrice,
            royaltyProcessingFee: royaltyProcessingFee,
            trainingOfferPrice: trainingOfferEnabled ? trainingOfferBasePrice : 0,
            finalMonthlyPrice: grandTotal,
          },
          plan_details: {
            name: currentPlan.name,
            connections: currentPlan.connections,
            users: selectedPlan === 'ai-advisor' ? count : count * currentPlan.usersPerCompany,
            scorecards: currentPlan.scorecardsPerCompany === 'unlimited'
              ? 'unlimited'
              : (selectedPlan === 'ai-advisor' ? currentPlan.scorecardsPerCompany : currentPlan.scorecardsPerCompany * count),
            aiTokens: calculatedAiTokens,
          },
          selection_raw: {
            userType,
            selectedPlan,
            count,
            isAnnual,
            showPricingDetails,
            projectedLocations: projectedLocations || null,
            customDiscount: customDiscountAmount > 0 && customDiscountType ? {
              type: customDiscountType,
              value: customDiscountValue,
              label: customDiscountLabel,
              reason: customDiscountReason,
              discountAmount: customDiscountAmount,
            } : null,
            royaltyProcessing: royaltyProcessingEnabled ? {
              enabled: true,
              baseFee: royaltyBaseFee,
              perTransaction: royaltyPerTransaction,
              estimatedTransactions: estimatedTransactions,
              totalFee: royaltyProcessingFee,
            } : null,
            onboardingFee: onboardingFeeAmount > 0 ? {
              amount: onboardingFeeAmount,
              title: onboardingFeeTitle,
              description: onboardingFeeDescription,
            } : null,
            customTerms: customTermsEnabled && customTermsContent ? {
              enabled: true,
              title: customTermsTitle,
              content: customTermsContent,
            } : null,
            trainingOffer: trainingOfferEnabled ? {
              enabled: true,
              basePrice: trainingOfferBasePrice,
              singlePayment: trainingOfferSinglePayment,
              twoPayment: trainingOfferTwoPayment,
              threePayment: trainingOfferThreePayment,
              spotsAvailable: trainingOfferSpotsAvailable,
              headline: trainingOfferHeadlinePrimary,
              subheadline: trainingOfferHeadlineSecondary,
              guaranteeEnabled: trainingOfferGuaranteeEnabled,
              guaranteeText: trainingOfferGuaranteeText,
            } : null,
          },
        };

        const response = await quoteApi.updateQuote(formId, summary);
        console.log('[Auto-Save] Quote response:', response);
        console.log('[Auto-Save] Quote successfully saved with count:', count);
        console.log('[Auto-Save] Check database - response count:', response?.count);

        // Emit QUOTE_SUMMARY_UPDATE message
        sendQuoteMessage('QUOTE_SUMMARY_UPDATE', {
          id: formId,
          version: quoteStatus === 'locked' ? 2 : 1,
          selectedPlan,
          count,
          isAnnual,
          currency: 'USD',
          priceBreakdown: summary.price_breakdown,
          planDetails: summary.plan_details,
          selectionRaw: summary.selection_raw,
          pricingModelId: currentPricingModelId,
          expiresInDays: embedConfig.expiresInDays,
        });
      } catch (error) {
        console.error('Failed to update quote:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to update quote',
          'UNKNOWN',
          { formId, error }
        );
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [
    quoteMode,
    quoteStatus,
    formId,
    userType,
    selectedPlan,
    count,
    isAnnual,
    projectedLocations,
    totalPrice,
    subscriptionPrice,
    grandTotal,
    subscriptionPricePerUnit,
    monthlySavings,
    customDiscountAmount,
    wholesaleDiscountAmount,
    royaltyProcessingFee,
    currentPlan,
    calculatedAiTokens,
    customDiscountType,
    customDiscountValue,
    customDiscountLabel,
    customDiscountReason,
    royaltyProcessingEnabled,
    royaltyBaseFee,
    royaltyPerTransaction,
    estimatedTransactions,
    onboardingFeeAmount,
    onboardingFeeTitle,
    onboardingFeeDescription,
    customTermsEnabled,
    customTermsTitle,
    customTermsContent,
    showPricingDetails,
    currentPricingModelId,
    isInIframe,
    embedConfig,
    quoteLoadComplete,
    trainingOfferEnabled,
    trainingOfferBasePrice,
    trainingOfferSinglePayment,
    trainingOfferTwoPayment,
    trainingOfferThreePayment,
    trainingOfferSpotsAvailable,
    trainingOfferHeadlinePrimary,
    trainingOfferHeadlineSecondary,
    trainingOfferGuaranteeEnabled,
    trainingOfferGuaranteeText,
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
    newEstimatedTransactions: number,
    newOnboardingFeeAmount: number,
    newOnboardingFeeTitle: string,
    newOnboardingFeeDescription: string,
    newQuoteStartDate: string,
    newQuoteExpirationDays: number,
    newCustomTermsEnabled: boolean,
    newCustomTermsTitle: string,
    newCustomTermsContent: string,
    newTrainingOfferEnabled: boolean,
    newTrainingOfferBasePrice: number,
    newTrainingOfferSinglePayment: boolean,
    newTrainingOfferTwoPayment: boolean,
    newTrainingOfferThreePayment: boolean,
    newTrainingOfferSpotsAvailable: number,
    newTrainingOfferHeadlinePrimary: string,
    newTrainingOfferHeadlineSecondary: string,
    newTrainingOfferGuaranteeEnabled: boolean,
    newTrainingOfferGuaranteeText: string
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
    setOnboardingFeeAmount(newOnboardingFeeAmount);
    setOnboardingFeeTitle(newOnboardingFeeTitle);
    setOnboardingFeeDescription(newOnboardingFeeDescription);
    setQuoteStartDate(newQuoteStartDate);
    setQuoteExpirationDays(newQuoteExpirationDays);
    setCustomTermsEnabled(newCustomTermsEnabled);
    setCustomTermsTitle(newCustomTermsTitle);
    setCustomTermsContent(newCustomTermsContent);
    setTrainingOfferEnabled(newTrainingOfferEnabled);
    setTrainingOfferBasePrice(newTrainingOfferBasePrice);
    setTrainingOfferSinglePayment(newTrainingOfferSinglePayment);
    setTrainingOfferTwoPayment(newTrainingOfferTwoPayment);
    setTrainingOfferThreePayment(newTrainingOfferThreePayment);
    setTrainingOfferSpotsAvailable(newTrainingOfferSpotsAvailable);
    setTrainingOfferHeadlinePrimary(newTrainingOfferHeadlinePrimary);
    setTrainingOfferHeadlineSecondary(newTrainingOfferHeadlineSecondary);
    setTrainingOfferGuaranteeEnabled(newTrainingOfferGuaranteeEnabled);
    setTrainingOfferGuaranteeText(newTrainingOfferGuaranteeText);

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
        estimatedTransactions: newEstimatedTransactions,
        onboardingFeeAmount: newOnboardingFeeAmount,
        onboardingFeeTitle: newOnboardingFeeTitle,
        onboardingFeeDescription: newOnboardingFeeDescription,
        quoteStartDate: newQuoteStartDate,
        quoteExpirationDays: newQuoteExpirationDays,
        customTermsEnabled: newCustomTermsEnabled,
        customTermsTitle: newCustomTermsTitle,
        customTermsContent: newCustomTermsContent,
        trainingOfferEnabled: newTrainingOfferEnabled,
        trainingOfferBasePrice: newTrainingOfferBasePrice,
        trainingOfferSinglePayment: paymentOpts.includes('1'),
        trainingOfferTwoPayment: paymentOpts.includes('2'),
        trainingOfferThreePayment: paymentOpts.includes('3'),
        trainingOfferHeadlinePrimary: newTrainingOfferHeadline,
        trainingOfferHeadlineSecondary: newTrainingOfferSubheadline,
        trainingOfferTestimonialName: newTrainingOfferTestimonialName,
        trainingOfferTestimonialRole: newTrainingOfferTestimonialRole,
        trainingOfferTestimonialQuote: newTrainingOfferTestimonialQuote,
        trainingOfferSpotsAvailable: newTrainingOfferSpotsAvailable,
        trainingOfferUrgencyText: newTrainingOfferUrgencyText,
        trainingOfferGuaranteeEnabled: true,
        trainingOfferGuaranteeText: savedSettings.trainingOfferGuaranteeText ?? "If you don't identify meaningful profit improvements within 30 days, we'll continue working with you at no additional charge until you do."
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Quote mode handlers
  const handleLockQuote = async () => {
    if (!formId) return;

    try {
      const lockedQuote = await quoteApi.lockQuote(formId, quoteExpirationDays);
      setQuoteStatus('locked');
      setQuoteExpiresAt(lockedQuote.expires_at);
      setQuoteLockedAt(lockedQuote.locked_at);

      // Emit QUOTE_LOCKED message
      sendQuoteMessage('QUOTE_LOCKED', {
        id: formId,
        version: lockedQuote.version,
        expiresAt: lockedQuote.expires_at,
        lockedAt: lockedQuote.locked_at,
        status: 'locked',
        pricingModelId: currentPricingModelId,
        payload: lockedQuote
      });
    } catch (error) {
      console.error('Failed to lock quote:', error);
      sendQuoteError(
        error instanceof Error ? error.message : 'Failed to lock quote',
        'UNKNOWN',
        { formId, error }
      );
      alert('Failed to lock quote. Please try again.');
    }
  };

  const handleUnlockQuote = async () => {
    if (!formId) return;

    try {
      const unlockedQuote = await quoteApi.unlockQuote(formId);

      // Update state to reflect unlocked status
      setQuoteStatus('draft');
      setQuoteExpiresAt(null);
      setQuoteLockedAt(null);

      // Set quote start date to current date as per user requirements
      const currentDate = new Date().toISOString().split('T')[0];
      setQuoteStartDate(currentDate);

      // Emit QUOTE_UNLOCKED message
      sendQuoteMessage('QUOTE_UNLOCKED', {
        id: formId,
        version: 1, // Back to draft version
        status: 'draft',
        pricingModelId: currentPricingModelId,
        payload: unlockedQuote
      });

      console.log('[PricingCalculator] Quote unlocked:', {
        formId,
        newStartDate: currentDate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to unlock quote:', error);
      sendQuoteError(
        error instanceof Error ? error.message : 'Failed to unlock quote',
        'UNKNOWN',
        { formId, error }
      );
      throw error; // Re-throw so the Settings component can handle the error
    }
  };

  const handleAcceptQuote = () => {
    if (!formId) return;

    console.log('[PricingCalculator] Accept Quote clicked:', {
      formId,
      isInIframe,
      isEmbedded: embedConfig.isEmbedded,
      timestamp: new Date().toISOString()
    });

    // Check if we're in an iframe (embedded mode)
    if (isInIframe) {
      // Embedded mode: Emit QUOTE_ACCEPT_INTENT message (parent handles click-wrap)
      console.log('[PricingCalculator] Embedded mode: Sending QUOTE_ACCEPT_INTENT message');
      sendQuoteMessage('QUOTE_ACCEPT_INTENT', {
        id: formId,
        version: 2, // Locked quotes have version 2
        status: 'locked',
        pricingModelId: currentPricingModelId,
      });
    } else {
      // Standalone mode: Show click-wrap modal
      console.log('[PricingCalculator] Standalone mode: Opening ClickWrap modal');
      setShowClickWrapModal(true);
    }
  };

  // Handle quote acceptance from modal (standalone mode)
  // Opens the main form where they can complete quote acceptance
  const handleModalAcceptQuote = () => {
    if (!formId) return;

    // Generate the form URL with formId parameter and step=pricing to navigate directly to pricing step
    // Use the current domain instead of hardcoded URL
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/?formId=${formId}&step=pricing`;

    // Open in new tab
    window.open(formUrl, '_blank');

    // Close modal
    setShowClickWrapModal(false);

    console.log('[PricingCalculator] Redirecting to form for quote acceptance:', {
      formId,
      formUrl,
      timestamp: new Date().toISOString()
    });
  };

  // Handle incoming CONFIRM_QUOTE_ACCEPTANCE message from parent
  useEffect(() => {
    if (!incomingMessage || incomingMessage.type !== 'CONFIRM_QUOTE_ACCEPTANCE') return;
    if (!formId || quoteStatus !== 'locked') return;

    const acceptQuote = async () => {
      try {
        // Update quote status to accepted in database
        const acceptedAt = incomingMessage.data?.acceptedAt || new Date().toISOString();

        // Here you would call an API to mark the quote as accepted
        // For now, we'll just update local state and send confirmation
        setQuoteStatus('accepted');
        setQuoteAcceptedAt(acceptedAt);

        // Send QUOTE_ACCEPTED confirmation back to parent
        sendQuoteMessage('QUOTE_ACCEPTED', {
          id: formId,
          version: 2,
          status: 'accepted',
          acceptedAt: acceptedAt,
          pricingModelId: currentPricingModelId,
        });

        console.log('[PricingCalculator] Quote accepted:', {
          formId,
          acceptedAt,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to accept quote:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to accept quote',
          'UNKNOWN',
          { formId, error }
        );
      }
    };

    acceptQuote();
  }, [incomingMessage, formId, quoteStatus, currentPricingModelId, sendQuoteMessage, sendQuoteError]);

  // Handle incoming SET_ADMIN_MODE message from parent
  useEffect(() => {
    if (!incomingMessage || incomingMessage.type !== 'SET_ADMIN_MODE') return;

    const enabled = incomingMessage.data?.enabled ?? false;
    setAdminMode(enabled);
    console.log('[PricingCalculator] Admin mode set to:', enabled);
  }, [incomingMessage]);

  // Handle incoming INIT_QUOTE message from parent
  useEffect(() => {
    if (!incomingMessage || incomingMessage.type !== 'INIT_QUOTE') return;
    if (!formId || !waitingForInit) return;

    const initializeNewQuote = async () => {
      try {
        console.log('[PricingCalculator] Received INIT_QUOTE message, creating new quote...');
        const data = incomingMessage.data;

        // Create new quote in database
        const newQuote = await quoteApi.initQuote({
          id: formId,
          selected_plan: data?.selectedPlan || selectedPlan,
          count: data?.count || count,
          is_annual: data?.isAnnual ?? isAnnual,
        });

        console.log('[PricingCalculator] Created new quote:', newQuote.id);

        // Update state from initialized quote
        setQuoteStatus(data?.status || 'draft');
        setCurrentPricingModelId(newQuote.pricing_model_id || null);
        setWaitingForInit(false);

        // Apply selections from INIT_QUOTE data
        if (data?.userType) {
          setUserType(data.userType);
        }
        if (data?.selectedPlan) {
          setSelectedPlan(data.selectedPlan as PlanType);
        }
        if (data?.count !== undefined) {
          setCount(data.count);
        }
        if (data?.isAnnual !== undefined) {
          setIsAnnual(data.isAnnual);
        }

        // Apply custom discount if provided
        if (data?.customDiscount) {
          setCustomDiscountType(data.customDiscount.type);
          setCustomDiscountValue(data.customDiscount.value);
          setCustomDiscountLabel(data.customDiscount.label);
          setCustomDiscountReason(data.customDiscount.reason || '');
        }

        // Apply royalty processing if provided
        if (data?.royaltyProcessing) {
          setRoyaltyProcessingEnabled(data.royaltyProcessing.enabled);
          setRoyaltyBaseFee(data.royaltyProcessing.baseFee);
          setRoyaltyPerTransaction(data.royaltyProcessing.perTransaction);
          setEstimatedTransactions(data.royaltyProcessing.estimatedTransactions);
        }

        // Apply onboarding fee if provided
        if (data?.onboardingFee) {
          setOnboardingFeeAmount(data.onboardingFee.amount);
          setOnboardingFeeTitle(data.onboardingFee.title);
          setOnboardingFeeDescription(data.onboardingFee.description);
        }

        // Apply custom terms if provided
        if (data?.customTerms) {
          setCustomTermsEnabled(data.customTerms.enabled);
          setCustomTermsTitle(data.customTerms.title);
          setCustomTermsContent(data.customTerms.content);
        }

        // Apply projected locations if provided
        if (data?.projectedLocations !== undefined) {
          setProjectedLocations(data.projectedLocations);
        }

        // Apply showPricingDetails if provided
        if (data?.showPricingDetails !== undefined) {
          setShowPricingDetails(data.showPricingDetails);
        }

        // Apply locked/expires dates if provided
        if (data?.lockedAt) {
          setQuoteLockedAt(data.lockedAt);
        }
        if (data?.expiresAt) {
          setQuoteExpiresAt(data.expiresAt);
        }

        // Send QUOTE_ID_READY to parent
        sendQuoteMessage('QUOTE_ID_READY', {
          id: formId,
          status: 'draft',
          version: 1,
        });

        // Mark quote load as complete after INIT_QUOTE
        setQuoteLoadComplete(true);
        console.log('[PricingCalculator] Quote initialized successfully, sent QUOTE_ID_READY');
      } catch (error) {
        console.error('[PricingCalculator] Failed to initialize quote from INIT_QUOTE:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to initialize quote',
          'UNKNOWN',
          { formId, error }
        );
        setWaitingForInit(false);
        // Mark as complete even on error
        setQuoteLoadComplete(true);
      }
    };

    initializeNewQuote();
  }, [incomingMessage, formId, waitingForInit, selectedPlan, count, isAnnual, sendQuoteMessage, sendQuoteError]);

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    if (!formId) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?mode=quote&formId=${formId}`;

    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(shareUrl);
      alert('Quote link copied to clipboard!');
    } catch (err) {
      // Fallback for embedded iframes where clipboard API is restricted
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
          alert('Quote link copied to clipboard!');
        } else {
          throw new Error('execCommand failed');
        }
      } catch (fallbackErr) {
        console.error('Failed to copy:', err, fallbackErr);
        alert('Failed to copy link. Please try again.');
      }
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
      {/* Form ID Error Banner - shown at very top when in quote mode without formId */}
      <FormIdErrorBanner show={quoteMode && !formId} />

      {/* Initialization Loading Banner - shown when waiting for INIT_QUOTE */}
      {waitingForInit && (
        <div className="bg-blue-50 border-b-2 border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Initializing quote...
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Waiting for quote data from parent application
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Selector at the very top */}
      <RoleSelector selected={userType} onChange={setUserType} isEmbedded={embedConfig.isEmbedded} />

      <div className={outerPadding}>
        <div className={`max-w-6xl mx-auto ${bottomMargin} ${topMargin}`}>
        {/* Quote Mode Banner */}
        {quoteMode && (
          <>
            <QuoteModeBanner
              status={quoteStatus}
              expiresAt={quoteExpiresAt}
              lockedAt={quoteLockedAt}
              onScheduleMeeting={() => {
                setIsEnterpriseRequest(true);
                setShowContactModal(true);
              }}
            />
            {/* Minimalistic copy quote button - tiny period style */}
            {formId && (
              <button
                onClick={handleCopyShareLink}
                className="fixed top-5 right-5 z-50 w-3 h-3 bg-gray-500 hover:bg-blue-600 rounded-full transition-all hover:w-8 hover:h-8 group flex items-center justify-center"
                title="Copy quote link"
              >
                <svg
                  className="w-0 h-0 group-hover:w-4 group-hover:h-4 text-white transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
          </>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 p-1 overflow-visible relative">
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={() => setSelectedPlan('ai-advisor')}
              disabled={isLocked}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'ai-advisor'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">AI Growth Advisor</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">0 connections</div>
            </button>
            <button
              onClick={() => setSelectedPlan('starter')}
              disabled={isLocked}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'starter'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Starter</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">1 connection</div>
            </button>
            <button
              onClick={() => setSelectedPlan('growth')}
              disabled={isLocked}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition relative ${
                selectedPlan === 'growth'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Most Popular Badge */}
              <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] md:text-xs font-bold px-2 sm:px-3 md:px-4 py-1 rounded-full shadow-md whitespace-nowrap badge-pulse">
                  MOST POPULAR
                </div>
              </div>
              <div className="font-bold text-sm sm:text-base md:text-lg">Growth</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">3 connections</div>
            </button>
            <button
              onClick={() => setSelectedPlan('scale')}
              disabled={isLocked}
              className={`flex-1 px-4 py-3 rounded-md smooth-transition ${
                selectedPlan === 'scale'
                  ? 'bg-[#1239FF] text-white shadow-md'
                  : 'bg-transparent text-[#180D43] hover:bg-gray-50'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Scale</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">5 connections</div>
            </button>
            <button
              onClick={() => {
                setIsEnterpriseRequest(true);
                setShowContactModal(true);
              }}
              className="flex-1 px-4 py-3 rounded-md smooth-transition bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-[#180D43] hover:to-[#1239FF] hover:shadow-lg"
            >
              <div className="font-bold text-sm sm:text-base md:text-lg">Enterprise</div>
              <div className="text-[11px] sm:text-xs md:text-sm mt-0.5 opacity-90">Custom pricing • Unlimited</div>
              <div className="text-[10px] sm:text-xs mt-0.5 opacity-75">Talk to Sales</div>
            </button>
          </div>
        </div>
      </div>

      <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} monthlySavings={monthlySavings} isEmbedded={embedConfig.isEmbedded} disabled={isLocked} />

      {/* Nudge Banner - soft gate before contact threshold */}
      {showNudgeBanner && (
        <div className="max-w-4xl mx-auto">
          <NudgeBanner
            count={count}
            unitLabel={selectedPlan === 'ai-advisor' ? 'users' : terminology.plural}
            onSchedule={() => {
              setShowNudgeBanner(false);
              setShowContactModal(true);
            }}
            onDismiss={() => {
              setShowNudgeBanner(false);
              setNudgeBannerDismissed(true);
            }}
          />
        </div>
      )}

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
                  if (!adminMode) {
                    setIsEnterpriseRequest(false);
                    setShowContactModal(true);
                  }
                }}
                disabled={isLocked}
                adminMode={adminMode}
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

          {/* Only show Price Summary when below enterprise threshold, quote is locked, or admin mode */}
          {(count < currentPlan.contactThreshold || isLocked || adminMode) && (
            <div className="bg-white rounded-lg shadow-sm border border-[#1239FF]/10 overflow-hidden">
              <div className="bg-[#1239FF] text-white p-2">
                <h2 className="text-sm font-semibold">Price Summary</h2>
              </div>
              <div className="p-3">
              {/* Simplified Price Display */}
              <div className="text-center py-4">
                <div className="text-4xl md:text-5xl font-bold gradient-text-primary mb-2 animate-count" role="status" aria-live="polite" aria-label={`Price: $${formatNumber(subscriptionPrice)} per month`}>
                  ${formatNumber(subscriptionPrice)}
                  <span className="text-lg md:text-xl font-normal text-[#180D43]/70">/mo</span>
                </div>
                <div className="text-base md:text-lg text-[#180D43]/80 mb-1">
                  {count} {selectedPlan === 'ai-advisor' ? 'users' : terminology.plural} • <span className="font-semibold text-[#1239FF]">${formatNumber(subscriptionPricePerUnit)}</span> each
                </div>
                {isAnnual && (
                  <div className="text-xs md:text-sm text-green-600 font-medium">
                    Billed annually (${formatNumber(subscriptionPrice * 12)}/year)
                  </div>
                )}
              </div>

              {/* CTA Button - Quote Mode or Calculator Mode */}
              <div className="mb-4">
                {quoteMode ? (
                  // Quote Mode Buttons
                  <>
                    {quoteStatus === 'draft' && (
                      <>
                        {/* Social Proof Above Lock Quote Button */}
                        <div className="mb-3 text-center">
                          <p className="text-sm text-gray-600">
                            <span className="text-orange-600 font-semibold">Trusted by 3,500+ businesses</span>
                          </p>
                        </div>

                        <button
                          onClick={handleLockQuote}
                          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 smooth-transition transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                          Lock Quote for {embedConfig.expiresInDays} Days — No Payment Required
                        </button>
                      </>
                    )}

                    {quoteStatus === 'locked' && (
                      <>
                        {/* Social Proof Above Accept Quote Button */}
                        <div className="mb-3 text-center">
                          <p className="text-sm text-gray-600">
                            <span className="text-orange-600 font-semibold">🎉 Your quote is locked!</span> Accept now to get started.
                          </p>
                        </div>

                        <button
                          onClick={handleAcceptQuote}
                          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 smooth-transition transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                          Accept Quote
                        </button>

                        {/* Secondary Actions for Locked Quote */}
                        <div className="mt-3 flex gap-3">
                          <button
                            onClick={handleCopyShareLink}
                            className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Quote Link
                          </button>
                          <button
                            onClick={() => setShowPricingDetails(!showPricingDetails)}
                            className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <BarChart3 className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </>
                    )}

                    {quoteStatus === 'accepted' && (
                      <div className="w-full bg-green-50 border-2 border-green-500 px-6 py-3 rounded-lg text-lg font-semibold text-green-800 text-center">
                        ✓ Quote Accepted
                      </div>
                    )}

                    {quoteStatus === 'expired' && (
                      <div className="w-full bg-red-50 border-2 border-red-500 px-6 py-3 rounded-lg text-lg font-semibold text-red-800 text-center">
                        Quote Expired
                      </div>
                    )}

                    {/* Social Proof for Quote Mode - Below Buttons */}
                    {(quoteStatus === 'draft' || quoteStatus === 'locked') && (
                      <>
                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs text-[#180D43]/60">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            No payment required
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Cancel anytime
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            30-day money-back guarantee
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            SOC 2 Type 1 certified
                          </span>
                          <span className="flex items-center gap-1">
                            🔒
                            SSL secure checkout
                          </span>
                        </div>

                        {/* Customer Count & Reviews */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-center mb-2">
                            <p className="text-sm text-gray-600">
                              <span className="text-[#1239FF] font-semibold">Trusted by 3,500+ businesses</span>
                            </p>
                          </div>
                          <a
                            href="https://www.autymate.com/reviews"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-center items-center gap-2 text-sm text-gray-700 hover:text-[#1239FF] smooth-transition"
                          >
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-orange-400">⭐</span>
                              ))}
                            </div>
                            <span className="font-semibold">1,000+ 5-star reviews</span>
                            <span className="text-xs text-gray-500">→</span>
                          </a>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  // Calculator Mode Button
                  <>
                    {/* Customer Count Social Proof - Above Button */}
                    <div className="mb-3 text-center">
                      <p className="text-sm text-gray-600">
                        <span className="text-[#1239FF] font-semibold">Join 3,500+ customers</span> from franchisor, SMB to enterprises
                      </p>
                    </div>

                    <a
                      href="https://auth.autymate.com/Register"
                      onClick={() => {
                        sendUserAction('START_FREE_TRIAL', {
                          userType,
                          selectedPlan,
                          count,
                          isAnnual,
                          finalPrice: grandTotal,
                          subscriptionPrice: subscriptionPrice,
                          subscriptionPricePerUnit: subscriptionPricePerUnit,
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
                      className="w-full bg-[#FF6B35] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#FF5722] smooth-transition transform hover:scale-[1.02] shadow-lg hover:shadow-xl block text-center"
                    >
                      Start Free Trial — No Credit Card
                    </a>

                    {/* Trust Badges & Reviews - Below Button */}
                    <div className="mt-3 space-y-2">
                      {/* Row 1: Trial Benefits */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-[#180D43]/60">
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
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          30-day money-back guarantee
                        </span>
                      </div>
                      {/* Row 2: Security */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-[#180D43]/60">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          SOC 2 Type 1 certified
                        </span>
                        <span className="flex items-center gap-1">
                          🔒
                          SSL secure checkout
                        </span>
                      </div>
                    </div>

                    {/* 5-Star Reviews Link */}
                    <a
                      href="https://www.autymate.com/reviews"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center items-center gap-2 mt-3 text-sm text-gray-700 hover:text-[#1239FF] smooth-transition border-t border-gray-200 pt-3"
                    >
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-orange-400">⭐</span>
                        ))}
                      </div>
                      <span className="font-semibold">1,000+ 5-star reviews</span>
                      <span className="text-xs text-gray-500">→</span>
                    </a>
                  </>
                )}
              </div>

              {/* Royalty Processing Add-on - Only for franchisees */}
              {selectedPlan !== 'ai-advisor' && userType === 'franchisee' && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  {!showRoyaltyAddon && !royaltyProcessingEnabled && (
                    <button
                      onClick={() => {
                        setShowRoyaltyAddon(true);
                        setRoyaltyProcessingEnabled(true);
                      }}
                      disabled={isLocked}
                      className={`text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 w-full justify-center py-2 hover:bg-blue-50 rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>+ Add Royalty Processing</span>
                      <span className="text-xs text-gray-600">
                        (~${(royaltyPerTransaction * 2 * count).toFixed(2)}/mo for 2 txns)
                      </span>
                    </button>
                  )}

                  {(showRoyaltyAddon || royaltyProcessingEnabled) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={royaltyProcessingEnabled}
                              onChange={(e) => setRoyaltyProcessingEnabled(e.target.checked)}
                              disabled={isLocked}
                              className="w-4 h-4"
                            />
                            <span className="font-medium text-sm">Royalty Processing</span>
                          </div>
                          <p className="text-xs text-gray-600 ml-6 mb-2">
                            Included with plan - pay only ACH fees ($1.82/transaction)
                          </p>
                          <div className="ml-6">
                            <label className="text-xs text-gray-700">
                              Transactions per {terminology.singular}/month:
                              <input
                                type="number"
                                min="0"
                                value={estimatedTransactions}
                                onChange={(e) => setEstimatedTransactions(parseInt(e.target.value) || 0)}
                                disabled={isLocked}
                                className="ml-2 w-16 px-2 py-1 border rounded text-sm"
                              />
                            </label>
                            {estimatedTransactions > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Cost: ${(royaltyPerTransaction * estimatedTransactions * count).toFixed(2)}/mo
                              </p>
                            )}
                          </div>
                        </div>
                        {!isLocked && (
                          <button
                            onClick={() => {
                              setShowRoyaltyAddon(false);
                              setRoyaltyProcessingEnabled(false);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 ml-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                      <div className="flex justify-between pb-2 border-b border-gray-200">
                        <span className="font-medium text-sm md:text-base">
                          {count} {selectedPlan === 'ai-advisor' ? (count === 1 ? 'user' : 'users') : (count === 1 ? terminology.singular : terminology.plural)} × ${formatNumber(basePrice.total / count)} each
                        </span>
                        <span className="font-medium text-sm md:text-base whitespace-nowrap">${formatNumber(basePrice.total)}/mo</span>
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

                      {/* Subscription Subtotal */}
                      <div className="pt-2 pb-2 border-b-2 border-gray-300">
                        <div className="flex justify-between font-semibold text-sm md:text-base">
                          <span>Subscription Subtotal:</span>
                          <span className="text-[#1239FF]">${formatNumber(subscriptionPrice)}/mo</span>
                        </div>
                      </div>

                      {/* Optional Add-ons Section */}
                      {royaltyProcessingEnabled && (
                        <>
                          <div className="pt-2 pb-1">
                            <span className="text-xs font-semibold text-[#180D43]/60 uppercase tracking-wide">Optional Add-ons:</span>
                          </div>
                          <div className="border-b border-gray-200 pb-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[#180D43]/70 font-medium">
                                <span>Royalty processing ({count} {terminology.plural})</span>
                                <span>+${formatNumber(royaltyProcessingFee)}/mo</span>
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
                        </>
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

                      <div className="pt-2">
                        <div className="flex justify-between font-bold text-base md:text-lg">
                          <span>Final Monthly Cost:</span>
                          <span className="text-[#1239FF]">${formatNumber(grandTotal)}/mo</span>
                        </div>
                      </div>

                      {onboardingFeeAmount > 0 && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[#180D43]">{onboardingFeeTitle}</span>
                                  {onboardingFeeDescription && (
                                    <Tooltip content={onboardingFeeDescription} position="top" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    ONE-TIME FEE
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-lg text-amber-700">
                                ${formatNumber(onboardingFeeAmount)}
                              </span>
                            </div>
                            {onboardingFeeDescription && (
                              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                {onboardingFeeDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Training Offer Section */}
                      {trainingOfferEnabled && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[#180D43]">90 Day Profit Playbook Accelerator Program</span>
                                  <Tooltip content="Transform your P&L into 30-50% higher profit margins with our proven system combining AI analysis, 2,500 strategies from 250 books, and weekly accountability" position="top" />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    ONE-TIME TRAINING FEE
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-lg text-blue-700">
                                ${formatNumber(trainingOfferBasePrice)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">•</span>
                                <span>
                                  {/* Display the selected payment option */}
                                  {trainingOfferThreePayment ?
                                    `3 Monthly Payments: $${formatNumber(Math.round(trainingOfferBasePrice / 3))} × 3` :
                                    trainingOfferTwoPayment ?
                                    `2 Payments: $${formatNumber(Math.round(trainingOfferBasePrice / 2))} × 2` :
                                    `Pay in Full: $${formatNumber(trainingOfferBasePrice)}`
                                  }
                                </span>
                              </div>
                              {trainingOfferGuaranteeEnabled && (
                                <p className="mt-2 text-xs italic text-green-700 bg-green-50 p-2 rounded border border-green-200">
                                  ✓ 14-Day Money-Back Guarantee: If you're not satisfied with the training within the first 14 days, you get a full refund
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Terms Section */}
                      {customTermsEnabled && customTermsContent && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900">{customTermsTitle}</h4>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-blue-200 pt-2 pl-7">
                              {customTermsContent}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Projected Pricing Calculator - Quote Mode Only */}
              {quoteMode && selectedPlan !== 'ai-advisor' && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  {!projectedLocations && (
                    <button
                      onClick={() => setProjectedLocations(count * 5)}
                      disabled={isLocked}
                      className={`text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 w-full justify-center py-2 hover:bg-blue-50 rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>+ Calculate Pricing at Scale</span>
                      <span className="text-xs text-gray-600">
                        (see what you'll pay as you grow)
                      </span>
                    </button>
                  )}

                  {projectedLocations && projectedLocations > 0 && projectedPrice && (
                    <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 border-2 border-emerald-400 rounded-lg p-4 shadow-lg animate-in">
                      {/* Header with input */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg p-2">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-900 text-sm">Pricing at Scale:</span>
                              <input
                                type="number"
                                min={count + 1}
                                max="10000"
                                value={projectedLocations}
                                onChange={(e) => setProjectedLocations(parseInt(e.target.value) || null)}
                                disabled={isLocked}
                                className="w-24 px-2 py-1 border border-emerald-300 rounded text-sm font-semibold text-emerald-900 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                              <span className="text-sm text-gray-700">{terminology.plural}</span>
                            </div>
                          </div>
                        </div>
                        {!isLocked && (
                          <button
                            onClick={() => setProjectedLocations(null)}
                            className="text-xs text-gray-500 hover:text-red-600 ml-2 mt-1"
                            title="Remove projection"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Price Display - Big and Bold */}
                      <div className="bg-white/90 backdrop-blur rounded-lg p-4 mb-3 border border-emerald-200 shadow-sm">
                        <div className="flex items-baseline gap-2 mb-1">
                          <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            ${formatNumber(projectedPrice)}
                          </div>
                          <span className="text-lg font-normal text-gray-600">/mo</span>
                        </div>
                        <div className="text-sm text-gray-700 font-medium">
                          ${formatNumber(projectedPricePerUnit!)} per {terminology.singular}
                        </div>
                        {isAnnual && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            Billed annually (${formatNumber(projectedPrice * 12)}/year)
                          </div>
                        )}
                      </div>

                      {/* Savings Callout - Highly Visible */}
                      {savingsPerUnit && savingsPerUnit > 0 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg p-3 shadow-md">
                          <div className="flex items-center gap-2">
                            <div className="bg-white/20 rounded-full p-1.5">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-base">
                                Save ${formatNumber(savingsPerUnit)} per {terminology.singular}
                              </div>
                              <div className="text-xs text-emerald-50">
                                vs. current pricing — that's ${formatNumber(savingsPerUnit * projectedLocations)} total monthly savings!
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {savingsPerUnit && savingsPerUnit < 0 && (
                        <div className="bg-amber-100 border border-amber-300 rounded-lg p-2.5">
                          <div className="flex items-center gap-2 text-sm text-amber-900">
                            <BarChart3 className="w-4 h-4" />
                            <span className="font-medium">
                              ${formatNumber(Math.abs(savingsPerUnit))} more per {terminology.singular} than current pricing
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
      <FeatureComparison
        selectedPlan={selectedPlan}
        userType={userType}
        trainingOfferEnabled={trainingOfferEnabled}
        trainingOfferConfig={{
          basePrice: trainingOfferBasePrice,
          paymentPlans: {
            single: trainingOfferSinglePayment,
            twoPayment: trainingOfferTwoPayment,
            threePayment: trainingOfferThreePayment
          }
        }}
      />

      {/* Profit Sprint Offer - Show on public pricing page when enabled */}
      {!adminMode && trainingOfferEnabled && (
        <ProfitSprintOffer
          isVisible={true}
          onCTAClick={() => setShowContactModal(true)}
          config={{
            enabled: trainingOfferEnabled,
            basePrice: trainingOfferBasePrice,
            paymentPlans: {
              single: trainingOfferSinglePayment,
              twoPayment: trainingOfferTwoPayment,
              threePayment: trainingOfferThreePayment
            },
            spotsAvailable: trainingOfferSpotsAvailable,
            headlines: {
              primary: trainingOfferHeadlinePrimary,
              subhead: trainingOfferHeadlineSecondary
            },
            showCitations: true,
            guaranteeEnabled: trainingOfferGuaranteeEnabled,
            guaranteeText: trainingOfferGuaranteeText
          }}
        />
      )}

      {/* Sales Script Panel - Show only in admin mode when training offer is enabled */}
      {adminMode && trainingOfferEnabled && (
        <SalesScriptPanel
          isVisible={true}
          config={{
            enabled: trainingOfferEnabled,
            basePrice: trainingOfferBasePrice,
            paymentOptions: trainingOfferPaymentOptions,
            headline: trainingOfferHeadline,
            subheadline: trainingOfferSubheadline,
            testimonialName: trainingOfferTestimonialName,
            testimonialRole: trainingOfferTestimonialRole,
            testimonialQuote: trainingOfferTestimonialQuote,
            spotsAvailable: trainingOfferSpotsAvailable,
            urgencyText: trainingOfferUrgencyText
          }}
        />
      )}

      {adminMode && (
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
          onboardingFeeAmount={onboardingFeeAmount}
          onboardingFeeTitle={onboardingFeeTitle}
          onboardingFeeDescription={onboardingFeeDescription}
          quoteStartDate={quoteStartDate}
          quoteExpirationDays={quoteExpirationDays}
          customTermsEnabled={customTermsEnabled}
          customTermsTitle={customTermsTitle}
          customTermsContent={customTermsContent}
          trainingOfferEnabled={trainingOfferEnabled}
          trainingOfferBasePrice={trainingOfferBasePrice}
          trainingOfferSinglePayment={trainingOfferSinglePayment}
          trainingOfferTwoPayment={trainingOfferTwoPayment}
          trainingOfferThreePayment={trainingOfferThreePayment}
          trainingOfferSpotsAvailable={trainingOfferSpotsAvailable}
          trainingOfferHeadlinePrimary={trainingOfferHeadlinePrimary}
          trainingOfferHeadlineSecondary={trainingOfferHeadlineSecondary}
          trainingOfferGuaranteeEnabled={trainingOfferGuaranteeEnabled}
          trainingOfferGuaranteeText={trainingOfferGuaranteeText}
          onUpdatePricing={handlePricingUpdate}
          isEmbedded={embedConfig.isEmbedded}
          terminology={terminology}
          defaultPlanConfigs={DEFAULT_PLAN_CONFIGS}
          quoteMode={quoteMode}
          formId={formId}
          quoteStatus={quoteStatus}
          quoteLockedAt={quoteLockedAt}
          quoteAcceptedAt={quoteAcceptedAt}
          onUnlockQuote={handleUnlockQuote}
          onClose={undefined}
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
        userData={{
          formId: formId || undefined
        }}
        estimatedMonthlyMin={Math.round(finalPrice * 0.70)}
        estimatedMonthlyMax={Math.round(finalPrice * 0.85)}
        currentMonthlyPrice={Math.round(finalPrice)}
        isAnnual={isAnnual}
        onUserAction={(action) => {
          sendUserAction(action, {
            userType,
            selectedPlan,
            count,
            isAnnual,
            finalPrice: grandTotal,
            subscriptionPrice: subscriptionPrice,
            subscriptionPricePerUnit: subscriptionPricePerUnit,
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

      {/* Click-Wrap Modal for Standalone Quote Acceptance */}
      <ClickWrapModal
        isOpen={showClickWrapModal}
        onClose={() => setShowClickWrapModal(false)}
        onAccept={handleModalAcceptQuote}
        quoteSummary={{
          price: `$${grandTotal.toFixed(2)}`,
          plan: currentPlan.name,
          count: count,
          isAnnual: isAnnual,
        }}
        formUrl={`${window.location.origin}/?formId=${formId || ''}&step=pricing`}
      />
      </div>
    </div>
  );
}

export default App;