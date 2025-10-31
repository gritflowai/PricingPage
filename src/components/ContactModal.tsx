import React, { useEffect, useState } from 'react';
import { X, Calendar, Users, Zap, Shield, Mail } from 'lucide-react';

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
  // Optional: pass user data to pre-fill the form
  userData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    formId?: string;
  };
  // Optional: callback for sending iframe messages
  onUserAction?: (action: 'CONTACT_SALES' | 'SCHEDULE_MEETING') => void;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  count,
  planName,
  unitLabel,
  userData,
  onUserAction
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
  const handleSchedulingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Notify parent of scheduling action
    onUserAction?.('SCHEDULE_MEETING');

    if (window.ApolloMeetings) {
      // Submit the form to Apollo
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
    if (!apolloInitialized) {
      console.warn('Apollo not initialized yet, please try again in a moment...');
      return;
    }

    // Notify parent of contact sales action
    onUserAction?.('CONTACT_SALES');

    setShowSchedulingForm(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
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

                {/* Hidden Form ID Field */}
                {userData?.formId && (
                  <input
                    type="hidden"
                    name="formId"
                    value={userData.formId}
                  />
                )}

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
              <h2 className="text-2xl font-bold mb-2">Enterprise Pricing</h2>
              <p className="text-white/90">
                {count === 0
                  ? "Unlock unlimited scale with custom enterprise solutions"
                  : `Unlock custom pricing for ${count}+ ${unitLabel}`}
              </p>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                {count === 0
                  ? <>You're interested in our <strong>Enterprise</strong> solution. Let's discuss how we can build a custom package that scales with your business.</>
                  : <>You've selected <strong>{count} {unitLabel}</strong> for the <strong>{planName}</strong> plan. Let's discuss a custom enterprise solution tailored to your specific needs.</>}
              </p>

              {/* Benefits */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Enterprise Benefits Include:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#1239FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Custom integrations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-[#1239FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Dedicated support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#1239FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Enhanced security</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#1239FF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Volume discounts</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={handleScheduleClick}
                  disabled={!apolloInitialized}
                  className="flex items-center justify-center gap-2 w-full bg-[#1239FF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0F2DB8] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule a Call
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Continue with Standard Pricing
                </button>
              </div>

              {/* Contact Options */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  <strong>Need more details?</strong> Schedule a meeting, email us, or chat with us:
                </p>
                <div className="flex justify-center">
                  <a
                    href="mailto:EnterprisePlan@autymate.com"
                    className="group flex items-center gap-3 px-6 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-[#1239FF] rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    <Mail className="w-5 h-5 text-[#1239FF]" />
                    <div className="text-left">
                      <div className="text-xs text-gray-600 font-medium">Click to email us:</div>
                      <div className="text-base font-bold text-[#1239FF] group-hover:text-[#0F2DB8] transition-colors">
                        EnterprisePlan@autymate.com
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