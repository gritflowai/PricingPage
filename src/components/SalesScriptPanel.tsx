import React, { useState } from 'react';
import { TrainingOfferConfig } from '../types/citations';
import { CitationLink } from './CitationLink';

interface SalesScriptPanelProps {
  isVisible: boolean;
  config: TrainingOfferConfig & {
    showCitations: boolean;
    guaranteeEnabled: boolean;
    guaranteeText: string;
    sectionsCompleted: string[];
    objectionHandled: string[];
  };
}

export function SalesScriptPanel({ isVisible, config }: SalesScriptPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string>('opening');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());

  if (!isVisible || !config.enabled) {
    return null;
  }

  const toggleCheck = (item: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(item)) {
      newCheckedItems.delete(item);
    } else {
      newCheckedItems.add(item);
    }
    setCheckedItems(newCheckedItems);
  };

  const markStageComplete = (stage: number) => {
    const newCompleted = new Set(completedStages);
    if (newCompleted.has(stage)) {
      newCompleted.delete(stage);
    } else {
      newCompleted.add(stage);
    }
    setCompletedStages(newCompleted);
  };

  // Minimized state - show small floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-xl hover:bg-blue-700 transition-colors z-50 flex items-center"
        title="Restore Sales Guide"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Sales Guide
      </button>
    );
  }

  return (
    <div className="sales-script-panel fixed bottom-20 right-4 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center flex-1">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1">90 Day Profit Playbook Accelerator Program Sales Guide</span>
            <a
              href="profit-accelerator-landing.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md font-semibold text-xs hover:scale-105 transition-all mr-2"
            >
              Learn More
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </h2>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Tracker */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-blue-900">Sales Progress</h3>
          <div className="flex justify-between text-xs">
            <span className={`${completedStages.has(1) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>1. Hook</span>
            <span className={`${completedStages.has(2) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>2. Discover</span>
            <span className={`${completedStages.has(3) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>3. Demo</span>
            <span className={`${completedStages.has(4) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>4. Present</span>
            <span className={`${completedStages.has(5) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>5. Close</span>
          </div>
        </div>

        {/* Quick Reference Stats */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
          <h3 className="font-semibold text-sm mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            Power Statistics (Click for Source)
          </h3>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <span>
                <CitationLink citationKey="intuit" className="text-blue-600 underline font-semibold hover:text-blue-800" />:
                <strong> $118,121</strong> average annual loss from poor financial literacy
              </span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>
                <CitationLink citationKey="harvard" className="text-blue-600 underline font-semibold hover:text-blue-800" />:
                <strong> 30-50%</strong> higher profit margins when tracking financials
              </span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>
                <CitationLink citationKey="astd" className="text-blue-600 underline font-semibold hover:text-blue-800" />:
                <strong> 95%</strong> success rate with metrics + strategy + accountability
              </span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span>
                <CitationLink citationKey="cjpi" className="text-blue-600 underline font-semibold hover:text-blue-800" />:
                <strong> 30%</strong> faster growth when reviewing financials monthly
              </span>
            </li>
          </ul>
        </div>

        {/* Section 1: Opening Hook */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => {
              setExpandedSection(expandedSection === 'opening' ? '' : 'opening');
              markStageComplete(1);
            }}
            className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 ${completedStages.has(1) ? 'bg-green-50' : ''}`}
          >
            <div className="flex items-center">
              <span className={`${completedStages.has(1) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold`}>
                {completedStages.has(1) ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : '1'}
              </span>
              <span className="font-medium text-sm">Opening Hook - The $118K Problem</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'opening' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'opening' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
              <div className="text-sm space-y-3">
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="font-semibold text-red-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                    The Hook:
                  </p>
                  <p className="text-gray-800">
                    "Did you know QuickBooks research shows <strong>poor financial literacy costs business owners $118,121 per year</strong>?
                    Let me show you how to get that money back..."
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <p className="font-semibold text-blue-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                    Build Authority:
                  </p>
                  <p className="text-gray-800">
                    "Harvard Business Review found companies that rigorously track their financials have
                    <strong> 30-50% higher profit margins</strong>. But most owners were never taught HOW to do this properly."
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p className="font-semibold text-green-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                    </svg>
                    Transition Question:
                  </p>
                  <p className="italic text-gray-800">
                    "Tell me - how confident are you that you're capturing all the profit opportunities in your business?"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Discovery Questions */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => {
              setExpandedSection(expandedSection === 'discovery' ? '' : 'discovery');
              markStageComplete(2);
            }}
            className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 ${completedStages.has(2) ? 'bg-green-50' : ''}`}
          >
            <div className="flex items-center">
              <span className={`${completedStages.has(2) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold`}>
                {completedStages.has(2) ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : '2'}
              </span>
              <span className="font-medium text-sm">Discovery - Find Their Pain</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'discovery' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'discovery' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
              <p className="text-xs font-semibold mb-3 text-gray-700">Ask these questions to uncover their needs:</p>
              <div className="space-y-2">
                <label className="flex items-start text-sm cursor-pointer hover:bg-blue-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={checkedItems.has('pl-review')}
                    onChange={() => toggleCheck('pl-review')}
                  />
                  <span>
                    <strong>"How often do you review your P&L?"</strong>
                    <span className="text-xs text-gray-600 block">Listen for: Monthly, quarterly, yearly, or "rarely"</span>
                  </span>
                </label>

                <label className="flex items-start text-sm cursor-pointer hover:bg-blue-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={checkedItems.has('profit-margin')}
                    onChange={() => toggleCheck('profit-margin')}
                  />
                  <span>
                    <strong>"What's your current profit margin?"</strong>
                    <span className="text-xs text-gray-600 block">If they don't know = perfect opportunity!</span>
                  </span>
                </label>

                <label className="flex items-start text-sm cursor-pointer hover:bg-blue-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={checkedItems.has('biggest-expense')}
                    onChange={() => toggleCheck('biggest-expense')}
                  />
                  <span>
                    <strong>"What's your biggest expense category?"</strong>
                    <span className="text-xs text-gray-600 block">Shows if they understand their cost structure</span>
                  </span>
                </label>

                <label className="flex items-start text-sm cursor-pointer hover:bg-blue-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={checkedItems.has('goals')}
                    onChange={() => toggleCheck('goals')}
                  />
                  <span>
                    <strong>"What are your profit goals for this year?"</strong>
                    <span className="text-xs text-gray-600 block">Connect their goals to our solution</span>
                  </span>
                </label>

                <label className="flex items-start text-sm cursor-pointer hover:bg-blue-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={checkedItems.has('frustration')}
                    onChange={() => toggleCheck('frustration')}
                  />
                  <span>
                    <strong>"What frustrates you most about your financials?"</strong>
                    <span className="text-xs text-gray-600 block">Pain points = motivation to change</span>
                  </span>
                </label>
              </div>

              <div className="mt-3 bg-yellow-50 p-2 rounded text-xs border border-yellow-200">
                <strong className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-yellow-700 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/>
                  </svg>
                  Pro Tip:
                </strong> If they can't answer these clearly, say:
                <span className="italic block mt-1">
                  "That's exactly why this program exists - to give you clarity and control over your numbers."
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Quick Demo */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => {
              setExpandedSection(expandedSection === 'demo' ? '' : 'demo');
              markStageComplete(3);
            }}
            className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 ${completedStages.has(3) ? 'bg-green-50' : ''}`}
          >
            <div className="flex items-center">
              <span className={`${completedStages.has(3) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold`}>
                {completedStages.has(3) ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : '3'}
              </span>
              <span className="font-medium text-sm">Demo Value - Show Real Numbers</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'demo' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'demo' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
              <div className="text-sm space-y-3">
                <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                  <p className="font-semibold text-purple-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"/>
                    </svg>
                    Quick Calculation:
                  </p>
                  <p className="text-gray-800">
                    "Let me show you something quick. What's your monthly revenue?"
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    [Calculate: If revenue is $50K/month and margin is 10%, improving to 15% = $3,000/month or $36K/year]
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded">
                  <p className="font-semibold text-sm mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                    Show the Opportunity:
                  </p>
                  <div className="text-xs space-y-1">
                    <p>• "Industry average for your business type is 15-20% profit margin"</p>
                    <p>• "You're at 10%, so there's a 5-10% opportunity"</p>
                    <p>• "On $50K revenue, that's $2,500-5,000 monthly"</p>
                    <p className="font-bold text-green-700">• "That's $30,000-60,000 per year in additional profit"</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-semibold text-sm mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                    </svg>
                    The Bridge:
                  </p>
                  <p className="italic text-gray-800 text-xs">
                    "The 90 Day Profit Playbook Accelerator Program is designed to help you capture that opportunity.
                    Want to hear how it works?"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Present Solution */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => {
              setExpandedSection(expandedSection === 'program' ? '' : 'program');
              markStageComplete(4);
            }}
            className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 ${completedStages.has(4) ? 'bg-green-50' : ''}`}
          >
            <div className="flex items-center">
              <span className={`${completedStages.has(4) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold`}>
                {completedStages.has(4) ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : '4'}
              </span>
              <span className="font-medium text-sm">Present - The 90 Day Profit Playbook Solution</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'program' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'program' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
              <div className="text-sm space-y-3">
                <p className="font-bold text-gray-900">Here's exactly what you get:</p>

                <div className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/>
                      </svg>
                      Week 1: Deep-Dive Analysis
                    </p>
                    <p className="text-xs mt-1">
                      We analyze your P&L against industry benchmarks and 250+ business books to find your profit opportunities
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900 flex items-center">
                      <span className="text-xl mr-2">📅</span> Weeks 2-12: Weekly 1-on-1 Sessions
                    </p>
                    <p className="text-xs mt-1">
                      45-minute personal coaching sessions every week to implement improvements ($6,000 value)
                    </p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Done-For-You Setup
                    </p>
                    <p className="text-xs mt-1">
                      We set up your profit goals, expense targets, and improvement roadmap - completely done for you
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="font-semibold text-orange-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                      </svg>
                      Lifetime Financial Skills
                    </p>
                    <p className="text-xs mt-1">
                      Learn to leverage AI to understand your P&L - skills you'll use forever
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 p-2 rounded">
                  <p className="text-xs">
                    <strong>Remember:</strong> ASTD research shows <strong>95% success rate</strong> when you have the right metrics + strategy + accountability.
                    We provide all three.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Close the Deal */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => {
              setExpandedSection(expandedSection === 'close' ? '' : 'close');
              markStageComplete(5);
            }}
            className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 ${completedStages.has(5) ? 'bg-green-50' : ''}`}
          >
            <div className="flex items-center">
              <span className={`${completedStages.has(5) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold`}>
                {completedStages.has(5) ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : '5'}
              </span>
              <span className="font-medium text-sm">Close - Make It Irresistible</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'close' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'close' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
              <div className="text-sm space-y-3">
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="font-bold text-red-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                    The ROI Close:
                  </p>
                  <p className="text-gray-800">
                    "Remember, QuickBooks shows you're likely losing $118,000 per year.
                    Even capturing just 3% of that pays for this program."
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="font-bold text-blue-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                    Investment Options:
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="flex items-start">
                      <svg className="w-3 h-3 mt-0.5 mr-1 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span><strong>Pay in full:</strong> ${config.basePrice.toLocaleString()}</span>
                    </p>
                    <p className="flex items-start">
                      <svg className="w-3 h-3 mt-0.5 mr-1 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span><strong>2 payments:</strong> ${Math.round(config.basePrice / 2).toLocaleString()} × 2</span>
                    </p>
                    <p className="flex items-start">
                      <svg className="w-3 h-3 mt-0.5 mr-1 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span><strong>3 monthly:</strong> ${Math.round(config.basePrice / 3).toLocaleString()} × 3</span>
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <p className="font-bold text-green-900 mb-1">🛡️ Risk Reversal:</p>
                  <p className="text-xs">
                    "Plus you're protected by our 14-day money-back guarantee.
                    If you don't see clear value in the first two weeks, get a full refund."
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                  <p className="font-bold text-orange-900 mb-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                    </svg>
                    Create Urgency:
                  </p>
                  <p className="text-xs">
                    "We only work with {config.spotsAvailable || 3} businesses at a time to ensure quality.
                    I have {config.spotsAvailable || 3} spots available this month."
                  </p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-300 p-3 rounded-lg">
                  <p className="font-bold text-purple-900 mb-1">🎤 The Ask:</p>
                  <p className="font-semibold text-gray-800">
                    "Based on what we've discussed, this could add $30,000+ to your bottom line this year.
                    Shall I reserve one of those spots for you?"
                  </p>
                </div>

                <div className="text-center">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    If YES → "Fantastic! Let's get your first session scheduled..."
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Objection Handlers */}
        <div className="border rounded-lg bg-white shadow-sm">
          <button
            onClick={() => setExpandedSection(expandedSection === 'objections' ? '' : 'objections')}
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">Common Objections & Responses</span>
            </div>
            <svg className={`w-4 h-4 transform transition-transform ${expandedSection === 'objections' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'objections' && (
            <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-red-600 text-xs mb-1">"It's too expensive"</p>
                <p className="text-xs text-gray-800">
                  "I understand. Let me ask - if this program helps you find just $1,300/month in additional profit,
                  it pays for itself. Based on what we've discussed, do you think we could find that?"
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-red-600 text-xs mb-1">"I don't have time"</p>
                <p className="text-xs text-gray-800">
                  "That's exactly why we do the heavy lifting. It's just 45 minutes per week,
                  and that time investment could return $30,000+ this year.
                  Can you invest 45 minutes weekly to increase profits by 30%?"
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-red-600 text-xs mb-1">"I need to think about it"</p>
                <p className="text-xs text-gray-800">
                  "Of course. What specifically would you like to think through?
                  Meanwhile, remember you're protected by our 14-day guarantee.
                  You could start seeing results while you're still deciding if it's right for you."
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-red-600 text-xs mb-1">"How do I know it will work?"</p>
                <p className="text-xs text-gray-800">
                  "Great question. We have a 95% success rate based on proven research.
                  Plus, you're protected by our guarantee.
                  The real question is: can you afford to keep losing $118,000 per year by NOT doing this?"
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-red-600 text-xs mb-1">"I already have an accountant"</p>
                <p className="text-xs text-gray-800">
                  "Perfect! Accountants are great for compliance and taxes.
                  This is about profit optimization and business strategy.
                  We actually make your accountant's job easier by organizing your financial goals."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm mb-2 text-blue-900 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            Remember:
          </h3>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• Listen more than you talk</li>
            <li>• Focus on their goals, not features</li>
            <li>• Use research to build credibility</li>
            <li>• Create urgency with limited spots</li>
            <li>• Always circle back to ROI</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SalesScriptPanel;