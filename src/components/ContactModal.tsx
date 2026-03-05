import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, Zap, Shield, Mail, TrendingDown, CreditCard } from 'lucide-react';

// Add TypeScript declarations for Apollo Meetings API
declare global {
  interface Window {
    ApolloMeetings?: {
      initWidget: (config: { 
        appId: string; 
        schedulingLink: string; 
        domElement?: HTMLElement 
      }) => void;
      submit: (options?: { formId?: string }) => void;
    };
  }
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  planName: string;
  unitLabel: string; // "companies" or "users"
  // Whether the pricing page is embedded in an iframe
  isInIframe?: boolean;
  // Optional: pass user data to pre-fill the form
  userData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    formId?: string;
  };
  // Optional: callback for sending iframe messages
  onUserAction?: (action: 'CONTACT_SALES' | 'SCHEDULE_MEETING') => void;
  // Optional: pricing estimates for conversion optimization
  estimatedMonthlyMin?: number;
  estimatedMonthlyMax?: number;
  currentMonthlyPrice?: number;
  isAnnual?: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  count,
  planName,
  unitLabel,
  isInIframe = false,
  userData,
  onUserAction,
  estimatedMonthlyMin,
  estimatedMonthlyMax,
  currentMonthlyPrice,
  isAnnual
}) => {
  const [showSchedulingForm, setShowSchedulingForm] = useState(false);
  const [apolloInitialized, setApolloInitialized] = useState(false);

  // Initialize Apollo Meetings widget
  useEffect(() => {
    if (!isOpen) return;

    // Check if Apollo script already exists
    const existingScript = document.querySelector('script[src*="meetings-widget.js"]');
    if (existingScript) {
      // Already loaded, just initialize
      if (window.ApolloMeetings) {
        setApolloInitialized(true);
      }
      return;
    }

    // Create and load Apollo Meetings script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://assets.apollo.io/js/meetings/meetings-widget.js';
    script.defer = true;

    script.onload = () => {
      if (window.ApolloMeetings) {
        // Initialize with your Apollo configuration
        window.ApolloMeetings.initWidget({
          appId: '68e735c5cdb1cc001d0540a1',  // Your Apollo Meetings App ID
          schedulingLink: 'yq4-brh-gyj'        // Your scheduling link
        });
        setApolloInitialized(true);
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load Apollo Meetings widget:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed (optional)
    };
  }, [isOpen]);

  // Handle scheduling form submission
  const handleSchedulingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Notify parent of scheduling action
    onUserAction?.('SCHEDULE_MEETING');

    if (isInIframe) {
      // When inside an iframe, Apollo's popup/overlay gets blocked by cross-origin restrictions.
      // Open a new popup window where Apollo can run without iframe constraints.
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') || '';
      const firstName = formData.get('firstName') || '';
      const lastName = formData.get('lastName') || '';
      const formId = formData.get('formId') || '';
      const sessionLength = formData.get('sessionLength') || '';

      const popup = window.open('', 'apollo-booking', 'width=700,height=750,scrollbars=yes');
      if (popup) {
        popup.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Book a Meeting - Autymate</title>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h2 { color: #1239FF; margin-top: 0; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .loading::after { content: ''; display: block; width: 30px; height: 30px; margin: 16px auto 0; border: 3px solid #e0e0e0; border-top-color: #1239FF; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <h2>Book a Meeting</h2>
    <div class="loading">Loading scheduling calendar...</div>
    <form id="enterprise-meeting-form" style="display:none">
      <input type="hidden" name="email" value="${String(email).replace(/"/g, '&quot;')}" />
      <input type="hidden" name="firstName" value="${String(firstName).replace(/"/g, '&quot;')}" />
      <input type="hidden" name="lastName" value="${String(lastName).replace(/"/g, '&quot;')}" />
      <input type="hidden" name="formId" value="${String(formId).replace(/"/g, '&quot;')}" />
      <input type="hidden" name="sessionLength" value="${String(sessionLength).replace(/"/g, '&quot;')}" />
    </form>
  </div>
  <script>
    var script = document.createElement('script');
    script.src = 'https://assets.apollo.io/js/meetings/meetings-widget.js';
    script.defer = true;
    script.onload = function() {
      if (window.ApolloMeetings) {
        window.ApolloMeetings.initWidget({
          appId: '68e735c5cdb1cc001d0540a1',
          schedulingLink: 'yq4-brh-gyj'
        });
        setTimeout(function() {
          window.ApolloMeetings.submit({ formId: 'enterprise-meeting-form' });
        }, 500);
      }
    };
    document.head.appendChild(script);
  </script>
</body>
</html>`);
        popup.document.close();
      }

      // Close the modal
      setShowSchedulingForm(false);
      onClose();
      return;
    }

    if (window.ApolloMeetings) {
      // Submit the form to Apollo (works fine when not in iframe)
      window.ApolloMeetings.submit({ formId: 'enterprise-meeting-form' });

      // Close the scheduling form after submission
      setTimeout(() => {
        setShowSchedulingForm(false);
        onClose();
      }, 500);
    }
  };

  // Handle opening the scheduling form
  const handleScheduleClick = () => {
    // When in iframe, Apollo may not initialize properly - skip the check
    if (!isInIframe && !apolloInitialized) {
      console.warn('Apollo not initialized yet, please try again in a moment...');
      return;
    }

    // Notify parent of contact sales action
    onUserAction?.('CONTACT_SALES');

    setShowSchedulingForm(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Show scheduling form or main content */}
        {showSchedulingForm ? (
          <>
            {/* Scheduling Form Header */}
            <div className="relative bg-gradient-to-br from-[#1239FF] to-[#0F2DB8] p-6 text-white">
              <button
                onClick={() => setShowSchedulingForm(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                aria-label="Back"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-2">Let's Meet to Learn More About the Enterprise Plan</h2>
            </div>

            {/* Scheduling Form Content */}
            <div className="p-6">
              <form id="enterprise-meeting-form" onSubmit={handleSchedulingSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={userData?.email || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1239FF] focus:border-transparent outline-none"
                  />
                </div>

                {/* First Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={userData?.firstName || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1239FF] focus:border-transparent outline-none"
                  />
                </div>

                {/* Last Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={userData?.lastName || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1239FF] focus:border-transparent outline-none"
                  />
                </div>

                {/* Onboarding Form ID Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onboarding Form ID
                  </label>
                  <input
                    type="text"
                    name="formId"
                    defaultValue={userData?.formId || ''}
                    readOnly={!!userData?.formId}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none ${
                      userData?.formId
                        ? 'bg-gray-50 text-gray-600 cursor-default'
                        : 'focus:ring-2 focus:ring-[#1239FF] focus:border-transparent'
                    }`}
                  />
                </div>

                {/* Session Length Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Length <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sessionLength"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1239FF] focus:border-transparent outline-none bg-white"
                  >
                    <option value="60 min – 📋 Strategy Session (Whiteboard planning + Setup roadmap)">
                      60 min – 📋 Strategy Session (Whiteboard planning)
                    </option>
                    <option value="45 min – 🚀 Deep-Dive (Recommended) (Technical setup planning)">
                      45 min – 🚀 Deep-Dive (Recommended)
                    </option>
                    <option value="30 min – 🎯 Focus Session (Quick-win strategy + Setup basics)">
                      30 min – 🎯 Focus Session
                    </option>
                    <option value="15 min – ⚡ Quick Strategy Discovery Session">
                      15 min – ⚡ Quick Discovery
                    </option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-[#10B981] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#059669] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book Meeting
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Original Modal Content */}
            <div className="relative bg-gradient-to-br from-[#1239FF] to-[#0F2DB8] p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-2">
                {count === 0
                  ? "Let's Design Your Custom Plan"
                  : `Custom Pricing for ${count} ${unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}`}
              </h2>
              <p className="text-white/90 text-lg">
                Get your custom quote on the call
              </p>
            </div>

            <div className="p-6">
              {/* Estimated Pricing Range Preview - Compact */}
              {estimatedMonthlyMin && estimatedMonthlyMax && currentMonthlyPrice && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-5 border-2 border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#1239FF] mb-1">
                      ${estimatedMonthlyMin.toLocaleString()} - ${estimatedMonthlyMax.toLocaleString()}<span className="text-base text-gray-600 font-normal">/mo</span>
                    </div>
                    <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Save up to ${(currentMonthlyPrice - estimatedMonthlyMin).toLocaleString()}/mo
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Estimated enterprise pricing • Custom volume discounts available</p>
                  </div>
                </div>
              )}

              {/* Benefits - Compact Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <TrendingDown className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Save 15-30%</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <Users className="w-4 h-4 text-[#1239FF] flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Dedicated support</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <Shield className="w-4 h-4 text-[#1239FF] flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Custom integrations</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <CreditCard className="w-4 h-4 text-[#1239FF] flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Flexible terms</span>
                </div>
              </div>

              {/* CTAs - Streamlined */}
              <div className="space-y-2">
                <button
                  onClick={handleScheduleClick}
                  disabled={!isInIframe && !apolloInitialized}
                  className="flex items-center justify-center gap-2 w-full bg-[#1239FF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0F2DB8] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Get My Custom Quote
                </button>
                <p className="text-center text-xs text-gray-500">15-min call • Quote delivered live</p>

                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    Continue with Standard Pricing
                  </button>
                  <a
                    href="mailto:quotes@autymate.com"
                    className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#1239FF] rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all group"
                  >
                    <Mail className="w-5 h-5 text-[#1239FF] group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-700">Click to email us:</div>
                      <div className="text-sm font-bold text-[#1239FF] group-hover:underline">
                        quotes@autymate.com
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactModal;