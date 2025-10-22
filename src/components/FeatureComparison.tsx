import React from 'react';
import { Check, X } from 'lucide-react';

interface Feature {
  name: string;
  starter: boolean;
  pro: boolean;
  business: boolean;
  enterprise: boolean;
}

const features: Feature[] = [
  { name: 'Unlimited projects', starter: true, pro: true, business: true, enterprise: true },
  { name: 'Real-time analytics', starter: true, pro: true, business: true, enterprise: true },
  { name: 'Custom domains', starter: false, pro: true, business: true, enterprise: true },
  { name: 'White labeling', starter: false, pro: false, business: true, enterprise: true },
  { name: 'API access', starter: false, pro: true, business: true, enterprise: true },
  { name: 'Email reports', starter: true, pro: true, business: true, enterprise: true },
  { name: 'Team collaboration', starter: false, pro: true, business: true, enterprise: true },
  { name: 'Advanced security', starter: false, pro: false, business: true, enterprise: true },
  { name: 'Priority support', starter: false, pro: false, business: true, enterprise: true },
  { name: 'Dedicated account manager', starter: false, pro: false, business: false, enterprise: true },
];

const FeatureComparison: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Compare Plans</h2>
      <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        Choose the plan that's right for your business. All plans include a 14-day free trial.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-gray-600 font-medium">Features</th>
              <th className="px-6 py-4 text-center text-gray-600 font-medium">Starter</th>
              <th className="px-6 py-4 text-center text-gray-600 font-medium">Pro</th>
              <th className="px-6 py-4 text-center text-gray-600 font-medium">Business</th>
              <th className="px-6 py-4 text-center text-gray-600 font-medium">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.map((feature, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 text-sm text-gray-800">{feature.name}</td>
                <td className="px-6 py-4 text-center">
                  {feature.starter ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {feature.pro ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {feature.business ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {feature.enterprise ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureComparison;