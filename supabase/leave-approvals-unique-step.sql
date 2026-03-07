-- Ensure upsert in /api/leave/decision can match on (leave_request_id, step_number)
-- Run in Supabase SQL Editor

ALTER TABLE leave_approvals
  DROP CONSTRAINT IF EXISTS leave_approvals_request_step_unique;

ALTER TABLE leave_approvals
  ADD CONSTRAINT leave_approvals_request_step_unique
    UNIQUE (leave_request_id, step_number);
