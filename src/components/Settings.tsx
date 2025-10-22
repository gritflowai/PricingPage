import React, { useState } from 'react';
import { Settings2, X, Plus, AlertCircle } from 'lucide-react';

interface PricingTier {
  firstUnit: number;
  lastUnit: number;
  perUnit: number;
  flatFee: number;
}

interface SettingsProps {
  pricingTiers: PricingTier[];
  connectionPrice: number;
  onUpdatePricing: (
    tiers: PricingTier[], 
    connectionPrice: number, 
    wholesaleDiscount: number,
    resellerCommission: number
  ) => void;
}

const Settings: React.FC<SettingsProps> = ({
  pricingTiers,
  connectionPrice,
  onUpdatePricing
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'ai' | 'reseller'>('standard');
  const [standardTiers, setStandardTiers] = useState(pricingTiers);
  const [aiTiers, setAiTiers] = useState([{ firstUnit: 1, lastUnit: Infinity, perUnit: 19, flatFee: 0 }]);
  const [newConnectionPrice, setNewConnectionPrice] = useState(connectionPrice);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const [resellerCommission, setResellerCommission] = useState(0);

  const handleSave = () => {
    // Sort tiers by firstUnit before saving
    const sortedTiers = [...standardTiers].sort((a, b) => a.firstUnit - b.firstUnit);
    onUpdatePricing(
      sortedTiers, 
      newConnectionPrice,
      wholesaleDiscount,
      resellerCommission
    );
    setIsOpen(false);
  };

  const updateTier = (index: number, field: keyof PricingTier, value: number, type: 'standard' | 'ai') => {
    if (type === 'standard') {
      const newTiers = [...standardTiers];
      newTiers[index] = { ...newTiers[index], [field]: value };
      setStandardTiers(newTiers);
    } else {
      const newTiers = [...aiTiers];
      newTiers[index] = { ...newTiers[index], [field]: value };
      setAiTiers(newTiers);
    }
  };

  const addTier = (type: 'standard' | 'ai') => {
    const tiers = type === 'standard' ? standardTiers : aiTiers;
    const lastTier = tiers[tiers.length - 1];
    const newTier: PricingTier = {
      firstUnit: lastTier ? lastTier.lastUnit + 1 : 1,
      lastUnit: lastTier ? lastTier.lastUnit + 5 : 5,
      perUnit: 0,
      flatFee: 0
    };
    if (type === 'standard') {
      setStandardTiers([...standardTiers, newTier]);
    } else {
      setAiTiers([...aiTiers, newTier]);
    }
  };

  const removeTier = (index: number, type: 'standard' | 'ai') => {
    if (type === 'standard') {
      setStandardTiers(standardTiers.filter((_, i) => i !== index));
    } else {
      setAiTiers(aiTiers.filter((_, i) => i !== index));
    }
  };

  const renderPricingTabs = () => (
    <div className="flex space-x-4 mt-4">
      <button
        onClick={() => setActiveTab('standard')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          activeTab === 'standard'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Standard Connection Plan
      </button>
      <button
        onClick={() => setActiveTab('ai')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          activeTab === 'ai'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        AI Growth Advisor
      </button>
      <button
        onClick={() => setActiveTab('reseller')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          activeTab === 'reseller'
            ? 'bg-[#1239FF] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Reseller Settings
      </button>
    </div>
  );

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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        title="Settings"
      >
        <Settings2 className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
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
              {activeTab === 'standard' && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Additional Connection
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="number"
                        value={newConnectionPrice}
                        onChange={(e) => setNewConnectionPrice(Number(e.target.value))}
                        className="w-32 rounded-md border border-gray-300 px-3 py-2"
                      />
                      <span className="text-gray-500 ml-2">per company</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Volume Pricing Tiers</h3>
                    <p className="text-sm text-gray-600">Define pricing tiers based on the number of companies</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 mb-2">
                      <div className="text-sm font-medium text-gray-500">First Unit</div>
                      <div className="text-sm font-medium text-gray-500">Last Unit</div>
                      <div className="text-sm font-medium text-gray-500">Per Unit ($)</div>
                      <div className="text-sm font-medium text-gray-500">Flat Fee ($)</div>
                    </div>

                    {standardTiers.map((tier, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 items-center relative group">
                        <input
                          type="number"
                          value={tier.firstUnit}
                          onChange={(e) => updateTier(index, 'firstUnit', Number(e.target.value), 'standard')}
                          className="rounded-md border border-gray-300 px-3 py-2"
                          min="0"
                        />
                        <input
                          type="number"
                          value={tier.lastUnit === Infinity ? 999999 : tier.lastUnit}
                          onChange={(e) => updateTier(index, 'lastUnit', Number(e.target.value), 'standard')}
                          className="rounded-md border border-gray-300 px-3 py-2"
                          min="0"
                        />
                        <input
                          type="number"
                          value={tier.perUnit}
                          onChange={(e) => updateTier(index, 'perUnit', Number(e.target.value), 'standard')}
                          className="rounded-md border border-gray-300 px-3 py-2"
                          min="0"
                          step="0.01"
                        />
                        <div className="relative">
                          <input
                            type="number"
                            value={tier.flatFee}
                            onChange={(e) => updateTier(index, 'flatFee', Number(e.target.value), 'standard')}
                            className="rounded-md border border-gray-300 px-3 py-2 w-full"
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={() => removeTier(index, 'standard')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addTier('standard')}
                      className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium mt-4"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add another tier
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">AI Growth Advisor Pricing</h3>
                    <p className="text-sm text-gray-600">Define per-user pricing for AI-only plan</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-2">
                    <div className="text-sm font-medium text-gray-500">First Unit</div>
                    <div className="text-sm font-medium text-gray-500">Last Unit</div>
                    <div className="text-sm font-medium text-gray-500">Per Unit ($)</div>
                    <div className="text-sm font-medium text-gray-500">Flat Fee ($)</div>
                  </div>

                  {aiTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 items-center">
                      <input
                        type="number"
                        value={tier.firstUnit}
                        onChange={(e) => updateTier(index, 'firstUnit', Number(e.target.value), 'ai')}
                        className="rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                      />
                      <input
                        type="number"
                        value={tier.lastUnit === Infinity ? 999999 : tier.lastUnit}
                        onChange={(e) => updateTier(index, 'lastUnit', Number(e.target.value), 'ai')}
                        className="rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                      />
                      <input
                        type="number"
                        value={tier.perUnit}
                        onChange={(e) => updateTier(index, 'perUnit', Number(e.target.value), 'ai')}
                        className="rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={tier.flatFee}
                        onChange={(e) => updateTier(index, 'flatFee', Number(e.target.value), 'ai')}
                        className="rounded-md border border-gray-300 px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reseller' && renderResellerSettings()}
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