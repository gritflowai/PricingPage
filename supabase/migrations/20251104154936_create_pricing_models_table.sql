/*
  # Create pricing_models table

  This migration creates the pricing_models table to store versioned pricing configurations.
  Each pricing model represents a snapshot of the pricing structure at a specific point in time.

  ## New Tables
    - `pricing_models`
      - `id` (uuid, primary key, auto-generated) - Unique identifier for the pricing model
      - `name` (text, required) - Human-readable name for the pricing model (e.g., "Q1 2025 Pricing")
      - `status` (text, required) - Current status of the pricing model (draft, active, or deprecated)
      - `valid_from` (timestamptz, required) - When this pricing model becomes valid
      - `valid_to` (timestamptz, nullable) - When this pricing model expires (null for no expiration)
      - `config_json` (jsonb, required) - Complete pricing configuration including tiers, features, and all settings
      - `created_at` (timestamptz, defaults to now()) - When this pricing model was created

  ## Security
    - Enable RLS on `pricing_models` table
    - Add permissive policies for all operations (will be restricted when authentication is added)

  ## Performance
    - Index on (status, valid_from, valid_to) for fast lookups of active pricing models
*/

-- Create pricing_models table
CREATE TABLE IF NOT EXISTS pricing_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')),
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (temporary - will be restricted with authentication)
CREATE POLICY "Allow all operations on pricing_models"
  ON pricing_models
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_pricing_models_status_validity 
  ON pricing_models(status, valid_from, valid_to);
