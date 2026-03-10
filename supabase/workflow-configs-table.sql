-- ============================================================
-- Centralised Workflow & Notification Configuration
-- Run ONCE in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_configs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type    TEXT        NOT NULL UNIQUE,   -- 'leave' | 'leave_credit' | 'travel' | 'publication' | 'equipment' | 'supply'
  display_name    TEXT        NOT NULL,
  description     TEXT,

  -- Notification table name used by the bell-icon system
  notification_table TEXT     NOT NULL,

  -- Who receives the "new request submitted" notification.
  -- Each entry is a role slug resolved at runtime by the API route.
  -- Valid slugs: "direct_manager" | "ed" | "admin" | "hr" | "finance_dept" | "admin_dept" | "admin_dept_manager"
  notify_on_submit  JSONB     NOT NULL DEFAULT '[]',

  -- Extra recipients CC'd on the decision notification (requester always gets one).
  notify_on_decision JSONB    NOT NULL DEFAULT '[]',

  -- Ordered approval steps.
  -- Each object: { "level": 1, "approver_role": "direct_manager", "label": "Direct Manager", "timeout_days": 3, "escalation_role": "hr" }
  approval_steps  JSONB       NOT NULL DEFAULT '[]',

  is_active       BOOLEAN     NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_workflow_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workflow_configs_updated_at ON workflow_configs;
CREATE TRIGGER trg_workflow_configs_updated_at
  BEFORE UPDATE ON workflow_configs
  FOR EACH ROW EXECUTE FUNCTION set_workflow_configs_updated_at();

-- RLS: only admins can write; authenticated users can read
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wf_config_select" ON workflow_configs;
DROP POLICY IF EXISTS "wf_config_all"    ON workflow_configs;

CREATE POLICY "wf_config_select" ON workflow_configs
  FOR SELECT TO authenticated USING (true);

-- Writes go through the service-role API route only, so no user-level insert policy needed.
-- If you want admin-role users to write directly, uncomment:
-- CREATE POLICY "wf_config_all" ON workflow_configs
--   FOR ALL TO authenticated USING (
--     EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','ed'))
--   );

-- ── Seed with current hardcoded behaviour ─────────────────────────────────────
-- This matches the if/else logic that was in /api/notifications/send/route.ts
-- so existing modules keep working unchanged after the migration.

INSERT INTO workflow_configs
  (request_type, display_name, description, notification_table, notify_on_submit, notify_on_decision, approval_steps)
VALUES
  (
    'leave',
    'Leave Request',
    'Standard employee leave requests (vacation, sick, etc.)',
    'leave_request_notifications',
    '["direct_manager"]',
    '[]',
    '[{"level":1,"approver_role":"direct_manager","label":"Direct Manager","timeout_days":3,"escalation_role":"hr"}]'
  ),
  (
    'leave_credit',
    'Leave Credit Request',
    'Requests to convert overtime / holiday work into leave credits',
    'leave_credit_notifications',
    '["admin_dept","ed"]',
    '[]',
    '[{"level":1,"approver_role":"ed","label":"Executive Director","timeout_days":3}]'
  ),
  (
    'travel',
    'Travel Request',
    'Requests for official travel, accommodation and per diem',
    'travel_request_notifications',
    '["ed","admin","finance_dept"]',
    '["admin","finance_dept"]',
    '[{"level":1,"approver_role":"admin","label":"Admin Manager","timeout_days":3},{"level":2,"approver_role":"ed","label":"Executive Director","timeout_days":3}]'
  ),
  (
    'publication',
    'Publication Request',
    'Requests for publication copies / print materials',
    'publication_request_notifications',
    '["admin_dept_manager"]',
    '[]',
    '[{"level":1,"approver_role":"admin_dept_manager","label":"Admin Department Manager","timeout_days":2}]'
  ),
  (
    'equipment',
    'Office Equipment Request',
    'Requests for computers, peripherals and office equipment',
    'equipment_request_notifications',
    '["admin_dept_manager"]',
    '[]',
    '[{"level":1,"approver_role":"admin_dept_manager","label":"Admin Department Manager","timeout_days":2}]'
  ),
  (
    'supply',
    'Office Supply Request',
    'Requests for consumable office supplies',
    'supply_request_notifications',
    '["admin_dept_manager"]',
    '[]',
    '[{"level":1,"approver_role":"admin_dept_manager","label":"Admin Department Manager","timeout_days":2}]'
  )
ON CONFLICT (request_type) DO NOTHING;
