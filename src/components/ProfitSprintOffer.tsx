import React, { useState } from 'react';
import { TrainingOfferConfig } from '../types/citations';
import { CitationLink } from './CitationLink';
import { CITATIONS } from '../config/citations';

interface ProfitSprintOfferProps {
  config: TrainingOfferConfig;
  isVisible: boolean;
  onCTAClick: () => void;
}

export function ProfitSprintOffer({ config, isVisible, onCTAClick }: ProfitSprintOfferProps) {
  const [selectedPayment, setSelectedPayment] = useState<'single' | 'two' | 'three'>('single');

  if (!isVisible || !config.enabled) {
    return null;
  }

  const getPaymentAmount = (plan: 'single' | 'two' | 'three') => {
    switch (plan) {
      case 'single':
        return config.basePrice;
      case 'two':
        return Math.round(config.basePrice / 2);
      case 'three':
        return Math.round(config.basePrice / 3);
    }
  };

  return (
    <div className="profit-sprint-panel bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg mb-8">
      {/* Urgency Badge */}
      <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full mb-4">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">Only {config.spotsAvailable} Spots Available This Month</span>
      </div>

      {/* Headlines */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        {config.headlines.primary || 'The $118,121 Problem Hiding in Your P&L'}
      </h1>
      <h2 className="text-xl text-gray-700 mb-6">
        {config.headlines.subhead || 'Transform Your Financial Literacy Into 30-50% Higher Profit Margins'}
      </h2>

      {/* Main Value Proposition */}
      <p className="text-gray-600 mb-6">
        According to <CitationLink citationKey="FINANCIAL_LITERACY_LOSS" showYear={true} />,
        low financial literacy costs small business owners an average of $118,121 in lost profit.
        Our 90-Day Sprint helps you recapture this opportunity.
      </p>

      {/* Research Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Research-Backed Results
        </h3>

        <div className="space-y-3">
          {/* Harvard Business Review */}
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <CitationLink citationKey="HARVARD_MARGINS" showYear={true} className="text-blue-600 underline font-medium" />:
              "Companies that rigorously track and act on their financial statements generate profit margins 30–50% higher than their industry peers."
            </div>
          </div>

          {/* ASTD Research */}
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <CitationLink citationKey="ASTD_SUCCESS" className="text-blue-600 underline font-medium" />:
              95% success rate when businesses have the right metrics, strategy, and weekly accountability.
            </div>
          </div>

          {/* CBS MoneyWatch */}
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <CitationLink citationKey="FRANCHISEE_SUCCESS" className="text-blue-600 underline font-medium" />:
              "Franchisees who understand their P&L tend to do better both in revenue and profit margin."
            </div>
          </div>
        </div>
      </div>

      {/* Client Success Story */}
      <div className="bg-amber-50 p-6 rounded-lg mb-6">
        <svg className="w-6 h-6 text-amber-600 mb-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        <p className="italic text-gray-700 mb-3">
          "My F45 franchise had strong revenue but minimal profit. In our first 45-minute session,
          Bryan showed me exactly where my expenses exceeded industry benchmarks. We created an
          action plan based on real data. Finally, I understand my numbers and make educated decisions."
        </p>
        <p className="text-sm text-gray-600 font-semibold">
          — Heather B., F45 Franchise Owner
        </p>
      </div>

      {/* Program Structure */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Your 90-Day Journey
        </h3>

        {/* Week 1 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
            Week 1: Comprehensive Analysis (1 Hour)
          </h4>
          <ul className="space-y-1 text-sm text-gray-700 ml-8">
            <li>• Connect QuickBooks securely (read-only access)</li>
            <li>• AI analyzes your metrics vs. industry benchmarks</li>
            <li>• Identify specific expense optimization areas</li>
            <li>• Create personalized profit roadmap</li>
            <li>• Apply strategies from 250+ business books</li>
          </ul>
        </div>

        {/* Weeks 2-12 */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">2</span>
            Weeks 2-12: Weekly Implementation (45 Minutes Each)
          </h4>
          <ul className="space-y-1 text-sm text-gray-700 ml-8">
            <li>• Individual coaching sessions (not group calls)</li>
            <li>• Review progress and refine strategies</li>
            <li>• Real-time adjustments based on results</li>
            <li>• Build lasting financial analysis skills</li>
            <li>• Accountability to ensure implementation</li>
          </ul>
        </div>
      </div>

      {/* Supporting Research */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="font-semibold mb-2 text-sm text-gray-700">Additional Supporting Research:</p>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              <CitationLink citationKey="MONTHLY_GROWTH" showYear={true} />:
              "Companies reviewing strategies monthly grow 30% faster"
            </span>
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              <CitationLink citationKey="PROFESSIONAL_HELP" showYear={true} />:
              "Companies using professional accountants are 89% more likely to grow"
            </span>
          </li>
          <li className="flex items-start">
            <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              <CitationLink citationKey="FINANCIAL_MONITORING" showYear={true} />:
              "Financial monitoring results in significant increases in revenue and profits"
            </span>
          </li>
        </ul>
      </div>

      {/* Pricing Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Investment Options</h3>

        <div className="text-3xl font-bold text-gray-900 mb-4">
          ${config.basePrice}
        </div>

        <div className="space-y-2">
          {/* Single Payment */}
          {config.paymentPlans.single && (
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="single"
                checked={selectedPayment === 'single'}
                onChange={() => setSelectedPayment('single')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Pay in Full</div>
                <div className="text-sm text-gray-600">
                  ${getPaymentAmount('single')} - Begin immediately
                </div>
              </div>
            </label>
          )}

          {/* 2 Payments */}
          {config.paymentPlans.twoPayment && (
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="two"
                checked={selectedPayment === 'two'}
                onChange={() => setSelectedPayment('two')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">2 Payments</div>
                <div className="text-sm text-gray-600">
                  ${getPaymentAmount('two')} today, ${getPaymentAmount('two')} in 30 days
                </div>
              </div>
            </label>
          )}

          {/* 3 Payments */}
          {config.paymentPlans.threePayment && (
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="three"
                checked={selectedPayment === 'three'}
                onChange={() => setSelectedPayment('three')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">3 Monthly Payments</div>
                <div className="text-sm text-gray-600">
                  ${getPaymentAmount('three')} per month
                </div>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Guarantee */}
      {config.guaranteeEnabled && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-semibold">Our Commitment:</span>
              <p className="text-sm mt-1">
                {config.guaranteeText || "If you don't identify meaningful profit improvements within 30 days, we'll continue working with you at no additional charge until you do."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={onCTAClick}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
      >
        Schedule Your Profit Analysis
        <span className="text-sm block mt-1">45-minute consultation (No obligation)</span>
      </button>

      {/* Legal Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Legal Compliance:</strong> All statistics are linked to their original sources. Click any blue link to verify claims.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Disclaimer:</strong> Results vary based on implementation and business factors. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}