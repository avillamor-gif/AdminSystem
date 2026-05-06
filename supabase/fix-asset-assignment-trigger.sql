-- ============================================================
-- Fix update_asset_on_assignment trigger function
--
-- Problem: fix-function-search-path-and-policies.sql set
-- search_path = '' on this function, so bare table names like
-- "assets" can no longer be resolved. Fix: schema-qualify all
-- table references as public.assets / public.asset_assignments.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_asset_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.assets
    SET
      status       = 'assigned',
      assigned_to  = NEW.employee_id,
      assigned_date = NEW.assigned_date,
      updated_at   = NOW()
    WHERE id = NEW.asset_id;

  ELSIF TG_OP = 'UPDATE'
    AND NEW.returned_date IS NOT NULL
    AND OLD.returned_date IS NULL THEN

    UPDATE public.assets
    SET
      status       = 'available',
      assigned_to  = NULL,
      assigned_date = NULL,
      updated_at   = NOW()
    WHERE id = NEW.asset_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = '';
