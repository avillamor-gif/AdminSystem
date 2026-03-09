-- Add cancellation tracking columns to leave_requests
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES employees(id) ON DELETE SET NULL;
