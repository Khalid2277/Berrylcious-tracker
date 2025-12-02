-- Migration: Add users table for authentication
-- Run this in your Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- In production, use proper password hashing (bcrypt, etc.)
  role TEXT NOT NULL CHECK (role IN ('owner', 'seller')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the three users with bcrypt-hashed passwords
-- 
-- Passwords are hashed using bcrypt (10 rounds)
-- To generate new hashes, run: node scripts/hash-passwords.js
--
-- User credentials:
--   Gohan (owner): Gohan3322@
--   Aliamiri (owner): Ali1234@
--   Jenny (seller): Jenny123
--
INSERT INTO users (username, password_hash, role, name) VALUES
  ('Gohan', '$2a$10$4gplxZuYp03nKbS1iwJO6eiI0KHWwQnUL106X/an1ZrNU6WXGuFGK', 'owner', 'Gohan'),
  ('Aliamiri', '$2a$10$hXKRtGz2CnZ.9s746cVoq.ci3L7L2EB64aMDMMPtU0vp5giUGC7X2', 'owner', 'Aliamiri'),
  ('Jenny', '$2a$10$gDrQ5YPtJ6do.m3V/NSgguhGVSEs7gErFnMdEmFSnpSbOQqcHI0I6', 'seller', 'Jenny')
ON CONFLICT (username) DO NOTHING;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own user info
-- For now, allow all reads (you can restrict this later)
-- Drop policy if it exists to make migration idempotent
DROP POLICY IF EXISTS "Allow all for users" ON users;
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
-- Drop trigger if it exists to make migration idempotent
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

