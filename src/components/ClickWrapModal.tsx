import { X, CheckCircle, Shield, ExternalLink, Copy } from 'lucide-react';

interface ClickWrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  quoteSummary: {
    price: string;
    plan: string;
    count: number;
    isAnnual: boolean;
  };
  formUrl: string;
}

export default function ClickWrapModal({
  isOpen,
  onClose,
  onAccept,
  quoteSummary,
  formUrl,
}: ClickWrapModalProps) {
  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      alert('Form link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            🎉 Great! Your Quote is Ready
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Quote Summary */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Your Quote Summary</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Plan:</span> {quoteSummary.plan}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">
                  {quoteSummary.plan === 'AI Growth Advisor' ? 'Users' : 'Locations'}:
                </span>{' '}
                {quoteSummary.count}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Billing:</span>{' '}
                {quoteSummary.isAnnual ? 'Annual' : 'Monthly'}
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {quoteSummary.price}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg">Ready to get started?</h3>
            <p className="text-gray-700">
              Complete your quote acceptance in the main onboarding form where you can review everything and get started:
            </p>
          </div>

          {/* Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">Next Steps:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#1239FF] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <p className="text-sm text-gray-700 pt-0.5">
                  Click the button below to go to your onboarding form
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#1239FF] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <p className="text-sm text-gray-700 pt-0.5">
                  Navigate to the <span className="font-semibold">Pricing step</span> in the form
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#1239FF] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <p className="text-sm text-gray-700 pt-0.5">
                  Review and accept your quote to complete the onboarding
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-700 pt-0.5">
                  <span className="font-semibold text-green-700">Complete your onboarding!</span>
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full bg-orange-500 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 smooth-transition transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Go to Form to Complete
              <ExternalLink className="w-5 h-5" />
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-50 smooth-transition flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Form Link
            </button>
          </div>

          {/* Social Proof */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                SOC 2 Type 1 certified
              </span>
              <span className="flex items-center gap-1">
                🔒
                SSL secure checkout
              </span>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-600">
                <span className="text-[#1239FF] font-semibold">Trusted by 3,500+ businesses</span>
                {' • '}
                <a
                  href="https://www.autymate.com/reviews"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-[#1239FF] transition-colors"
                >
                  ⭐ 1,000+ 5-star reviews
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
