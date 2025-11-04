// TypeScript interfaces for Quote Mode functionality

export type QuoteStatus = 'draft' | 'locked' | 'accepted' | 'expired'

export type PricingModelStatus = 'draft' | 'active' | 'deprecated'

export interface Quote {
  id: string
  pricing_model_id: string
  selected_plan: string
  count: number
  is_annual: boolean
  subtotal: number | null
  final_monthly_price: number | null
  price_per_unit: number | null
  annual_savings: number | null
  price_breakdown: Record<string, any>
  plan_details: Record<string, any>
  selection_raw: Record<string, any>
  status: QuoteStatus
  version: number
  created_at: string
  updated_at: string
  locked_at: string | null
  expires_at: string | null
  accepted_at: string | null
}

export interface PricingModel {
  id: string
  name: string
  status: PricingModelStatus
  valid_from: string
  valid_to: string | null
  config_json: Record<string, any>
  created_at: string
}

export interface QuoteSummary {
  subtotal: number
  final_monthly_price: number
  price_per_unit: number
  annual_savings: number
  price_breakdown: Record<string, any>
  plan_details: Record<string, any>
  selection_raw?: Record<string, any>
}

export interface InitQuoteRequest {
  id: string
  selected_plan: string
  count: number
  is_annual: boolean
}

export interface UpdateQuoteRequest {
  id: string
  summary: QuoteSummary
}

export interface LockQuoteRequest {
  id: string
  expires_in_days?: number
}

export interface CreatePricingModelRequest {
  name: string
  status: PricingModelStatus
  valid_from: string
  valid_to?: string
  config_json: Record<string, any>
}
