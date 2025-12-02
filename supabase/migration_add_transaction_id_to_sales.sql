-- Migration: Add transaction_id column to sales table
-- Run this in your Supabase SQL Editor to add support for grouping POS transactions

-- Add transaction_id column if it doesn't exist
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Create index for faster transaction queries
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transaction_id) WHERE transaction_id IS NOT NULL;

