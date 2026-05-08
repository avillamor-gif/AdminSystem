-- Migration: Add itinerary legs and publications request to travel_requests
-- Matches the Travel Authorization form layout:
--   • itinerary  — multi-leg flight/transport details (date, from, to, departure, arrival, official/personal, who funds)
--   • publications_requested — books/publications needed for the activity
-- Run ONCE in the Supabase SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ── itinerary ────────────────────────────────────────────────────────────────
-- JSONB array of legs, each shaped as:
-- {
--   "date":           "2026-03-15",
--   "from_location":  "Davao",
--   "to_location":    "Manila",
--   "departure_time": "08:00",
--   "arrival_time":   "09:30",
--   "is_official":    true,       -- true = official, false = personal
--   "funded_by":      "IIA"       -- who funds airfare / transport
-- }
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::JSONB;

-- ── destinations detail ──────────────────────────────────────────────────────
-- JSONB array of destination rows, each shaped as:
-- {
--   "dates":           "March 15-17",
--   "destination":     "Manila",
--   "purpose":         "Board Meeting",
--   "hotel_provided":  true,          -- Y/N from form
--   "activity_funded": true,          -- Y/N from form
--   "activity_funded_by": "IIA"       -- who funds the activity
-- }
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS destinations_detail JSONB DEFAULT '[]'::JSONB;

-- ── publications_requested ──────────────────────────────────────────────────────────────────────────
-- JSONB array of publication rows, each shaped as:
-- {
--   "title":          "Annual Report 2025",
--   "issue_date_no":  "Jan 2025 / No. 12",
--   "est_weight_kg":  0.5,
--   "quantity":       10
-- }
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS publications_requested JSONB DEFAULT '[]'::JSONB;

-- ── equipment_requested ──────────────────────────────────────────────────────────────────────────────
-- JSONB array of equipment rows, each shaped as:
-- {
--   "asset_id":             "uuid",          -- FK → assets.id (null if free-text)
--   "asset_name":           "Laptop",
--   "asset_tag":            "AST-0001",
--   "category":             "IT Equipment",
--   "model":                "ThinkPad X1",
--   "expected_return_date": "2026-03-20",    -- drives asset_assignments monitoring
--   "purpose":              "For presentation"
-- }
-- On travel request APPROVAL  → asset_assignments row inserted + assets.status = 'assigned'
-- On travel request REJECTION / CANCELLATION → assignment closed + assets.status = 'available'
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS equipment_requested JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN travel_requests.itinerary IS
  'Array of transport legs for the trip. Each leg: {date, from_location, to_location, departure_time, arrival_time, is_official, funded_by}';

COMMENT ON COLUMN travel_requests.destinations_detail IS
  'Array of destination rows matching the Travel Authorization form table. Each row: {dates, destination, purpose, hotel_provided, activity_funded_by}';

COMMENT ON COLUMN travel_requests.publications_requested IS
  'Books/publications requested for the activity per the Travel Authorization form. Each row: {title, issue_date_no, est_weight_kg, quantity}';

COMMENT ON COLUMN travel_requests.equipment_requested IS
  'Equipment/assets requested for the trip. Each row: {asset_id, asset_name, asset_tag, category, model, expected_return_date, purpose}. On approval, asset_assignments records are created and assets.status set to assigned. On rejection/cancellation they are released back to available.';

-- ── meetings_schedule ────────────────────────────────────────────────────────
-- Added: meetings / time allocation section
-- Each row: { "date": "2026-05-15", "agenda": "Meeting with partner org" }
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS meetings_schedule JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN travel_requests.meetings_schedule IS
  'Whom to meet and time allocation entries. Each row: {date, agenda}';
