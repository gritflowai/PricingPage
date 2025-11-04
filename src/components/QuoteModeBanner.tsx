// Banner component showing quote status and expiration

import { Lock, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { QuoteStatus } from '../types/quote'

interface QuoteModeBannerProps {
  status: QuoteStatus
  expiresAt?: string | null
  lockedAt?: string | null
}

export function QuoteModeBanner({ status, expiresAt, lockedAt }: QuoteModeBannerProps) {
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

  // Locked status
  if (status === 'locked' && expiresAt) {
    const expirationDate = new Date(expiresAt)
    const isExpiringSoon = expirationDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 // 7 days
    const timeUntilExpiry = formatDistanceToNow(expirationDate, { addSuffix: true })

    return (
      <div className={`border-l-4 p-4 mb-6 rounded-r-lg ${
        isExpiringSoon
          ? 'bg-orange-50 border-orange-500'
          : 'bg-green-50 border-green-500'
      }`}>
        <div className="flex items-center gap-3">
          <Lock className={`w-5 h-5 flex-shrink-0 ${
            isExpiringSoon ? 'text-orange-600' : 'text-green-600'
          }`} />
          <div className="flex-1">
            <p className={`font-medium ${
              isExpiringSoon ? 'text-orange-900' : 'text-green-900'
            }`}>
              Quote Locked
            </p>
            <p className={`text-sm ${
              isExpiringSoon ? 'text-orange-700' : 'text-green-700'
            }`}>
              {isExpiringSoon ? 'Expiring' : 'Expires'} {timeUntilExpiry}
              {lockedAt && ` • Locked ${formatDistanceToNow(new Date(lockedAt), { addSuffix: true })}`}
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

  // Expired status
  if (status === 'expired') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Quote Expired</p>
            <p className="text-sm text-red-700">
              This quote has expired. Pricing may have changed since this quote was created.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
