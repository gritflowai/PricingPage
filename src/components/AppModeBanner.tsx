// Banner component showing app mode status for subscription management

import { Lock, CheckCircle, Edit3, Settings, AlertCircle } from 'lucide-react'

export type AppModeStatus = 'current' | 'unsaved' | 'saving' | 'saved' | 'locked';

interface AppModeBannerProps {
  status: AppModeStatus
  lockedReason?: string
  onContactSales?: () => void
}

export function AppModeBanner({ status, lockedReason, onContactSales }: AppModeBannerProps) {
  // Current plan (no changes made)
  if (status === 'current') {
    return (
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Manage Your Subscription</p>
            <p className="text-sm text-gray-600">Adjust your plan below. Changes will be saved when you click "Update My Plan".</p>
          </div>
        </div>
      </div>
    )
  }

  // Unsaved changes
  if (status === 'unsaved') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Edit3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">You Have Unsaved Changes</p>
            <p className="text-sm text-blue-700">Click "Update My Plan" below to save your changes.</p>
          </div>
        </div>
      </div>
    )
  }

  // Saving in progress
  if (status === 'saving') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">Saving Your Changes...</p>
            <p className="text-sm text-blue-700">Please wait while we update your subscription.</p>
          </div>
        </div>
      </div>
    )
  }

  // Successfully saved
  if (status === 'saved') {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">Plan Updated Successfully</p>
            <p className="text-sm text-green-700">Your subscription changes have been saved.</p>
          </div>
        </div>
      </div>
    )
  }

  // Subscription is locked (requires contacting sales)
  if (status === 'locked') {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">Subscription Modifications Locked</p>
            <p className="text-sm text-orange-700">
              {lockedReason || 'Contact our sales team to make changes to your subscription.'}
            </p>
          </div>
          {onContactSales && (
            <button
              onClick={onContactSales}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-all hover:scale-105 shadow-md"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Contact Sales</span>
              <span className="sm:hidden">Contact</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
