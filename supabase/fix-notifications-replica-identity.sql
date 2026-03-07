-- Fix realtime UPDATE filtering for notification tables
-- Supabase realtime row filters (e.g. recipient_user_id=eq.xxx) on UPDATE events
-- require REPLICA IDENTITY FULL so the full row is included in the WAL event.
-- Without this, UPDATE subscriptions with column filters are silently ignored.
-- Run this in the Supabase SQL Editor.

ALTER TABLE leave_request_notifications   REPLICA IDENTITY FULL;
ALTER TABLE leave_credit_notifications    REPLICA IDENTITY FULL;
ALTER TABLE travel_request_notifications  REPLICA IDENTITY FULL;
ALTER TABLE publication_request_notifications REPLICA IDENTITY FULL;
ALTER TABLE equipment_request_notifications   REPLICA IDENTITY FULL;
ALTER TABLE supply_request_notifications  REPLICA IDENTITY FULL;
