import React from 'react';
import { ArrowRight } from 'lucide-react';

const CallToAction: React.FC = () => {
  return (
    <div className="bg-indigo-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-indigo-200 text-lg max-w-2xl mx-auto mb-8">
          Join thousands of businesses that trust us with their analytics. 
          No credit card required to start your 14-day free trial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-indigo-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
            Start your free trial <ArrowRight className="ml-2 w-4 h-4" />
          </button>
          <button className="bg-transparent border border-indigo-300 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-800 transition-colors">
            Schedule a demo
          </button>
        </div>
        <p className="text-indigo-300 mt-8 text-sm">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default CallToAction;