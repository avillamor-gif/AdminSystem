-- Recreate leave balance trigger functions to ensure they compile
-- against the now-existing leave_balances table.

CREATE OR REPLACE FUNCTION reserve_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to pending days when a leave request is created
  UPDATE leave_balances
  SET pending_days = pending_days + NEW.total_days
  WHERE employee_id = NEW.employee_id
    AND leave_type_id = NEW.leave_type_id
    AND year = EXTRACT(YEAR FROM NEW.start_date);

  -- Auto-create a zero balance row if none exists yet
  IF NOT FOUND THEN
    INSERT INTO leave_balances
      (employee_id, leave_type_id, year, total_allocated, used_days, pending_days, carried_over)
    VALUES
      (NEW.employee_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date)::int, 0, 0, NEW.total_days, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Approved: move total_days from pending → used
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET
      pending_days = GREATEST(0, pending_days - NEW.total_days),
      used_days    = used_days + NEW.total_days
    WHERE employee_id  = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  -- Rejected or cancelled: remove from pending
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET pending_days = GREATEST(0, pending_days - NEW.total_days)
    WHERE employee_id  = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_reserve_leave_balance ON leave_requests;
CREATE TRIGGER trigger_reserve_leave_balance
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION reserve_leave_balance();

DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance
  AFTER UPDATE OF status ON leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_leave_balance();
