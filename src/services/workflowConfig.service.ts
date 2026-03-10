import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ApprovalStep {
  level: number
  approver_role: string
  label: string
  timeout_days: number
  escalation_role?: string
}

export interface WorkflowConfig {
  id: string
  request_type: string
  display_name: string
  description: string | null
  notification_table: string
  notify_on_submit: string[]
  notify_on_decision: string[]
  approval_steps: ApprovalStep[]
  is_active: boolean
  updated_at: string
}

export type WorkflowConfigUpdate = Partial<Pick<
  WorkflowConfig,
  'display_name' | 'description' | 'notify_on_submit' | 'notify_on_decision' | 'approval_steps' | 'is_active'
>>

// Human-readable labels for each role slug shown in the UI
export const ROLE_SLUG_LABELS: Record<string, string> = {
  direct_manager:      'Direct Manager',
  ed:                  'Executive Director',
  admin:               'All Admin-role Users',
  hr:                  'All HR-role Users',
  finance_dept:        'Finance Department',
  admin_dept:          'Administration Department (all)',
  admin_dept_manager:  'Administration Department Manager',
}

export const ALL_ROLE_SLUGS = Object.keys(ROLE_SLUG_LABELS)

// ── Browser service (read-only) ────────────────────────────────────────────────

export const workflowConfigService = {
  async getAll(): Promise<WorkflowConfig[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_configs')
      .select('*')
      .order('display_name')

    if (error) throw error
    return (data ?? []) as unknown as WorkflowConfig[]
  },

  async getByType(requestType: string): Promise<WorkflowConfig | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workflow_configs')
      .select('*')
      .eq('request_type', requestType)
      .maybeSingle()

    if (error) throw error
    return data as unknown as WorkflowConfig | null
  },
}

// ── Admin service (write via API route so service-role key is used) ────────────

export async function updateWorkflowConfig(
  id: string,
  updates: WorkflowConfigUpdate
): Promise<WorkflowConfig> {
  const res = await fetch('/api/admin/workflow-configs', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to update workflow config')
  }
  return res.json()
}
