// Custom hook for managing quote mode lifecycle

import { useState, useCallback, useEffect } from 'react'
import type { Quote, QuoteSummary } from '../types/quote'
import * as quoteApi from '../lib/quoteApi'

interface UseQuoteModeOptions {
  quoteId: string | null
  enabled: boolean
  onQuoteLoaded?: (quote: Quote) => void
  onError?: (error: Error) => void
}

export function useQuoteMode(options: UseQuoteModeOptions) {
  const { quoteId, enabled, onQuoteLoaded, onError } = options

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quote on mount
  useEffect(() => {
    if (!enabled || !quoteId) return

    const loadQuote = async () => {
      try {
        setLoading(true)
        setError(null)
        const loadedQuote = await quoteApi.getQuote(quoteId)
        setQuote(loadedQuote)
        onQuoteLoaded?.(loadedQuote)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quote'
        setError(errorMessage)
        onError?.(err instanceof Error ? err : new Error(errorMessage))
        console.error('Failed to load quote:', err)
      } finally {
        setLoading(false)
      }
    }

    loadQuote()
  }, [quoteId, enabled])

  // Save quote with debouncing handled by caller
  const saveQuote = useCallback(async (summary: QuoteSummary) => {
    if (!quoteId || !enabled) return

    try {
      setError(null)
      const updatedQuote = await quoteApi.updateQuote(quoteId, summary)
      setQuote(updatedQuote)
      return updatedQuote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quote'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      console.error('Failed to save quote:', err)
      throw err
    }
  }, [quoteId, enabled, onError])

  // Lock quote
  const lockQuote = useCallback(async (expiresInDays: number = 30) => {
    if (!quoteId || !enabled) {
      throw new Error('Cannot lock quote: Quote ID not set')
    }

    try {
      setLoading(true)
      setError(null)
      const lockedQuote = await quoteApi.lockQuote(quoteId, expiresInDays)
      setQuote(lockedQuote)
      return lockedQuote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lock quote'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      console.error('Failed to lock quote:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [quoteId, enabled, onError])

  // Check if quote is expired
  const isExpired = useCallback(() => {
    if (!quote || !quote.expires_at) return false
    return new Date(quote.expires_at) < new Date()
  }, [quote])

  return {
    quote,
    loading,
    error,
    saveQuote,
    lockQuote,
    isExpired,
  }
}
