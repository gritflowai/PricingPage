import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Tooltip from './Tooltip';
import { CitationLink } from './CitationLink';

type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale' | 'enterprise';
type UserType = 'cpa' | 'franchisee' | 'smb';

interface FeatureComparisonProps {
  selectedPlan: PlanType;
  userType?: UserType;
  trainingOfferEnabled?: boolean;
  trainingOfferConfig?: {
    basePrice: number;
    paymentPlans: {
      single: boolean;
      twoPayment: boolean;
      threePayment: boolean;
    };
  };
}

const FeatureComparison: React.FC<FeatureComparisonProps> = ({ selectedPlan, userType = 'franchisee', trainingOfferEnabled = false, trainingOfferConfig }) => {
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

  const allFeatures = [
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

  // Filter features based on user type
  const features = allFeatures.map(category => {
    if (userType !== 'franchisee') {
      // Remove Royalty Processing feature for non-franchisee users
      return {
        ...category,
        items: category.items.filter(item =>
          item.name !== 'Royalty Processing (Optional)'
        )
      };
    }
    return category;
  });

  // Add Training & Implementation Add-On section if enabled
  if (trainingOfferEnabled && trainingOfferConfig) {
    features.push({
      category: '90 Day Profit Playbook Accelerator Program',
      isFullWidthSection: true, // Special flag for full-width rendering
      items: [] // Empty items since we'll render full-width content instead
    });
  }

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
                    {/* Full Width Section for Training */}
                    {category.isFullWidthSection ? (
                      <tr>
                        <td colSpan={plans.length + 1} className="p-0">
                          <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
                            <div className="max-w-5xl mx-auto">
                              {/* Header Section */}
                              <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-[#180D43] mb-3">
                                  Transform Your P&L Into <span className="text-green-600">30-50% Higher Profit Margins</span>
                                </h3>
                                <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-semibold">Proven 90-Day System with <a href="https://www.td.org/research-reports/the-value-of-evaluation" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline hover:text-blue-900">95% Success Rate</a></span>
                                </div>
                              </div>

                              {/* Main Content Grid */}
                              <div className="grid md:grid-cols-2 gap-8 mb-8">
                                {/* Left Column - What You Get */}
                                <div>
                                  <h4 className="text-lg font-bold text-[#180D43] mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                    What's Included
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                                      <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                      <div>
                                        <strong className="text-[#180D43]">Done-For-You P&L Setup</strong>
                                        <p className="text-sm text-gray-600 mt-1">We analyze your financials and build your profit optimization roadmap</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                                      <span className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                      <div>
                                        <strong className="text-[#180D43]">12 Weekly 1-on-1 Sessions</strong>
                                        <p className="text-sm text-gray-600 mt-1">Personal coaching valued at $500 per session ($6,000 total value)</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                                      <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                      <div>
                                        <strong className="text-[#180D43]">2,500 Profit Strategies from 250 Business Books</strong>
                                        <p className="text-sm text-gray-600 mt-1">Curated from our <a href="https://www.autymate.com/books-library?book_category_equal=Financial" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">250 financial books</a> out of <a href="https://www.autymate.com/book-summaries" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">1,500+ total business books</a></p>
                                      </div>
                                    </div>
                                    <div className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                                      <span className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                      <div>
                                        <strong className="text-[#180D43]">Lifetime Financial Mastery</strong>
                                        <p className="text-sm text-gray-600 mt-1">Skills to analyze and optimize profits for the rest of your career</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column - Proven Results */}
                                <div>
                                  <h4 className="text-lg font-bold text-[#180D43] mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v9a2 2 0 11-4 0V5z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                    Research-Backed Results
                                  </h4>

                                  <div className="space-y-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                                      <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-2xl font-bold text-green-600">30-50%</span>
                                      </div>
                                      <p className="text-sm text-gray-700">Higher profit margins for businesses that track financials</p>
                                      <p className="text-xs text-gray-500 mt-1">Source: <CitationLink citationKey="harvard" className="text-blue-600 underline hover:text-blue-800" /></p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                                      <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-2xl font-bold text-blue-600">95%</span>
                                      </div>
                                      <p className="text-sm text-gray-700">Success rate when combining metrics, strategy & accountability</p>
                                      <p className="text-xs text-gray-500 mt-1">Source: <CitationLink citationKey="astd" className="text-blue-600 underline hover:text-blue-800" /></p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                                      <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-2xl font-bold text-orange-600">$15,000+</span>
                                      </div>
                                      <p className="text-sm text-gray-700">Average profit found in first 30 days</p>
                                      <p className="text-xs text-gray-500 mt-1">Based on client results</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Investment Section */}
                              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                <div className="flex flex-col md:flex-row items-center justify-between">
                                  <div className="mb-4 md:mb-0">
                                    <div className="flex items-center mb-2">
                                      <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-lg font-bold text-[#180D43]">Limited Time Investment</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <span className="text-3xl font-bold text-blue-600">
                                        + ${trainingOfferConfig.basePrice.toLocaleString()}
                                      </span>
                                      <span className="text-sm text-gray-600 bg-yellow-100 px-2 py-1 rounded-full">
                                        One-Time Fee
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center md:text-right">
                                    <div className="flex flex-col space-y-2">
                                      <div className="flex items-center text-green-700">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold">14-Day Money-Back Guarantee</span>
                                      </div>
                                      <div className="flex items-center text-orange-600">
                                        <svg className="w-5 h-5 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold">Only 3 Spots Available This Month</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      /* Regular Category Items */
                      category.items.map((item, itemIndex) => (
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
                            } ${item.isHtmlContent ? 'p-0' : ''}`}
                          >
                            {item.isHtmlContent && item.htmlContent ? (
                              // Render HTML content for training benefits
                              item.htmlContent[item.values[plan.id]]
                            ) : typeof item.values[plan.id] === 'boolean' ? (
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
                    ))
                    )}
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
                {category.isFullWidthSection ? (
                  // Full width content for training section on mobile
                  <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 rounded-lg -mx-4">
                    {/* Same content as desktop but with mobile-optimized layout */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-[#180D43] mb-2">
                        Transform Your P&L Into <span className="text-green-600">30-50% Higher Profit Margins</span>
                      </h3>
                      <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">95% Success Rate</span>
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="mb-6">
                      <h4 className="font-bold text-[#180D43] mb-3 flex items-center">
                        <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        What's Included
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <div>
                            <strong>Done-For-You Setup</strong>
                            <p className="text-xs text-gray-600">P&L analysis and profit roadmap</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <div>
                            <strong>12 Weekly Sessions</strong>
                            <p className="text-xs text-gray-600">1-on-1 coaching ($6,000 value)</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <div>
                            <strong>2,500 Profit Strategies</strong>
                            <p className="text-xs text-gray-600">From 250 business books</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-sm text-[#180D43] mb-2">Proven Results:</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">30-50%</div>
                          <div className="text-xs text-gray-600">Higher Margins</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">95%</div>
                          <div className="text-xs text-gray-600">Success Rate</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">$15K+</div>
                          <div className="text-xs text-gray-600">Found in 30 days</div>
                        </div>
                      </div>
                    </div>

                    {/* Investment */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">Investment:</span>
                        <span className="text-xl font-bold text-blue-600">
                          + ${trainingOfferConfig.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-green-700 flex items-center">
                          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          14-Day Money-Back Guarantee
                        </p>
                        <p className="text-orange-600 flex items-center">
                          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                          </svg>
                          Only 3 spots available
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-4 last:mb-0">
                    {item.isHtmlContent && item.htmlContent ? (
                      // For HTML content (training section), show a single rich content block
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {selectedPlan === 'enterprise' ?
                          item.htmlContent.trainingBenefitsEnterprise :
                          item.htmlContent.trainingBenefits
                        }
                      </div>
                    ) : (
                      // Regular grid layout for non-HTML content
                      <>
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
                      </>
                    )}
                  </div>
                ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureComparison;
