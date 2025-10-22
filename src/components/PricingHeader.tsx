import React from 'react';
import { BarChart3 } from 'lucide-react';

const PricingHeader: React.FC = () => {
  return (
    <div className="text-center py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <BarChart3 className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          No complicated contracts. No hidden fees. Just pay for what you need
          and scale as your business grows.
        </p>
        <div className="inline-flex items-center justify-center">
          <span
            className="px-4 py-2 bg-indigo-100 text-indigo-800 font-medium rounded-full text-sm"
          >
            Save up to 20% with annual billing
          </span>
        </div>
      </div>
    </div>
  );
};

export default PricingHeader;