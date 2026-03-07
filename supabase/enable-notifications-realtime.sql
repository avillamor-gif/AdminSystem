-- Enable Realtime for all notification tables
-- Safe to re-run: skips tables already in the publication

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'leave_request_notifications',
    'leave_credit_notifications',
    'travel_request_notifications',
    'publication_request_notifications',
    'equipment_request_notifications',
    'supply_request_notifications'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      RAISE NOTICE 'Added % to supabase_realtime', t;
    ELSE
      RAISE NOTICE '% is already in supabase_realtime, skipping', t;
    END IF;
  END LOOP;
END $$;
