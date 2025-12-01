-- Berrylicious Kiosk Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SETTINGS TABLE (for app-wide settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('pos_fee_percent', '0'),
  ('pos_fee_manual', '0'),
  ('use_manual_pos_fee', 'false')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  use_manual_cost BOOLEAN DEFAULT FALSE,
  manual_cost_per_cup DECIMAL(10, 2) DEFAULT 0,
  strawberries_per_cup INTEGER DEFAULT 0,
  chocolate_per_cup DECIMAL(10, 2) DEFAULT 0,
  kunafa_per_cup DECIMAL(10, 2) DEFAULT 0,
  cups_per_cup INTEGER DEFAULT 0,
  sticks_per_cup INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default products
INSERT INTO products (id, name, price, use_manual_cost, manual_cost_per_cup, strawberries_per_cup, chocolate_per_cup, kunafa_per_cup, cups_per_cup, sticks_per_cup) VALUES
  ('normal', 'Strawberry Chocolate', 30.00, FALSE, 0, 8, 60, 0, 1, 1),
  ('kunafa', 'Dubai Chocolate Strawberry', 35.00, FALSE, 0, 8, 60, 30, 1, 1),
  ('rocky', 'Rocky Road', 55.00, TRUE, 50.00, 0, 0, 0, 0, 0),
  ('tips', 'Tips', 1.00, TRUE, 0, 0, 0, 0, 0, 0),
  ('cookies', 'Cookies', 15.00, TRUE, 7.67, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);

-- ============================================
-- FIXED COSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fixed_costs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default fixed costs
INSERT INTO fixed_costs (id, name, amount) VALUES
  ('fc1', 'Kiosk / Booth', 5650),
  ('fc2', 'Fridge', 1100),
  ('fc3', 'Machinery / Equipment', 3150),
  ('fc4', 'Kiosk Delivery', 450)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INGREDIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g', -- 'g', 'pcs', 'units'
  default_bulk_qty DECIMAL(10, 2) DEFAULT 0,
  default_bulk_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default ingredients
INSERT INTO ingredients (id, name, unit, default_bulk_qty, default_bulk_cost) VALUES
  ('cup', 'Cup', 'units', 50, 61.5),
  ('chocolate', 'Chocolate', 'g', 1000, 78.5),
  ('kunafa', 'Pistachio Kunafa', 'g', 2000, 130),
  ('sticks', 'Sticks', 'units', 100, 21),
  ('strawberry', 'Strawberry', 'g', 1000, 40)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INGREDIENT BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingredient_batches (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  name TEXT,
  date DATE NOT NULL,
  bulk_qty DECIMAL(10, 2) NOT NULL,
  bulk_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_batches_ingredient ON ingredient_batches(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_batches_date ON ingredient_batches(date);

-- ============================================
-- STRAWBERRY BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS strawberry_batches (
  id TEXT PRIMARY KEY,
  name TEXT,
  date DATE NOT NULL,
  bulk_weight_kg DECIMAL(10, 2) NOT NULL,
  bulk_weight_g DECIMAL(10, 2) NOT NULL,
  bulk_cost DECIMAL(10, 2) NOT NULL,
  avg_weight_per_strawberry DECIMAL(10, 2) NOT NULL DEFAULT 20,
  cost_per_gram DECIMAL(10, 6) GENERATED ALWAYS AS (
    CASE WHEN bulk_weight_g > 0 THEN bulk_cost / bulk_weight_g ELSE 0 END
  ) STORED,
  cost_per_strawberry DECIMAL(10, 4) GENERATED ALWAYS AS (
    CASE WHEN bulk_weight_g > 0 THEN (bulk_cost / bulk_weight_g) * avg_weight_per_strawberry ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strawberry_batches_date ON strawberry_batches(date);

-- ============================================
-- WASTE ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waste_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  ingredient_id TEXT NOT NULL,
  qty DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_entries_date ON waste_entries(date);
CREATE INDEX IF NOT EXISTS idx_waste_entries_ingredient ON waste_entries(ingredient_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_costs_updated_at
  BEFORE UPDATE ON fixed_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable if you want to add authentication later
-- ============================================

-- For now, we'll allow all operations (no auth required)
-- You can enable RLS later when adding authentication

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE strawberry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for development)
-- Replace with proper auth policies in production

CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for fixed_costs" ON fixed_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ingredient_batches" ON ingredient_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for strawberry_batches" ON strawberry_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for waste_entries" ON waste_entries FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for sales with product details
CREATE OR REPLACE VIEW sales_with_products AS
SELECT 
  s.*,
  p.name as product_name,
  p.price as product_price,
  p.use_manual_cost,
  p.manual_cost_per_cup,
  p.strawberries_per_cup,
  p.chocolate_per_cup,
  p.kunafa_per_cup,
  p.cups_per_cup,
  p.sticks_per_cup,
  (s.qty * s.unit_price) as revenue
FROM sales s
JOIN products p ON s.product_id = p.id;

-- View for inventory summary
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  i.id,
  i.name,
  i.unit,
  COALESCE(SUM(ib.bulk_qty), 0) as total_purchased,
  COALESCE(SUM(ib.bulk_cost), 0) as total_cost,
  COALESCE(SUM(w.qty), 0) as total_wasted
FROM ingredients i
LEFT JOIN ingredient_batches ib ON i.id = ib.ingredient_id
LEFT JOIN waste_entries w ON i.id = w.ingredient_id
GROUP BY i.id, i.name, i.unit;

