-- Create leave_approval_workflows table (safe — no DROP)
-- Run this in Supabase SQL Editor if the table is missing.

CREATE TABLE IF NOT EXISTS leave_approval_workflows (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name       VARCHAR(100) NOT NULL,
  workflow_code       VARCHAR(50)  UNIQUE NOT NULL,
  leave_type_id       UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  workflow_steps      JSONB NOT NULL DEFAULT '[]',
  is_sequential       BOOLEAN DEFAULT TRUE,
  escalation_enabled  BOOLEAN DEFAULT FALSE,
  escalation_days     INTEGER,
  priority            INTEGER DEFAULT 1,
  is_default          BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_active
  ON leave_approval_workflows(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_approval_workflows_leave_type
  ON leave_approval_workflows(leave_type_id);

-- RLS
ALTER TABLE leave_approval_workflows ENABLE ROW LEVEL SECURITY;

-- Drop policies first so re-runs are idempotent
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON leave_approval_workflows;
DROP POLICY IF EXISTS "Allow HR admins to manage approval workflows" ON leave_approval_workflows;

CREATE POLICY "Allow read access to authenticated users"
  ON leave_approval_workflows FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow HR admins to manage approval workflows"
  ON leave_approval_workflows FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
    )
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS update_leave_approval_workflows_updated_at ON leave_approval_workflows;
CREATE TRIGGER update_leave_approval_workflows_updated_at
  BEFORE UPDATE ON leave_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Re-add FK on leave_requests.workflow_id if it was lost
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leave_requests_workflow_id_fkey'
  ) THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT leave_requests_workflow_id_fkey
      FOREIGN KEY (workflow_id) REFERENCES leave_approval_workflows(id) ON DELETE SET NULL;
  END IF;
END $$;
