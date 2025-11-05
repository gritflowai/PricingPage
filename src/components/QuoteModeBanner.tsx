// Banner component showing quote status and expiration

import { Lock, AlertCircle, CheckCircle, Clock, AlertTriangle, Flame, Calendar, Mail } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { QuoteStatus } from '../types/quote'
import { useState } from 'react'

interface QuoteModeBannerProps {
  status: QuoteStatus
  expiresAt?: string | null
  lockedAt?: string | null
  onScheduleMeeting?: () => void
}

export function QuoteModeBanner({ status, expiresAt, lockedAt, onScheduleMeeting }: QuoteModeBannerProps) {
  // Draft status
  if (status === 'draft') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Quote in Progress</p>
            <p className="text-sm text-blue-700">Changes are being saved automatically</p>
          </div>
        </div>
      </div>
    )
  }

  // Locked status - 4-tier progressive urgency system
  if (status === 'locked' && expiresAt) {
    const expirationDate = new Date(expiresAt)
    const now = Date.now()
    const timeRemaining = expirationDate.getTime() - now

    // Calculate days and hours remaining
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))

    // Determine urgency tier
    let bgColor, borderColor, textColor, IconComponent, heading, message, shouldPulse

    if (hoursRemaining < 24) {
      // Tier 4: < 24 hours - CRITICAL (Red with pulse animation)
      bgColor = 'bg-red-50'
      borderColor = 'border-red-500'
      textColor = 'text-red-900'
      IconComponent = AlertCircle
      heading = '🔥 EXPIRES TODAY'
      message = `Expires at ${format(expirationDate, 'h:mm a')} • Act now!`
      shouldPulse = true
    } else if (daysRemaining <= 2) {
      // Tier 3: 1-2 days - URGENT (Red)
      bgColor = 'bg-red-50'
      borderColor = 'border-red-500'
      textColor = 'text-red-900'
      IconComponent = Clock
      heading = '⏰ LAST CHANCE'
      message = `Expires in ${hoursRemaining} hours`
      shouldPulse = false
    } else if (daysRemaining <= 7) {
      // Tier 2: 3-7 days - WARNING (Orange)
      bgColor = 'bg-orange-50'
      borderColor = 'border-orange-500'
      textColor = 'text-orange-900'
      IconComponent = AlertTriangle
      heading = '⚠️ Act Now'
      message = `Expires in ${daysRemaining} days • ${format(expirationDate, 'MMM d')}`
      shouldPulse = false
    } else {
      // Tier 1: 8+ days - NEUTRAL (Green)
      bgColor = 'bg-green-50'
      borderColor = 'border-green-500'
      textColor = 'text-green-900'
      IconComponent = Lock
      heading = 'Quote Locked'
      message = `Expires ${format(expirationDate, 'MMMM d, yyyy')}`
      shouldPulse = false
    }

    return (
      <div className={`border-l-4 p-4 mb-6 rounded-r-lg ${bgColor} ${borderColor} ${shouldPulse ? 'animate-pulse' : ''}`}>
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 flex-shrink-0 ${textColor.replace('text-', 'text-').replace('-900', '-600')}`} />
          <div className="flex-1">
            <p className={`font-medium ${textColor}`}>
              {heading}
            </p>
            <p className={`text-sm ${textColor.replace('-900', '-700')}`}>
              {message}
              {lockedAt && daysRemaining > 7 && ` • Locked ${formatDistanceToNow(new Date(lockedAt), { addSuffix: true })}`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Accepted status
  if (status === 'accepted') {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">Quote Accepted</p>
            <p className="text-sm text-green-700">This quote has been accepted and is now active</p>
          </div>
        </div>
      </div>
    )
  }

  // Expired status - Full-screen modal overlay
  if (status === 'expired') {
    const expiredDate = expiresAt ? format(new Date(expiresAt), 'MMMM d, yyyy') : 'recently'

    return (
      <>
        {/* Full-screen overlay - similar to ContactModal */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Quote Expired</h2>
              </div>
              <p className="text-white/90 text-sm">
                Let's discuss your pricing options
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                This quote expired on <strong>{expiredDate}</strong>. Pricing may have changed since this quote was created.
                Schedule a meeting with us to review updated options and get a fresh quote.
              </p>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={onScheduleMeeting}
                  className="flex items-center justify-center gap-2 w-full bg-[#1239FF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0F2DB8] transition-all transform hover:scale-[1.02]"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule a Call
                </button>

                <a
                  href="mailto:EnterprisePlan@autymate.com?subject=Expired Quote - Need Updated Pricing"
                  className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>

              {/* Contact info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-2">
                  <strong>Need immediate assistance?</strong>
                </p>
                <p className="text-sm text-center">
                  <a
                    href="mailto:EnterprisePlan@autymate.com"
                    className="text-[#1239FF] hover:text-[#0F2DB8] font-medium"
                  >
                    EnterprisePlan@autymate.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}
