-- Migration: Add inventory table to store current remaining amounts
-- Run this in your Supabase SQL Editor

-- ============================================
-- INVENTORY TABLE (for current remaining amounts)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id TEXT NOT NULL UNIQUE,
  remaining DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_ingredient ON inventory(ingredient_id);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (for now)
DROP POLICY IF EXISTS "Allow all for inventory" ON inventory;
CREATE POLICY "Allow all for inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize inventory for existing ingredients (optional - can be done via app)
-- This sets initial remaining to 0, which will be calculated/updated by the app
INSERT INTO inventory (ingredient_id, remaining)
SELECT id, 0
FROM ingredients
ON CONFLICT (ingredient_id) DO NOTHING;

