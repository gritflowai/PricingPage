/*
  # Create quotes table

  This migration creates the quotes table to store individual pricing quotes with locked-in pricing.
  Each quote references a specific pricing model and tracks the complete lifecycle from draft to acceptance.

  ## New Tables
    - `quotes`
      - `id` (uuid, primary key, NOT auto-generated) - URL-based unique identifier for the quote
      - `pricing_model_id` (uuid, required, foreign key) - References the pricing model used for this quote
      - `selected_plan` (text, required) - Plan name (e.g., 'starter', 'growth', 'scale', 'ai-advisor')
      - `count` (integer, required) - Quantity selected (companies or users depending on plan)
      - `is_annual` (boolean, required) - Annual vs monthly billing
      - `subtotal` (numeric) - Base price before discounts
      - `final_monthly_price` (numeric) - Final calculated monthly price
      - `price_per_unit` (numeric) - Price per company/user
      - `annual_savings` (numeric) - Savings amount for annual billing
      - `price_breakdown` (jsonb) - Detailed calculation breakdown including all discounts
      - `plan_details` (jsonb) - Features included in the plan (connections, users, scorecards, etc.)
      - `selection_raw` (jsonb) - Complete state snapshot of the selection
      - `status` (text, required) - Current status (draft, locked, accepted, expired)
      - `version` (integer, required, default 1) - Increments when quote is modified after lock
      - `created_at` (timestamptz, defaults to now()) - When quote was first created
      - `updated_at` (timestamptz, defaults to now()) - Last modification timestamp
      - `locked_at` (timestamptz, nullable) - When quote was locked for 30-day validity
      - `expires_at` (timestamptz, nullable) - When quote expires (locked_at + 30 days)
      - `accepted_at` (timestamptz, nullable) - When customer accepted the quote

  ## Foreign Keys
    - `pricing_model_id` references `pricing_models(id)` with RESTRICT on delete
      (prevents deletion of pricing models that have associated quotes)

  ## Security
    - Enable RLS on `quotes` table
    - Add permissive policies for all operations (will be restricted when authentication is added)

  ## Performance
    - Index on `pricing_model_id` for fast lookups by pricing model
    - Index on `status` for filtering quotes by lifecycle stage
*/

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY,
  pricing_model_id uuid NOT NULL REFERENCES pricing_models(id) ON DELETE RESTRICT,
  selected_plan text NOT NULL,
  count integer NOT NULL CHECK (count > 0),
  is_annual boolean NOT NULL DEFAULT false,
  subtotal numeric,
  final_monthly_price numeric,
  price_per_unit numeric,
  annual_savings numeric,
  price_breakdown jsonb DEFAULT '{}'::jsonb,
  plan_details jsonb DEFAULT '{}'::jsonb,
  selection_raw jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('draft', 'locked', 'accepted', 'expired')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  locked_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (temporary - will be restricted with authentication)
CREATE POLICY "Allow all operations on quotes"
  ON quotes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_pricing_model_id 
  ON quotes(pricing_model_id);

CREATE INDEX IF NOT EXISTS idx_quotes_status 
  ON quotes(status);
