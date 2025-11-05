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
import { AlertCircle, ChevronDown, Shield, CreditCard, RefreshCw, Copy, BarChart3 } from 'lucide-react';
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
    // Quote mode parameters
    mode: params.get('mode') || 'calculator',
    quoteId: params.get('id') || null,
    expiresInDays: parseInt(params.get('quoteExpiresInDays') || '14', 10),
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
        quoteExpirationDays: parsed.quoteExpirationDays ?? 14
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
    quoteExpirationDays: 14
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

  // Quote mode state
  const [quoteMode, setQuoteMode] = useState(embedConfig.mode === 'quote');
  const [showClickWrapModal, setShowClickWrapModal] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(embedConfig.quoteId);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('draft');
  const [quoteExpiresAt, setQuoteExpiresAt] = useState<string | null>(null);
  const [quoteLockedAt, setQuoteLockedAt] = useState<string | null>(null);
  const [quoteAcceptedAt, setQuoteAcceptedAt] = useState<string | null>(null);
  const [currentPricingModelId, setCurrentPricingModelId] = useState<string | null>(null);

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

  // Determine if controls should be disabled (locked, accepted, or expired)
  const isLocked = quoteMode && (quoteStatus === 'locked' || quoteStatus === 'accepted' || quoteStatus === 'expired');

  // Auto-trigger ContactModal when count reaches enterprise threshold (skip for admins)
  useEffect(() => {
    if (count >= currentPlan.contactThreshold && !isLocked && !adminMode) {
      setIsEnterpriseRequest(false);
      setShowContactModal(true);
      // Send enterprise inquiry event
      sendEnterpriseInquiry(count, currentPlan.name);
    }
  }, [count, currentPlan.contactThreshold, currentPlan.name, sendEnterpriseInquiry, isLocked, adminMode]);

  // Quote mode initialization
  useEffect(() => {
    if (!quoteMode) return;

    const initializeQuote = async () => {
      try {
        if (quoteId) {
          // Load existing quote
          const existingQuote = await quoteApi.getQuote(quoteId);

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
          }
        } else {
          // Generate new quote ID
          const newId = crypto.randomUUID();
          setQuoteId(newId);

          // Initialize quote with current selections
          const newQuote = await quoteApi.initQuote({
            id: newId,
            selected_plan: selectedPlan,
            count: count,
            is_annual: isAnnual,
          });

          setCurrentPricingModelId(newQuote.pricing_model_id);
          setQuoteStatus('draft');

          // Emit QUOTE_ID_READY message
          sendQuoteMessage('QUOTE_ID_READY', {
            id: newId,
            version: 1,
            pricingModelId: newQuote.pricing_model_id,
            status: 'draft',
            expiresAt: null,
            payload: newQuote
          });
        }
      } catch (error) {
        console.error('Failed to initialize quote:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to initialize quote',
          'UNKNOWN',
          { error }
        );
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
    userType,
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
    isLocked,
    adminMode,
  ]);

  // Debounced quote updates (only in draft mode)
  useEffect(() => {
    if (!quoteMode || quoteStatus !== 'draft' || !quoteId) return;

    const timer = setTimeout(async () => {
      try {
        const summary: QuoteSummary = {
          subtotal: totalPrice,
          final_monthly_price: finalPriceWithRoyalty,
          price_per_unit: pricePerUnit,
          annual_savings: monthlySavings,
          price_breakdown: {
            subtotal: totalPrice,
            volumeDiscount: 0,
            customDiscount: customDiscountAmount,
            wholesaleDiscount: wholesaleDiscountAmount,
            annualSavings: monthlySavings,
            royaltyProcessingFee: royaltyProcessingFee,
            finalMonthlyPrice: finalPriceWithRoyalty,
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
            selectedPlan,
            count,
            isAnnual,
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
          },
        };

        await quoteApi.updateQuote(quoteId, summary);

        // Emit QUOTE_SUMMARY_UPDATE message
        sendQuoteMessage('QUOTE_SUMMARY_UPDATE', {
          id: quoteId,
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
          { quoteId, error }
        );
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [
    quoteMode,
    quoteStatus,
    quoteId,
    selectedPlan,
    count,
    isAnnual,
    totalPrice,
    finalPriceWithRoyalty,
    pricePerUnit,
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
    currentPricingModelId,
    isInIframe,
    embedConfig,
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
    newQuoteExpirationDays: number
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
        quoteExpirationDays: newQuoteExpirationDays
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Quote mode handlers
  const handleLockQuote = async () => {
    if (!quoteId) return;

    try {
      const lockedQuote = await quoteApi.lockQuote(quoteId, quoteExpirationDays);
      setQuoteStatus('locked');
      setQuoteExpiresAt(lockedQuote.expires_at);
      setQuoteLockedAt(lockedQuote.locked_at);

      // Emit QUOTE_LOCKED message
      sendQuoteMessage('QUOTE_LOCKED', {
        id: quoteId,
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
        { quoteId, error }
      );
      alert('Failed to lock quote. Please try again.');
    }
  };

  const handleUnlockQuote = async () => {
    if (!quoteId) return;

    try {
      const unlockedQuote = await quoteApi.unlockQuote(quoteId);

      // Update state to reflect unlocked status
      setQuoteStatus('draft');
      setQuoteExpiresAt(null);
      setQuoteLockedAt(null);

      // Set quote start date to current date as per user requirements
      const currentDate = new Date().toISOString().split('T')[0];
      setQuoteStartDate(currentDate);

      // Emit QUOTE_UNLOCKED message
      sendQuoteMessage('QUOTE_UNLOCKED', {
        id: quoteId,
        version: 1, // Back to draft version
        status: 'draft',
        pricingModelId: currentPricingModelId,
        payload: unlockedQuote
      });

      console.log('[PricingCalculator] Quote unlocked:', {
        quoteId,
        newStartDate: currentDate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to unlock quote:', error);
      sendQuoteError(
        error instanceof Error ? error.message : 'Failed to unlock quote',
        'UNKNOWN',
        { quoteId, error }
      );
      throw error; // Re-throw so the Settings component can handle the error
    }
  };

  const handleAcceptQuote = () => {
    if (!quoteId) return;

    console.log('[PricingCalculator] Accept Quote clicked:', {
      quoteId,
      isInIframe,
      isEmbedded: embedConfig.isEmbedded,
      timestamp: new Date().toISOString()
    });

    // Check if we're in an iframe (embedded mode)
    if (isInIframe) {
      // Embedded mode: Emit QUOTE_ACCEPT_INTENT message (parent handles click-wrap)
      console.log('[PricingCalculator] Embedded mode: Sending QUOTE_ACCEPT_INTENT message');
      sendQuoteMessage('QUOTE_ACCEPT_INTENT', {
        id: quoteId,
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
    if (!quoteId) return;

    // Generate the form URL with quoteId as uid parameter and step=pricing to navigate directly to pricing step
    const formUrl = `https://www.auty.io/?uid=${quoteId}&step=pricing`;

    // Open in new tab
    window.open(formUrl, '_blank');

    // Close modal
    setShowClickWrapModal(false);

    console.log('[PricingCalculator] Redirecting to form for quote acceptance:', {
      quoteId,
      formUrl,
      timestamp: new Date().toISOString()
    });
  };

  // Handle incoming CONFIRM_QUOTE_ACCEPTANCE message from parent
  useEffect(() => {
    if (!incomingMessage || incomingMessage.type !== 'CONFIRM_QUOTE_ACCEPTANCE') return;
    if (!quoteId || quoteStatus !== 'locked') return;

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
          id: quoteId,
          version: 2,
          status: 'accepted',
          acceptedAt: acceptedAt,
          pricingModelId: currentPricingModelId,
        });

        console.log('[PricingCalculator] Quote accepted:', {
          quoteId,
          acceptedAt,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to accept quote:', error);
        sendQuoteError(
          error instanceof Error ? error.message : 'Failed to accept quote',
          'UNKNOWN',
          { quoteId, error }
        );
      }
    };

    acceptQuote();
  }, [incomingMessage, quoteId, quoteStatus, currentPricingModelId, sendQuoteMessage, sendQuoteError]);

  // Handle incoming SET_ADMIN_MODE message from parent
  useEffect(() => {
    if (!incomingMessage || incomingMessage.type !== 'SET_ADMIN_MODE') return;

    const enabled = incomingMessage.data?.enabled ?? false;
    setAdminMode(enabled);
    console.log('[PricingCalculator] Admin mode set to:', enabled);
  }, [incomingMessage]);

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    if (!quoteId) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?mode=quote&id=${quoteId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Quote link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please try again.');
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
        {/* Quote Mode Banner */}
        {quoteMode && (
          <QuoteModeBanner
            status={quoteStatus}
            expiresAt={quoteExpiresAt}
            lockedAt={quoteLockedAt}
            onScheduleMeeting={() => {
              setIsEnterpriseRequest(true);
              setShowContactModal(true);
            }}
          />
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
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">$19/user • 0 connections</div>
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
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">1 connection • From $90</div>
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
              <div className="text-[11px] sm:text-xs md:text-sm mt-1 opacity-80">3 connections • From $120</div>
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
              <div className="text-[11px] sm:text-xs md:text-sm mt-0.5 opacity-90">Custom pricing • Unlimited</div>
              <div className="text-[10px] sm:text-xs mt-0.5 opacity-75">Talk to Sales</div>
            </button>
          </div>
        </div>
      </div>

      <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} monthlySavings={monthlySavings} isEmbedded={embedConfig.isEmbedded} disabled={isLocked} />

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
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        sendUserAction('START_FREE_TRIAL', {
                          userType,
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

              {/* Royalty Processing Add-on */}
              {selectedPlan !== 'ai-advisor' && (
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
          onUpdatePricing={handlePricingUpdate}
          isEmbedded={embedConfig.isEmbedded}
          terminology={terminology}
          defaultPlanConfigs={DEFAULT_PLAN_CONFIGS}
          quoteMode={quoteMode}
          quoteId={quoteId}
          quoteStatus={quoteStatus}
          quoteLockedAt={quoteLockedAt}
          quoteAcceptedAt={quoteAcceptedAt}
          onUnlockQuote={handleUnlockQuote}
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
            userType,
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

      {/* Click-Wrap Modal for Standalone Quote Acceptance */}
      <ClickWrapModal
        isOpen={showClickWrapModal}
        onClose={() => setShowClickWrapModal(false)}
        onAccept={handleModalAcceptQuote}
        quoteSummary={{
          price: `$${finalPriceWithRoyalty.toFixed(2)}`,
          plan: currentPlan.name,
          count: count,
          isAnnual: isAnnual,
        }}
        formUrl={`https://www.auty.io/?uid=${quoteId || ''}&step=pricing`}
      />
      </div>
    </div>
  );
}

export default App;