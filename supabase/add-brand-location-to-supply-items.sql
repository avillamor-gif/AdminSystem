-- Add brand_id and location_id to supply_items
ALTER TABLE supply_items
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES supply_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES supply_locations(id) ON DELETE SET NULL;
