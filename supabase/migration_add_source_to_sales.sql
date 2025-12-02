-- Migration: Add source column to sales table
-- Run this in your Supabase SQL Editor to add support for POS fee tracking

-- Add source column if it doesn't exist
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('pos', 'manual'));

-- Update existing sales to have 'manual' as default (they already have NULL which will become 'manual')
UPDATE sales SET source = 'manual' WHERE source IS NULL;

