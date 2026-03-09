-- leave_approvals contains only internal workflow step tracking data
-- (step number, approver role, pending/approved/rejected status).
-- It holds no personal or sensitive employee data, so RLS is not needed.
-- The sensitive boundary is on leave_requests (which keeps RLS enabled).
ALTER TABLE leave_approvals DISABLE ROW LEVEL SECURITY;
