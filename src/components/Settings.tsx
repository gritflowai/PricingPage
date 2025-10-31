import React, { useState } from 'react';
import { Settings2, X, Plus, AlertCircle } from 'lucide-react';

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
  aiTokensPerCompany: number;
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

type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale';
type TabType = PlanType | 'reseller';

interface SettingsProps {
  planConfigs: Record<PlanType, PlanConfig>;
  wholesaleDiscount: number;
  resellerCommission: number;
  onUpdatePricing: (
    configs: Record<PlanType, PlanConfig>,
    wholesaleDiscount: number,
    resellerCommission: number
  ) => void;
  isEmbedded?: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  planConfigs,
  wholesaleDiscount: initialWholesaleDiscount,
  resellerCommission: initialResellerCommission,
  onUpdatePricing,
  isEmbedded = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ai-advisor');
  const [updatedConfigs, setUpdatedConfigs] = useState<Record<PlanType, PlanConfig>>(planConfigs);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(initialWholesaleDiscount);
  const [resellerCommission, setResellerCommission] = useState(initialResellerCommission);

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

    onUpdatePricing(sortedConfigs, wholesaleDiscount, resellerCommission);
    setIsOpen(false);
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
                {plan === 'ai-advisor' ? 'AI Growth Advisor (users)' : `${config.name} Plan (companies)`}
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
                  Scorecards per Company
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
                <input
                  type="number"
                  value={config.metricsPerScorecard}
                  onChange={(e) => updatePlanFeature(plan, 'metricsPerScorecard', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Tokens per Company
                </label>
                <input
                  type="number"
                  value={config.aiTokensPerCompany}
                  onChange={(e) => updatePlanFeature(plan, 'aiTokensPerCompany', Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="1000"
                  step="1000"
                />
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

          <div className="mb-4">
            <h4 className="text-sm font-semibold">Volume Pricing Tiers</h4>
            <p className="text-sm text-gray-600">
              Define pricing tiers based on the number of {plan === 'ai-advisor' ? 'users' : 'companies'}
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Pricing Settings</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {renderPricingTabs()}
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {activeTab === 'reseller' ? renderResellerSettings() :
               renderPlanSettings(activeTab as PlanType)}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
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
      )}
    </>
  );
};

export default Settings;