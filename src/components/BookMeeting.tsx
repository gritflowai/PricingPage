import React, { useEffect, useState } from 'react';
import { Calendar, Shield, Users, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

declare global {
  interface Window {
    ApolloMeetings?: {
      initWidget: (config: {
        appId: string;
        schedulingLink: string;
        domElement?: HTMLElement;
      }) => void;
      submit: (options?: { formId?: string }) => void;
    };
  }
}

interface BookMeetingProps {
  email: string;
  firstName: string;
  lastName: string;
  formId?: string;
}

const BookMeeting: React.FC<BookMeetingProps> = ({
  email,
  firstName,
  lastName,
  formId,
}) => {
  const [apolloReady, setApolloReady] = useState(false);
  const [calendarShown, setCalendarShown] = useState(false);

  useEffect(() => {
    // Load Apollo Meetings script
    const script = document.createElement('script');
    script.src = 'https://assets.apollo.io/js/meetings/meetings-widget.js';
    script.defer = true;

    script.onload = () => {
      if (window.ApolloMeetings) {
        window.ApolloMeetings.initWidget({
          appId: '68e735c5cdb1cc001d0540a1',
          schedulingLink: 'yq4-brh-gyj',
        });
        setApolloReady(true);

        // Auto-submit after a brief delay to let widget initialize
        setTimeout(() => {
          window.ApolloMeetings?.submit({ formId: 'booking-form' });
          setCalendarShown(true);
        }, 600);
      }
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://www.autymate.com/favicon.ico"
              alt="Autymate"
              className="w-8 h-8"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 className="text-lg font-bold text-[#180D43]">Autymate</h1>
              <p className="text-xs text-gray-500">Enterprise Meeting Scheduler</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span>Secure & Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Left Column: Meeting Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#1239FF]/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#1239FF]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#180D43]">Strategy Session</h2>
                  <p className="text-xs text-gray-500">Enterprise Custom Quote</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>60 min</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>With Autymate Team</span>
                </div>
              </div>

              {/* Booking for info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Booking for</p>
                <p className="text-sm font-medium text-[#180D43]">
                  {firstName} {lastName}
                </p>
                <p className="text-xs text-gray-500">{email}</p>
              </div>

              {/* What to expect */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What to expect</p>
                <div className="space-y-2">
                  {[
                    'Custom pricing for your volume',
                    'Implementation roadmap',
                    'Live product walkthrough',
                    'Q&A with solutions team',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" /> SOC 2
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    3,500+ customers
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calendar Area */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 min-h-[500px]">
              {/* Only show heading before Apollo calendar takes over */}
              {!calendarShown && (
                <>
                  <h3 className="text-xl font-bold text-[#180D43] mb-1">
                    Select a Date & Time
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Pick a time that works best for you. We'll send a calendar invite with a video call link.
                  </p>
                </>
              )}

              {/* Hidden form for Apollo to read */}
              <form id="booking-form" style={{ display: 'none' }}>
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="firstName" value={firstName} />
                <input type="hidden" name="lastName" value={lastName} />
                <input type="hidden" name="sessionLength" value="60 min – Strategy Whiteboarding Session" />
                {formId && <input type="hidden" name="formId" value={formId} />}
              </form>

              {/* Loading state while Apollo loads */}
              {!calendarShown && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1239FF] rounded-full animate-spin mb-4" style={{ borderWidth: '3px' }} />
                  <p className="text-sm text-gray-500">Loading available times...</p>
                  <p className="text-xs text-gray-400 mt-1">This should only take a moment</p>
                </div>
              )}
            </div>

            {/* Back link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => window.close()}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1239FF] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to pricing page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookMeeting;
