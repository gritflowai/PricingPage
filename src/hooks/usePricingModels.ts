// Custom hook for managing pricing models in Settings

import { useState, useEffect, useCallback } from 'react'
import type { PricingModel, CreatePricingModelRequest } from '../types/quote'
import * as quoteApi from '../lib/quoteApi'

export function usePricingModels() {
  const [activeModel, setActiveModel] = useState<PricingModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load active pricing model on mount
  useEffect(() => {
    loadActiveModel()
  }, [])

  const loadActiveModel = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const model = await quoteApi.getActivePricingModel()
      setActiveModel(model)
      return model
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pricing model'
      setError(errorMessage)
      console.error('Failed to load active pricing model:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createModel = useCallback(async (request: CreatePricingModelRequest) => {
    try {
      setLoading(true)
      setError(null)
      const newModel = await quoteApi.createPricingModel(request)

      // If the new model is active, set it as the active model
      if (newModel.status === 'active') {
        setActiveModel(newModel)
      }

      return newModel
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pricing model'
      setError(errorMessage)
      console.error('Failed to create pricing model:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    activeModel,
    loading,
    error,
    loadActiveModel,
    createModel,
  }
}
