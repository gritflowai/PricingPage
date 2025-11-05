import { CreditCard, RefreshCw, Shield } from 'lucide-react';

interface SocialProofBadgesProps {
  mode?: 'calculator' | 'quote';
}

export default function SocialProofBadges({ mode = 'calculator' }: SocialProofBadgesProps) {
  const isQuoteMode = mode === 'quote';

  return (
    <>
      {/* Customer Count Social Proof */}
      <div className="mb-3 text-center">
        <p className="text-sm text-gray-600">
          <span className="text-[#1239FF] font-semibold">
            {isQuoteMode ? 'Trusted by 3,500+ businesses' : 'Join 3,500+ customers'}
          </span>
          {!isQuoteMode && ' from franchisor, SMB to enterprises'}
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 text-xs text-[#180D43]/60">
        <span className="flex items-center gap-1">
          <CreditCard className="w-3 h-3" />
          {isQuoteMode ? 'No payment required' : 'No credit card required'}
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Cancel anytime
        </span>
        {!isQuoteMode && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            7-day free trial
          </span>
        )}
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          30-day money-back guarantee
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          SOC 2 Type 1 certified
        </span>
        <span className="flex items-center gap-1">
          🔒
          SSL secure checkout
        </span>
      </div>

      {/* 5-Star Review Link */}
      <a
        href="https://www.autymate.com/reviews"
        target="_blank"
        rel="noopener noreferrer"
        className="flex justify-center items-center gap-2 mt-3 text-sm text-gray-700 hover:text-[#1239FF] smooth-transition border-t border-gray-200 pt-3"
      >
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-orange-400">⭐</span>
          ))}
        </div>
        <span className="font-semibold">1,000+ 5-star reviews</span>
        <span className="text-xs text-gray-500">→</span>
      </a>
    </>
  );
}
