import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Tooltip from './Tooltip';

type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale' | 'enterprise';

interface FeatureComparisonProps {
  selectedPlan: PlanType;
}

const FeatureComparison: React.FC<FeatureComparisonProps> = ({ selectedPlan }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const plans = [
    {
      id: 'ai-advisor' as const,
      name: 'AI Growth Advisor',
      popular: false
    },
    {
      id: 'starter' as const,
      name: 'Starter',
      popular: false
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      popular: true
    },
    {
      id: 'scale' as const,
      name: 'Scale',
      popular: false
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      popular: false
    }
  ];

  const features = [
    {
      category: 'Pricing & Billing',
      items: [
        {
          name: 'Starting Price',
          tooltip: 'Base monthly cost per location, scales with usage',
          values: {
            'ai-advisor': '$19/user',
            'starter': 'From $90',
            'growth': 'From $120',
            'scale': 'From $150',
            'enterprise': 'Custom'
          }
        },
        {
          name: 'Connections Included',
          tooltip: 'Integrations to accounting software, CRM, or other business tools',
          values: {
            'ai-advisor': '0',
            'starter': '1',
            'growth': '3',
            'scale': '5',
            'enterprise': 'Unlimited'
          }
        },
        {
          name: 'Annual Discount',
          tooltip: 'Save 20% by paying annually instead of monthly',
          values: {
            'ai-advisor': '20%',
            'starter': '20%',
            'growth': '20%',
            'scale': '20%',
            'enterprise': 'Custom'
          }
        }
      ]
    },
    {
      category: 'Core Features',
      items: [
        {
          name: 'Users per Location',
          tooltip: 'Number of team members who can access each location\'s data',
          values: {
            'ai-advisor': '1',
            'starter': '3',
            'growth': '5',
            'scale': '8',
            'enterprise': 'Unlimited'
          }
        },
        {
          name: 'Scorecards',
          tooltip: 'Custom business dashboards to track KPIs and metrics',
          values: {
            'ai-advisor': 'Unlimited',
            'starter': '12 per location',
            'growth': '25 per location',
            'scale': '25 per location',
            'enterprise': 'Unlimited'
          }
        },
        {
          name: 'Metrics per Scorecard',
          tooltip: 'Individual data points you can track on each dashboard',
          values: {
            'ai-advisor': 'Unlimited',
            'starter': '10',
            'growth': '15',
            'scale': '15',
            'enterprise': 'Unlimited'
          }
        },
        {
          name: 'AI Tokens',
          tooltip: 'You receive $0.25 in AI tokens for every $1 spent on your plan. Choose any AI model you want - more expensive models just use tokens faster. Use for insights, recommendations, and automations.',
          values: {
            'ai-advisor': '25% of plan cost',
            'starter': '25% of plan cost',
            'growth': '25% of plan cost',
            'scale': '25% of plan cost',
            'enterprise': 'Custom allocation'
          }
        },
        {
          name: 'Historic Data',
          tooltip: 'Access to past business data for trend analysis',
          values: {
            'ai-advisor': 'None',
            'starter': '2 years',
            'growth': '3 years',
            'scale': '4 years',
            'enterprise': 'Unlimited'
          }
        }
      ]
    },
    {
      category: 'Business Intelligence & Resources',
      items: [
        {
          name: '1,500+ Business Book Summaries',
          tooltip: 'Actionable insights from 1,500+ best business books',
          values: {
            'ai-advisor': true,
            'starter': true,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: '7,000+ Proven One-Click Strategies',
          tooltip: '7,000+ battle-tested strategies from successful businesses',
          values: {
            'ai-advisor': true,
            'starter': true,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        }
      ]
    },
    {
      category: 'Advanced Features',
      items: [
        {
          name: 'Daily Sync',
          tooltip: 'Automatically sync all connected data sources daily at 3am EST',
          values: {
            'ai-advisor': false,
            'starter': true,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: 'Immediate Sync Command',
          tooltip: 'Manually trigger data sync whenever you need fresh data',
          values: {
            'ai-advisor': false,
            'starter': false,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: 'Custom Integrations',
          tooltip: 'Build custom connections to proprietary software or unique data sources',
          values: {
            'ai-advisor': false,
            'starter': false,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: 'Billing Flexibility',
          tooltip: 'Custom payment terms and invoicing options for your business',
          values: {
            'ai-advisor': false,
            'starter': false,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: 'Custom Branding',
          tooltip: 'White-label the platform with your company\'s logo and colors',
          values: {
            'ai-advisor': false,
            'starter': false,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        },
        {
          name: 'Royalty Processing (Optional)',
          tooltip: 'Optional automated ACH royalty collection. Included with plan - you only pay ACH transaction fees (~$1.82/transaction)',
          values: {
            'ai-advisor': false,
            'starter': true,
            'growth': true,
            'scale': true,
            'enterprise': true
          }
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto mb-8 mt-12">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white border border-[#1239FF]/20 rounded-lg px-6 py-4 flex items-center justify-between hover:border-[#1239FF]/40 smooth-transition shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <i className="fa-sharp fa-regular fa-table-list text-[#1239FF] text-lg"></i>
          <span className="font-semibold text-[#180D43] text-base md:text-lg">
            Compare All Features
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[#1239FF] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Comparison Table */}
      {isExpanded && (
        <div className="mt-4 bg-white border border-[#1239FF]/10 rounded-lg shadow-sm overflow-visible animate-in slide-in-from-top duration-300">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-[#180D43] text-sm sticky left-0 bg-gray-50 z-10">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`py-4 px-4 text-center text-sm font-semibold relative ${
                        selectedPlan === plan.id
                          ? 'bg-[#1239FF] text-white'
                          : 'text-[#180D43]'
                      }`}
                    >
                      <div>{plan.name}</div>
                      {plan.popular && (
                        <div className="mt-1">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    {/* Category Header */}
                    <tr className="bg-gray-100">
                      <td
                        colSpan={plans.length + 1}
                        className="py-3 px-6 font-bold text-[#180D43] text-sm"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {/* Category Items */}
                    {category.items.map((item, itemIndex) => (
                      <tr
                        key={itemIndex}
                        className="border-b border-gray-100 hover:bg-gray-50 smooth-transition relative"
                      >
                        <td className="py-3 px-6 text-sm text-[#180D43] sticky left-0 bg-white hover:bg-gray-50 smooth-transition overflow-visible">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.tooltip && (
                              <Tooltip content={item.tooltip} position="top" />
                            )}
                          </div>
                        </td>
                        {plans.map((plan) => (
                          <td
                            key={plan.id}
                            className={`py-3 px-4 text-center text-sm ${
                              selectedPlan === plan.id
                                ? 'bg-[#1239FF]/5 font-medium'
                                : ''
                            }`}
                          >
                            {typeof item.values[plan.id] === 'boolean' ? (
                              item.values[plan.id] ? (
                                <i className="fa-sharp fa-solid fa-circle-check text-green-600 text-lg"></i>
                              ) : (
                                <i className="fa-sharp fa-solid fa-circle-xmark text-gray-400 text-lg"></i>
                              )
                            ) : (
                              <span className="text-[#180D43]">{item.values[plan.id]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Accordion View */}
          <div className="md:hidden divide-y divide-gray-200">
            {features.map((category, categoryIndex) => (
              <div key={categoryIndex} className="p-4">
                <h3 className="font-bold text-[#180D43] text-base mb-3">
                  {category.category}
                </h3>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-4 last:mb-0">
                    <div className="font-medium text-sm text-[#180D43] mb-2 flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.tooltip && (
                        <Tooltip content={item.tooltip} position="bottom" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`text-xs p-2 rounded ${
                            selectedPlan === plan.id
                              ? 'bg-[#1239FF]/10 border border-[#1239FF]/30'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-[#180D43] mb-1">
                            {plan.name}
                          </div>
                          <div className="text-[#180D43]/70">
                            {typeof item.values[plan.id] === 'boolean' ? (
                              item.values[plan.id] ? (
                                <i className="fa-sharp fa-solid fa-circle-check text-green-600"></i>
                              ) : (
                                <i className="fa-sharp fa-solid fa-circle-xmark text-gray-400"></i>
                              )
                            ) : (
                              item.values[plan.id]
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureComparison;
