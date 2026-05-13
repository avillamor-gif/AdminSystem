import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Maps workflow_configs role slugs → the approver_role label used in
 * leave_approval_workflows.workflow_steps and leave/decision roleMatchesStep().
 */
const SLUG_TO_APPROVER_ROLE: Record<string, string> = {
  direct_manager:     'Manager',
  hr:                 'HR',
  admin:              'HR',
  ed:                 'Executive Director',
  finance_dept:       'Finance',
  admin_dept:         'HR',
  admin_dept_manager: 'Manager',
}

/**
 * When the 'leave' workflow config is saved with approval_steps,
 * sync those steps into the default leave_approval_workflows record
 * so that /api/leave/decision (which reads leave_approval_workflows) stays in sync.
 */
async function syncLeaveApprovalWorkflow(
  admin: ReturnType<typeof createAdminClient>,
  approvalSteps: Array<{ level: number; approver_role: string; label?: string; timeout_days?: number; escalation_role?: string }>
): Promise<void> {
  // Convert workflow_configs steps → leave_approval_workflows.workflow_steps shape
  const workflowSteps = approvalSteps.map((s, i) => ({
    step_order:     i + 1,
    approver_role:  SLUG_TO_APPROVER_ROLE[s.approver_role] ?? s.approver_role,
    approver_level: 1,
    is_optional:    false,
  }))

  // Find the default leave_approval_workflow (is_default=true and no leave_type_id)
  const { data: existing } = await admin
    .from('leave_approval_workflows')
    .select('id')
    .is('leave_type_id', null)
    .eq('is_default', true)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await admin
      .from('leave_approval_workflows')
      .update({ workflow_steps: workflowSteps as any })
      .eq('id', existing.id)
  } else {
    // No default workflow exists yet — create one
    await admin
      .from('leave_approval_workflows')
      .insert({
        workflow_name:  'Default Leave Approval',
        workflow_steps: workflowSteps as any,
        is_default:     true,
        is_active:      true,
        is_sequential:  true,
      } as any)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Verify caller is an authenticated admin / ed user
    const supabaseServer = createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Check role — user may have multiple user_roles rows; accept if any is admin/ed/hr
    const { data: roleRows } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const hasAccess = (roleRows ?? []).some((r: any) => ['admin', 'ed', 'hr'].includes(r.role))
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Whitelist allowed fields
    const allowed = ['display_name', 'description', 'notify_on_submit', 'notify_on_decision', 'approval_steps', 'is_active']
    const payload: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) payload[key] = updates[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('workflow_configs')
      .update(payload as any)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[workflow-configs PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Sync leave approval_steps → leave_approval_workflows ──────────────
    // This makes the Workflow Settings page the single source of truth for
    // leave approval routing (leave/decision reads leave_approval_workflows).
    if (data.request_type === 'leave' && Array.isArray(payload.approval_steps)) {
      try {
        const steps = payload.approval_steps as any[]
        // Filter out blank-role steps before syncing
        const validSteps = steps.filter((s: any) => (s.approver_role ?? '').trim() !== '')
        if (validSteps.length > 0) {
          await syncLeaveApprovalWorkflow(admin, validSteps)
        }
      } catch (syncErr) {
        // Sync failure must not break the config save response
        console.warn('[workflow-configs PATCH] leave_approval_workflows sync failed:', syncErr)
      }
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[workflow-configs PATCH] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
