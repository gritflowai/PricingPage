import React from 'react';

interface AlternativeApp {
  name: string;
  description: string;
  priceText: string;
}

const alternatives: AlternativeApp[] = [
  {
    name: "GoHighLevel",
    description: "All-in-one marketing platform with complex pricing structure",
    priceText: "Starts at $97/mo, plus add-ons"
  },
  {
    name: "HubSpot",
    description: "CRM with marketing tools but expensive as you scale",
    priceText: "$45/mo per user, plus add-ons"
  },
  {
    name: "ActiveCampaign",
    description: "Email marketing with complicated pricing tiers",
    priceText: "$70/mo for standard features"
  },
  {
    name: "Keap (Infusionsoft)",
    description: "Marketing automation with steep learning curve",
    priceText: "Starts at $199/mo for limited features"
  }
];

const AlternativeApps: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Simple pricing that replaces complex alternatives
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alternatives.map((app, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6 transition-transform hover:scale-105 duration-300">
            <h3 className="font-bold text-xl mb-2 text-gray-900">{app.name}</h3>
            <p className="text-gray-600 mb-4 text-sm">{app.description}</p>
            <div className="bg-red-50 text-red-700 rounded-lg p-3 font-medium text-sm">
              {app.priceText}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Stop overpaying for features you don't need. Our simple pricing gives you all the tools you need without the complexity.
        </p>
      </div>
    </div>
  );
};

export default AlternativeApps;