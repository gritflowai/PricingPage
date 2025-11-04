// Compact pricing model selector for Settings modal

import { useState } from 'react'
import { format } from 'date-fns'
import type { PricingModel } from '../types/quote'

interface PricingModelSelectorProps {
  activeModel: PricingModel | null
  onCreateModel: (name: string, validFrom: string) => Promise<void>
  loading?: boolean
}

export function PricingModelSelector({
  activeModel,
  onCreateModel,
  loading = false,
}: PricingModelSelectorProps) {
  const [newModelName, setNewModelName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newModelName.trim()) {
      setError('Please enter a model name')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      const validFrom = new Date().toISOString()
      await onCreateModel(newModelName.trim(), validFrom)
      setNewModelName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="border-b pb-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Pricing Model:
        </label>

        {/* Active Model Display */}
        <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 font-medium">
          {loading ? (
            'Loading...'
          ) : activeModel ? (
            <>
              {activeModel.name}
              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                Active
              </span>
            </>
          ) : (
            'No active model'
          )}
        </div>

        {/* Date Range */}
        {activeModel && (
          <span className="text-xs text-gray-500">
            Valid from {format(new Date(activeModel.valid_from), 'MMM d, yyyy')}
            {activeModel.valid_to && ` to ${format(new Date(activeModel.valid_to), 'MMM d, yyyy')}`}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Create New Model */}
        <input
          type="text"
          placeholder="New model name"
          value={newModelName}
          onChange={(e) => {
            setNewModelName(e.target.value)
            setError(null)
          }}
          disabled={isCreating}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
        />

        <button
          onClick={handleCreate}
          disabled={isCreating || !newModelName.trim()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create Draft'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Create new pricing models as drafts. To activate them, contact your administrator.
      </p>
    </div>
  )
}
