-- ============================================================
-- Office Supplies Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Supply Categories
CREATE TABLE IF NOT EXISTS supply_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Supply Vendors
CREATE TABLE IF NOT EXISTS supply_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Supply Items (Inventory)
CREATE TABLE IF NOT EXISTS supply_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES supply_categories(id) ON DELETE SET NULL,
  unit VARCHAR(50) DEFAULT 'piece',
  unit_cost DECIMAL(12,2) DEFAULT 0,
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 5,
  max_stock INTEGER DEFAULT 100,
  location VARCHAR(255),
  vendor_id UUID REFERENCES supply_vendors(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Supply Requests (employee requests)
CREATE TABLE IF NOT EXISTS supply_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  item_id UUID REFERENCES supply_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES supply_categories(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purpose TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Purchase Orders
CREATE TABLE IF NOT EXISTS supply_purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID REFERENCES supply_vendors(id) ON DELETE SET NULL,
  vendor_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  order_date DATE,
  expected_date DATE,
  received_date DATE,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Purchase Order Items
CREATE TABLE IF NOT EXISTS supply_po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES supply_purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES supply_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for all tables
ALTER TABLE supply_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_po_items ENABLE ROW LEVEL SECURITY;

-- Policies (allow all authenticated)
CREATE POLICY "supply_categories_auth" ON supply_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supply_vendors_auth" ON supply_vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supply_items_auth" ON supply_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supply_requests_auth" ON supply_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supply_purchase_orders_auth" ON supply_purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "supply_po_items_auth" ON supply_po_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default categories
INSERT INTO supply_categories (name, description) VALUES
  ('Stationery', 'Pens, pencils, notepads, folders'),
  ('Paper Products', 'Bond paper, carbon paper, envelopes'),
  ('Ink & Toner', 'Printer ink cartridges and toner'),
  ('Cleaning Supplies', 'Cleaning materials and janitorial supplies'),
  ('Breakroom', 'Coffee, tea, and kitchen supplies'),
  ('Technology', 'USB drives, cables, batteries'),
  ('Furniture & Storage', 'Filing cabinets, shelves, organizers')
ON CONFLICT DO NOTHING;
