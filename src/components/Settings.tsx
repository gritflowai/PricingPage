import React, { useState } from 'react';
import { Settings2, X, Plus, AlertCircle, RotateCcw, Unlock } from 'lucide-react';
import { type DiscountType } from '../utils/discountCalculator';
import { type PlanType, type PlanConfig, type PricingTier } from '../config/planConfigs';
import type { QuoteStatus } from '../types/quote';

type TabType = PlanType | 'reseller' | 'discounts' | 'royalty-processing' | 'onboarding-fee';

interface SettingsProps {
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
  onUpdatePricing: (
    configs: Record<PlanType, PlanConfig>,
    wholesaleDiscount: number,
    resellerCommission: number,
    customDiscountType: DiscountType,
    customDiscountValue: number,
    customDiscountLabel: string,
    customDiscountReason: string,
    royaltyProcessingEnabled: boolean,
    royaltyBaseFee: number,
    royaltyPerTransaction: number,
    estimatedTransactions: number,
    onboardingFeeAmount: number,
    onboardingFeeTitle: string,
    onboardingFeeDescription: string,
    quoteStartDate: string,
    quoteExpirationDays: number
  ) => void;
  isEmbedded?: boolean;
  terminology?: {
    singular: string;
    plural: string;
    capitalized: string;
  };
  defaultPlanConfigs: Record<PlanType, PlanConfig>;
  // Quote-related props
  quoteMode?: boolean;
  quoteId?: string | null;
  quoteStatus?: QuoteStatus;
  quoteLockedAt?: string | null;
  quoteAcceptedAt?: string | null;
  onUnlockQuote?: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({
  planConfigs,
  wholesaleDiscount: initialWholesaleDiscount,
  resellerCommission: initialResellerCommission,
  customDiscountType: initialCustomDiscountType,
  customDiscountValue: initialCustomDiscountValue,
  customDiscountLabel: initialCustomDiscountLabel,
  customDiscountReason: initialCustomDiscountReason,
  royaltyProcessingEnabled: initialRoyaltyProcessingEnabled,
  royaltyBaseFee: initialRoyaltyBaseFee,
  royaltyPerTransaction: initialRoyaltyPerTransaction,
  estimatedTransactions: initialEstimatedTransactions,
  onboardingFeeAmount: initialOnboardingFeeAmount,
  onboardingFeeTitle: initialOnboardingFeeTitle,
  onboardingFeeDescription: initialOnboardingFeeDescription,
  quoteStartDate: initialQuoteStartDate,
  quoteExpirationDays: initialQuoteExpirationDays,
  onUpdatePricing,
  isEmbedded = false,
  terminology = { singular: 'company', plural: 'companies', capitalized: 'Companies' },
  defaultPlanConfigs,
  quoteMode = false,
  quoteId = null,
  quoteStatus = 'draft',
  quoteLockedAt = null,
  quoteAcceptedAt = null,
  onUnlockQuote
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ai-advisor');
  const [updatedConfigs, setUpdatedConfigs] = useState<Record<PlanType, PlanConfig>>(planConfigs);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(initialWholesaleDiscount);
  const [resellerCommission, setResellerCommission] = useState(initialResellerCommission);
  const [customDiscountType, setCustomDiscountType] = useState<DiscountType>(initialCustomDiscountType);
  const [customDiscountValue, setCustomDiscountValue] = useState(initialCustomDiscountValue);
  const [customDiscountLabel, setCustomDiscountLabel] = useState(initialCustomDiscountLabel);
  const [customDiscountReason, setCustomDiscountReason] = useState(initialCustomDiscountReason);
  const [royaltyProcessingEnabled, setRoyaltyProcessingEnabled] = useState(initialRoyaltyProcessingEnabled);
  const [royaltyBaseFee, setRoyaltyBaseFee] = useState(initialRoyaltyBaseFee);
  const [estimatedTransactions, setEstimatedTransactions] = useState(initialEstimatedTransactions);
  const [onboardingFeeAmount, setOnboardingFeeAmount] = useState(initialOnboardingFeeAmount);
  const [onboardingFeeTitle, setOnboardingFeeTitle] = useState(initialOnboardingFeeTitle);
  const [onboardingFeeDescription, setOnboardingFeeDescription] = useState(initialOnboardingFeeDescription);
  const [quoteStartDate, setQuoteStartDate] = useState(initialQuoteStartDate);
  const [quoteExpirationDays, setQuoteExpirationDays] = useState(initialQuoteExpirationDays);

  // Split out WorldPay fee and service fee (initialize from total if already set)
  const [worldPayFee, setWorldPayFee] = useState(() => {
    // If total is 1.82 (default), use 0.32, otherwise try to preserve ratio
    return initialRoyaltyPerTransaction === 1.82 ? 0.32 : 0.32;
  });
  const [achServiceFee, setAchServiceFee] = useState(() => {
    // If total is 1.82 (default), use 1.50, otherwise calculate from remainder
    return initialRoyaltyPerTransaction === 1.82 ? 1.50 : Math.max(0, initialRoyaltyPerTransaction - 0.32);
  });

  // Update total when individual fees change
  const totalPerTransaction = worldPayFee + achServiceFee;

  const handleSave = () => {
    // Sort tiers by firstUnit for each plan before saving
    const sortedConfigs = Object.keys(updatedConfigs).reduce((acc, key) => {
      const planKey = key as PlanType;
      const config = updatedConfigs[planKey];
      acc[planKey] = {
        ...config,
        pricingTiers: [...config.pricingTiers].sort((a, b) => a.firstUnit - b.firstUnit)
      };
      return acc;
    }, {} as Record<PlanType, PlanConfig>);

    onUpdatePricing(
      sortedConfigs,
      wholesaleDiscount,
      resellerCommission,
      customDiscountType,
      customDiscountValue,
      customDiscountLabel,
      customDiscountReason,
      royaltyProcessingEnabled,
      royaltyBaseFee,
      totalPerTransaction, // Use calculated total
      estimatedTransactions,
      onboardingFeeAmount,
      onboardingFeeTitle,
      onboardingFeeDescription,
      quoteStartDate,
      quoteExpirationDays
    );
    setIsOpen(false);
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all pricing settings to defaults? This cannot be undone.'
    );

    if (confirmReset) {
      // Clear localStorage
      try {
        localStorage.removeItem('pricingSettings');
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }

      // Reset all local state to defaults
      setUpdatedConfigs(defaultPlanConfigs);
      setWholesaleDiscount(0);
      setResellerCommission(0);
      setCustomDiscountType(null);
      setCustomDiscountValue(0);
      setCustomDiscountLabel('');
      setCustomDiscountReason('');
      setRoyaltyProcessingEnabled(false);
      setRoyaltyBaseFee(0);
      setWorldPayFee(0.32);
      setAchServiceFee(1.50);
      setEstimatedTransactions(2);
      setOnboardingFeeAmount(0);
      setOnboardingFeeTitle('Custom Onboarding Fee');
      setOnboardingFeeDescription('Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.');
      setQuoteStartDate(new Date().toISOString().split('T')[0]);
      setQuoteExpirationDays(14);

      // Optionally, you can also save the defaults immediately
      onUpdatePricing(
        defaultPlanConfigs,
        0,
        0,
        null,
        0,
        '',
        '',
        false,
        0,
        1.82,
        2,
        0,
        'Custom Onboarding Fee',
        'Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one.',
        new Date().toISOString().split('T')[0],
        14
      );

      // Keep modal open so user can see the reset took effect
      alert('Pricing settings have been reset to defaults.');
    }
  };

  const handleClearDiscount = () => {
    setCustomDiscountType(null);
    setCustomDiscountValue(0);
    setCustomDiscountLabel('');
    setCustomDiscountReason('');
  };

  const updatePlanTier = (plan: PlanType, index: number, field: keyof PricingTier, value: number) => {
    const newConfigs = { ...updatedConfigs };
    const newTiers = [...newConfigs[plan].pricingTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    newConfigs[plan] = { ...newConfigs[plan], pricingTiers: newTiers };
    setUpdatedConfigs(newConfigs);
  };

  const updatePlanFeature = (plan: PlanType, field: keyof PlanConfig, value: any) => {
    const newConfigs = { ...updatedConfigs };
    newConfigs[plan] = { ...newConfigs[plan], [field]: value };
    setUpdatedConfigs(newConfigs);
  };

  const updatePlanFeatureFlag = (plan: PlanType, flag: keyof PlanConfig['features'], value: boolean) => {
    const newConfigs = { ...updatedConfigs };
    newConfigs[plan] = {
      ...newConfigs[plan],
      features: {
        ...newConfigs[plan].features,
        [flag]: value
      }
    };
    setUpdatedConfigs(newConfigs);
  };

  const addTier = (plan: PlanType) => {
    const newConfigs = { ...updatedConfigs };
    const tiers = newConfigs[plan].pricingTiers;
    const lastTier = tiers[tiers.length - 1];
    const newTier: PricingTier = {
      firstUnit: lastTier ? lastTier.lastUnit + 1 : 1,
      lastUnit: lastTier ? lastTier.lastUnit + 5 : 5,
      perUnit: 0,
      flatFee: 0
    };
    newConfigs[plan] = {
      ...newConfigs[plan],
      pricingTiers: [...tiers, newTier]
    };
    setUpdatedConfigs(newConfigs);
  };

  const removeTier = (plan: PlanType, index: number) => {
    const newConfigs = { ...updatedConfigs };
    newConfigs[plan] = {
      ...newConfigs[plan],
      pricingTiers: newConfigs[plan].pricingTiers.filter((_, i) => i !== index)
    };
    setUpdatedConfigs(newConfigs);
  };

  const renderQuoteStatusIndicator = () => {
    if (!quoteMode || !quoteId) return null;

    const getStatusBadge = () => {
      switch (quoteStatus) {
        case 'draft':
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Draft</span>;
        case 'locked':
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">Locked</span>;
        case 'accepted':
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Accepted</span>;
        case 'expired':
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">Expired</span>;
        default:
          return null;
      }
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Quote Status:</span>
            {getStatusBadge()}
          </div>
          {quoteStartDate && (
            <div className="flex items-center gap-1">
              <span>Created:</span>
              <span className="font-medium text-gray-900">{formatDate(quoteStartDate)}</span>
            </div>
          )}
          {quoteLockedAt && (quoteStatus === 'locked' || quoteStatus === 'accepted' || quoteStatus === 'expired') && (
            <div className="flex items-center gap-1">
              <span>Locked:</span>
              <span className="font-medium text-gray-900">{formatDate(quoteLockedAt)}</span>
            </div>
          )}
          {quoteAcceptedAt && quoteStatus === 'accepted' && (
            <div className="flex items-center gap-1">
              <span>Accepted:</span>
              <span className="font-medium text-gray-900">{formatDate(quoteAcceptedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPricingTabs = () => (
    <div className="flex space-x-2 mt-4">
      <button
        onClick={() => setActiveTab('ai-advisor')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'ai-advisor'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        AI Growth Advisor
      </button>
      <button
        onClick={() => setActiveTab('starter')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'starter'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Starter
      </button>
      <button
        onClick={() => setActiveTab('growth')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'growth'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Growth
      </button>
      <button
        onClick={() => setActiveTab('scale')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'scale'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Scale
      </button>
      <button
        onClick={() => setActiveTab('reseller')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'reseller'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Reseller
      </button>
      <button
        onClick={() => setActiveTab('discounts')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'discounts'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Quote & Discount
      </button>
      <button
        onClick={() => setActiveTab('royalty-processing')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'royalty-processing'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Royalty Processing
      </button>
      <button
        onClick={() => setActiveTab('onboarding-fee')}
        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
          activeTab === 'onboarding-fee'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Onboarding Fee
      </button>
    </div>
  );

  const renderPlanSettings = (plan: PlanType) => {
    const config = updatedConfigs[plan];
    const stripeUrl = `https://dashboard.stripe.com/acct_1EV6jWFreq0FdVf6/products/${config.stripeProductId}`;

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{config.name} Plan Configuration</h3>
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-lg hover:bg-[#0A2540] transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View in Stripe
            </a>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Enterprise Contact Threshold</h4>
            <p className="text-sm text-gray-600 mb-3">
              Configure when to show the enterprise contact modal for this plan. Users selecting more than this threshold will be prompted to contact sales.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {plan === 'ai-advisor' ? 'AI Growth Advisor (users)' : `${config.name} Plan (${terminology.plural})`}
              </label>
              <input
                type="number"
                value={config.contactThreshold}
                onChange={(e) => updatePlanFeature(plan, 'contactThreshold', Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2"
                min="1"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Plan Features</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connections
                </label>
                <input
                  type="number"
                  value={config.connections}
                  disabled
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Users per Company
                </label>
                <input
                  type="number"
                  value={config.usersPerCompany}
                  onChange={(e) => updatePlanFeature(plan, 'usersPerCompany', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {plan === 'ai-advisor' ? 'Manual Scorecards' : 'Scorecards per Company'}
                </label>
                {plan === 'ai-advisor' || plan === 'scale' ? (
                  <input
                    type="text"
                    value="Unlimited"
                    disabled
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
                  />
                ) : (
                  <input
                    type="number"
                    value={config.scorecardsPerCompany as number}
                    onChange={(e) => updatePlanFeature(plan, 'scorecardsPerCompany', Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    min="1"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metrics per Scorecard
                </label>
                {plan === 'ai-advisor' ? (
                  <input
                    type="text"
                    value="Unlimited"
                    disabled
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
                  />
                ) : (
                  <input
                    type="number"
                    value={config.metricsPerScorecard}
                    onChange={(e) => updatePlanFeature(plan, 'metricsPerScorecard', Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    min="1"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Tokens per Dollar
                </label>
                <input
                  type="number"
                  value={config.aiTokensPerDollar}
                  onChange={(e) => updatePlanFeature(plan, 'aiTokensPerDollar', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI tokens are calculated dynamically: Final Monthly Cost × Tokens per Dollar
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Historic Data Years
                </label>
                <input
                  type="number"
                  value={config.historicDataYears}
                  onChange={(e) => updatePlanFeature(plan, 'historicDataYears', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          {plan !== 'ai-advisor' && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Feature Flags</h4>
              <p className="text-sm text-gray-600 mb-4">
                Enable or disable specific features for this plan. These features vary between tiers.
              </p>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.dailySync}
                    onChange={(e) => updatePlanFeatureFlag(plan, 'dailySync', e.target.checked)}
                    className="rounded border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Daily Sync</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.immediateSyncCommand}
                    onChange={(e) => updatePlanFeatureFlag(plan, 'immediateSyncCommand', e.target.checked)}
                    className="rounded border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Immediate Sync Command</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.billingFlexibility}
                    onChange={(e) => updatePlanFeatureFlag(plan, 'billingFlexibility', e.target.checked)}
                    className="rounded border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Billing Flexibility</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.features.customBranding}
                    onChange={(e) => updatePlanFeatureFlag(plan, 'customBranding', e.target.checked)}
                    className="rounded border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Custom Branding</span>
                </label>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-semibold">Volume Pricing Tiers</h4>
            <p className="text-sm text-gray-600">
              Define pricing tiers based on the number of {plan === 'ai-advisor' ? 'users' : terminology.plural}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="text-sm font-medium text-gray-500">First Unit</div>
              <div className="text-sm font-medium text-gray-500">Last Unit</div>
              <div className="text-sm font-medium text-gray-500">Per Unit ($)</div>
              <div className="text-sm font-medium text-gray-500">Flat Fee ($)</div>
            </div>

            {config.pricingTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 items-center relative group">
                <input
                  type="number"
                  value={tier.firstUnit}
                  onChange={(e) => updatePlanTier(plan, index, 'firstUnit', Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  min="1"
                />
                <input
                  type="number"
                  value={tier.lastUnit === Infinity ? 999999 : tier.lastUnit}
                  onChange={(e) => updatePlanTier(plan, index, 'lastUnit', Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  min="1"
                />
                <input
                  type="number"
                  value={tier.perUnit}
                  onChange={(e) => updatePlanTier(plan, index, 'perUnit', Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  min="0"
                  step="0.01"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={tier.flatFee}
                    onChange={(e) => updatePlanTier(plan, index, 'flatFee', Number(e.target.value))}
                    className="rounded-md border border-gray-300 px-3 py-2 w-full"
                    min="0"
                    step="0.01"
                  />
                  {config.pricingTiers.length > 1 && (
                    <button
                      onClick={() => removeTier(plan, index)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => addTier(plan)}
              className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium mt-4"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add another tier
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDiscountsSettings = () => {
    // Calculate the expiration date based on start date + days
    const calculateExpirationDate = () => {
      const startDate = new Date(quoteStartDate);
      const expirationDate = new Date(startDate);
      expirationDate.setDate(expirationDate.getDate() + quoteExpirationDays);
      return expirationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div className="space-y-8">
        {/* Quote Validity Period Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quote Validity Period</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={quoteStartDate}
                onChange={(e) => setQuoteStartDate(e.target.value)}
                className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#1239FF] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Date when the quote becomes valid
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid for (days)
              </label>
              <input
                type="number"
                value={quoteExpirationDays}
                onChange={(e) => setQuoteExpirationDays(Math.max(1, Number(e.target.value)))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#1239FF] focus:border-transparent"
                min="1"
                max="365"
              />
              <span className="ml-2 text-sm text-gray-500">days</span>
              <p className="text-xs text-gray-500 mt-1">
                Number of days until quote expires
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Expiration Date: {calculateExpirationDate()}
              </p>
              <p className="text-xs text-blue-700">
                Quote will expire on this date (calculated from start date + days)
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-800">
                <strong>💡 Best Practice:</strong> Research shows 7-14 day quotes convert 20% better than 30+ days.
                Shorter periods create urgency without being too restrictive.
              </p>
            </div>

            {/* Quote Lock/Unlock Section */}
            {quoteMode && quoteId && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                {(quoteStatus === 'locked' || quoteStatus === 'accepted') && onUnlockQuote && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 mb-2">Quote Management</h4>
                        <p className="text-sm text-amber-800 mb-3">
                          This quote is currently {quoteStatus}. Unlocking will return it to draft status and clear the lock date and expiration.
                        </p>
                        {quoteStatus === 'accepted' && (
                          <div className="bg-red-50 border border-red-300 rounded p-2 mb-3">
                            <p className="text-xs text-red-700">
                              <strong>⚠️ Warning:</strong> This quote has been accepted via click-wrap. Unlocking an accepted quote should only be done with caution.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            const confirmMessage = quoteStatus === 'accepted'
                              ? 'This quote has been accepted. Are you sure you want to unlock it? This will reset it to draft status.'
                              : 'Are you sure you want to unlock this quote? This will reset it to draft status and allow editing.';

                            if (window.confirm(confirmMessage)) {
                              try {
                                await onUnlockQuote();
                                alert('Quote unlocked successfully. You can now edit and re-lock it.');
                              } catch (error) {
                                console.error('Failed to unlock quote:', error);
                                alert('Failed to unlock quote. Please try again.');
                              }
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        >
                          <Unlock className="w-4 h-4" />
                          Unlock Quote
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {quoteStatus === 'draft' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Quote is in Draft Mode</h4>
                    <p className="text-sm text-blue-800">
                      To lock this quote, click the "Lock Quote" button on the main pricing page. Once locked, you can come back here to unlock it if needed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Custom Discount Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Custom Discount</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={customDiscountType === 'percentage'}
                  onChange={() => setCustomDiscountType('percentage')}
                  className="rounded-full border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">Percentage</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={customDiscountType === 'fixed'}
                  onChange={() => setCustomDiscountType('fixed')}
                  className="rounded-full border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
                />
                <span className="ml-2 text-sm text-gray-700">Fixed Amount</span>
              </label>
            </div>
          </div>

          {customDiscountType && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <div className="flex items-center">
                  {customDiscountType === 'percentage' && (
                    <>
                      <input
                        type="number"
                        value={customDiscountValue}
                        onChange={(e) => setCustomDiscountValue(Number(e.target.value))}
                        className="w-32 rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="text-gray-500 ml-2">%</span>
                    </>
                  )}
                  {customDiscountType === 'fixed' && (
                    <>
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        value={customDiscountValue}
                        onChange={(e) => setCustomDiscountValue(Number(e.target.value))}
                        className="w-32 rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Label (optional)
                </label>
                <input
                  type="text"
                  value={customDiscountLabel}
                  onChange={(e) => setCustomDiscountLabel(e.target.value)}
                  placeholder="e.g., Q1 Promotion, Enterprise Discount"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This label will be shown to customers in the pricing summary
                </p>
              </div>

              {wholesaleDiscount > 0 && customDiscountValue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <strong>Warning:</strong> Custom discounts cannot be combined with wholesale pricing.
                    Only one discount type will be applied. Please clear the wholesale discount or this custom discount.
                  </div>
                </div>
              )}

              {customDiscountValue > 0 && (
                <div className="pt-4">
                  <button
                    onClick={handleClearDiscount}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Clear Discount
                  </button>
                </div>
              )}
            </>
          )}

          {!customDiscountType && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">No discount applied</p>
              <p className="text-sm text-gray-500">
                Select a discount type above to add a custom discount to this quote
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    );
  };

  const renderResellerSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Wholesale Pricing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wholesale Discount Percentage
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={wholesaleDiscount}
                onChange={(e) => setWholesaleDiscount(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-gray-500 ml-2">%</span>
            </div>
          </div>
          {wholesaleDiscount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                Wholesale discount cannot be combined with annual pricing. Customers must choose either the wholesale discount or the annual discount.
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Reseller Commission</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reseller Commission Percentage
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={resellerCommission}
                onChange={(e) => setResellerCommission(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-gray-500 ml-2">%</span>
            </div>
          </div>
          {resellerCommission > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Commission Calculation Example</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Customer payment:</span>
                  <span>$1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit card processing fee (3%):</span>
                  <span>-$30.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Net amount:</span>
                  <span>$970.00</span>
                </div>
                <div className="flex justify-between font-medium text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Reseller commission ({resellerCommission}%):</span>
                  <span>${(970 * (resellerCommission / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOnboardingFeeSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Onboarding Fee</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure a one-time onboarding fee to cover custom setup, integration, and training services.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Amount (One-time)
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">$</span>
              <input
                type="number"
                value={onboardingFeeAmount}
                onChange={(e) => setOnboardingFeeAmount(Number(e.target.value))}
                className="w-48 rounded-md border border-gray-300 px-3 py-2"
                min="0"
                step="100"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave at $0 to hide the onboarding fee from pricing display
            </p>
          </div>

          {onboardingFeeAmount > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Title
                </label>
                <input
                  type="text"
                  value={onboardingFeeTitle}
                  onChange={(e) => setOnboardingFeeTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Custom Onboarding Fee"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display name shown to customers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={onboardingFeeDescription}
                  onChange={(e) => setOnboardingFeeDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  placeholder="Describe what's included in the onboarding..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detailed description of onboarding services (shown as a tooltip to customers)
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3">Preview</h4>
                <div className="bg-white border border-amber-300 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{onboardingFeeTitle}</span>
                        <span className="text-xs text-gray-500">(ℹ️ hover for details)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          ONE-TIME FEE
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-amber-700">
                      ${onboardingFeeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {onboardingFeeDescription && (
                    <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-200 pt-2">
                      <strong>Description:</strong> {onboardingFeeDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What to Include</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Custom chart of accounts (sCOA) setup</li>
                  <li>Organizational hierarchy configuration</li>
                  <li>Benchmarking and KPI reporting setup</li>
                  <li>Forecasting model configuration</li>
                  <li>Custom scorecard design and implementation</li>
                  <li>White-glove onboarding with dedicated support</li>
                  <li>Custom integrations or data migrations</li>
                  <li>Team training and knowledge transfer</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderRoyaltyProcessingSettings = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Royalty Payment Processing</h3>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={royaltyProcessingEnabled}
              onChange={(e) => setRoyaltyProcessingEnabled(e.target.checked)}
              className="rounded border-gray-300 text-[#1239FF] focus:ring-[#1239FF] h-4 w-4"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Enable Royalty Payment Processing
            </span>
          </label>
          <p className="text-sm text-gray-600 mt-2 ml-6">
            Add automated ACH royalty payment processing to franchise locations
          </p>
        </div>

        {royaltyProcessingEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fee per Location (Monthly)
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <input
                  type="number"
                  value={royaltyBaseFee}
                  onChange={(e) => setRoyaltyBaseFee(Number(e.target.value))}
                  className="w-32 rounded-md border border-gray-300 px-3 py-2"
                  min="0"
                  step="0.01"
                />
                <span className="text-gray-500 ml-2">per location/month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Monthly platform fee for royalty processing infrastructure
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Transaction Fee (ACH)
              </label>

              <div className="space-y-3 ml-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    WorldPay processing fee
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">$</span>
                    <input
                      type="number"
                      value={worldPayFee}
                      onChange={(e) => setWorldPayFee(Number(e.target.value))}
                      className="w-32 rounded-md border border-gray-300 px-3 py-2"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-gray-500 ml-2">per transaction</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ACH processing service fee
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">$</span>
                    <input
                      type="number"
                      value={achServiceFee}
                      onChange={(e) => setAchServiceFee(Number(e.target.value))}
                      className="w-32 rounded-md border border-gray-300 px-3 py-2"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-gray-500 ml-2">per transaction</span>
                  </div>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total per transaction:</span>
                    <span className="text-lg font-bold text-[#1239FF]">${totalPerTransaction.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Transactions per Location (Monthly)
              </label>
              <input
                type="number"
                value={estimatedTransactions}
                onChange={(e) => setEstimatedTransactions(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 px-3 py-2"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for pricing estimates only (typically 1-4 per month for royalty + territory fees)
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Pricing Example (10 locations)</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Base fee (10 locations × ${royaltyBaseFee.toFixed(2)}):</span>
                  <span>${(royaltyBaseFee * 10).toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction fees ({estimatedTransactions} × 10 × ${totalPerTransaction.toFixed(2)}):</span>
                  <span>${(totalPerTransaction * estimatedTransactions * 10).toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between font-medium text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Total royalty processing cost:</span>
                  <span>${((royaltyBaseFee * 10) + (totalPerTransaction * estimatedTransactions * 10)).toFixed(2)}/mo</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How It Works</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Automatically collect royalty payments via ACH from franchise locations</li>
                <li>Process territory fees, marketing fund contributions, and royalty payments</li>
                <li>WorldPay handles ACH processing ($0.32 per transaction)</li>
                <li>Reconciliation and reporting included in base fee</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Use absolute positioning for embedded mode to stay within iframe bounds
  const positionClass = isEmbedded ? 'absolute' : 'fixed';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${positionClass} bottom-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-40`}
        title="Settings"
      >
        <Settings2 className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="p-6 pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Pricing Settings</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Quote Status Indicator */}
              {renderQuoteStatusIndicator()}

              <div className="px-6 pb-6">
                {renderPricingTabs()}
              </div>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
              {activeTab === 'reseller' ? renderResellerSettings() :
               activeTab === 'discounts' ? renderDiscountsSettings() :
               activeTab === 'royalty-processing' ? renderRoyaltyProcessingSettings() :
               activeTab === 'onboarding-fee' ? renderOnboardingFeeSettings() :
               renderPlanSettings(activeTab as PlanType)}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                title="Reset all pricing settings to defaults"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;