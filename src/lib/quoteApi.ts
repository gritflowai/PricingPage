// API client for Quote Mode - wraps all Supabase function calls
// Note: 'id' parameters refer to Form IDs (UUIDs) that secure access to quotes

import type {
  Quote,
  PricingModel,
  InitQuoteRequest,
  UpdateQuoteRequest,
  LockQuoteRequest,
  CreatePricingModelRequest,
  QuoteSummary,
} from '../types/quote'

const API_BASE_URL = 'https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1'

// Helper function for fetch with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  console.log(`[apiFetch] Calling ${endpoint}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...options?.headers,
    },
  })

  const data = await response.json()
  console.log(`[apiFetch] Response status: ${response.status}, ok: ${response.ok}`);

  if (!response.ok) {
    console.error(`[apiFetch] Error response:`, data);
    throw new Error(data.error || `API error: ${response.status}`)
  }

  return data as T
}

// Pricing Models API

export async function getActivePricingModel(): Promise<PricingModel> {
  return apiFetch<PricingModel>('/pricing-models/active')
}

export async function createPricingModel(
  request: CreatePricingModelRequest
): Promise<PricingModel> {
  return apiFetch<PricingModel>('/pricing-models', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Quotes API

export async function initQuote(request: InitQuoteRequest): Promise<Quote> {
  return apiFetch<Quote>('/quotes/init', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateQuote(
  id: string,
  summary: QuoteSummary
): Promise<Quote> {
  console.log('[quoteApi.updateQuote] Sending to Edge Function:', {
    id,
    count: summary.selection_raw?.count,
    selectedPlan: summary.selection_raw?.selectedPlan,
    isAnnual: summary.selection_raw?.isAnnual
  });

  const result = await apiFetch<Quote>('/quotes/update', {
    method: 'POST',
    body: JSON.stringify({ id, summary }),
  });

  console.log('[quoteApi.updateQuote] Response from Edge Function:', {
    count: result.count,
    selected_plan: result.selected_plan,
    is_annual: result.is_annual
  });

  return result;
}

export async function lockQuote(
  id: string,
  expiresInDays: number = 30
): Promise<Quote> {
  return apiFetch<Quote>('/quotes/lock', {
    method: 'POST',
    body: JSON.stringify({ id, expires_in_days: expiresInDays }),
  })
}

export async function unlockQuote(id: string): Promise<Quote> {
  return apiFetch<Quote>('/quotes/unlock', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
}

export async function getQuote(id: string): Promise<Quote> {
  return apiFetch<Quote>(`/quotes/${id}`)
}

export async function acceptQuote(
  id: string,
  email?: string
): Promise<Quote> {
  return apiFetch<Quote>('/quotes/accept', {
    method: 'POST',
    body: JSON.stringify({
      id,
      accepted_at: new Date().toISOString(),
      email,
    }),
  })
}
