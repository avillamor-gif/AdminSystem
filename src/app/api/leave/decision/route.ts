import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Maps user_roles.role values → the approver_role label used in workflow_steps
const ROLE_TO_STEP_LABEL: Record<string, string> = {
  manager: 'Manager',
  'manager/department head': 'Manager',
  hr: 'HR',
  'hr manager': 'HR',
  admin: 'HR',
  'super admin': 'HR',
  ed: 'Executive Director',
  'executive director': 'Executive Director',
}

/**
 * Maps workflow_configs role slugs → approver_role labels used in
 * leave_approval_workflows.workflow_steps and roleMatchesStep().
 * Keep in sync with /api/admin/workflow-configs/route.ts.
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

function roleMatchesStep(userRole: string, stepRole: string): boolean {
  const normalized = (userRole ?? '').toLowerCase()
  const stepNormalized = (stepRole ?? '').toLowerCase()
  // Direct label match (e.g. "Manager" === "Manager")
  if (normalized === stepNormalized) return true
  // Map via lookup
  const mapped = ROLE_TO_STEP_LABEL[normalized]
  if (mapped && mapped.toLowerCase() === stepNormalized) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leave_request_id, action, comments } = await req.json()

    if (!leave_request_id || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch the leave request with its workflow_id
    const { data: lr } = await admin
      .from('leave_requests')
      .select('employee_id, status, workflow_id')
      .eq('id', leave_request_id)
      .single()

    if (!lr) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }
    if (lr.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request is no longer pending' }, { status: 409 })
    }

    // Get the approver's employee record + role from user_roles
    const { data: approverRole } = await admin
      .from('user_roles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!approverRole?.employee_id) {
      return NextResponse.json({ error: 'Approver employee record not found' }, { status: 403 })
    }

    // Check if approver is the direct manager or has an elevated role
    const { data: emp } = await admin
      .from('employees')
      .select('manager_id')
      .eq('id', lr.employee_id)
      .single()

    const isDirectManager = emp?.manager_id === approverRole.employee_id
    const elevatedRoles = ['admin', 'super admin', 'hr', 'hr manager', 'manager', 'manager/department head', 'ed', 'executive director']
    const isElevatedRole = elevatedRoles.includes((approverRole.role ?? '').toLowerCase())

    if (!isDirectManager && !isElevatedRole) {
      return NextResponse.json({ error: 'Not authorized to approve this request' }, { status: 403 })
    }

    // ── Workflow-aware approval ──────────────────────────────────────────────
    let finalStatus: string = action  // default: direct approve/reject

    // Resolve workflow steps — prefer leave_approval_workflows (specific),
    // fall back to workflow_configs 'leave' entry (managed by /workflow-settings page).
    let workflowSteps: any[] | null = null
    let isSequential = true

    if (lr.workflow_id) {
      const { data: workflow } = await admin
        .from('leave_approval_workflows')
        .select('workflow_steps, is_sequential')
        .eq('id', lr.workflow_id)
        .single()

      if (workflow?.workflow_steps) {
        const raw = typeof workflow.workflow_steps === 'string'
          ? JSON.parse(workflow.workflow_steps)
          : workflow.workflow_steps
        workflowSteps = (raw as any[]).filter((s: any) => (s.approver_role ?? '').trim() !== '')
        isSequential = workflow.is_sequential ?? true
      }
    }

    // Fallback: read from workflow_configs 'leave' approval_steps
    if (!workflowSteps || workflowSteps.length === 0) {
      const { data: wfConfig } = await admin
        .from('workflow_configs')
        .select('approval_steps')
        .eq('request_type', 'leave')
        .eq('is_active', true)
        .maybeSingle()

      if (Array.isArray(wfConfig?.approval_steps) && (wfConfig.approval_steps as any[]).length > 0) {
        // Convert workflow_configs steps (level + slug) → decision route format (step_order + label)
        workflowSteps = (wfConfig.approval_steps as any[])
          .filter((s: any) => (s.approver_role ?? '').trim() !== '')
          .map((s: any, i: number) => ({
            step_order:    i + 1,
            approver_role: SLUG_TO_APPROVER_ROLE[s.approver_role] ?? s.approver_role,
            is_optional:   s.is_optional ?? false,
          }))
      }
    }

    if (workflowSteps && workflowSteps.length > 0) {
      const steps = workflowSteps

      // Find the step this approver's role covers
      const matchingStep = steps.find((s: any) =>
        roleMatchesStep(approverRole.role ?? '', s.approver_role ?? '')
      )

      if (!matchingStep) {
        // Approver's role is not in the workflow — allow direct approval only for admin/super admin
        const bypassRoles = ['admin', 'super admin']
        if (!bypassRoles.includes((approverRole.role ?? '').toLowerCase())) {
          return NextResponse.json({ error: 'Your role is not part of this approval workflow' }, { status: 403 })
        }
        // Admin bypass: falls through to direct approve below
      } else {
        const stepOrder: number = matchingStep.step_order ?? 1

        if (action === 'rejected') {
          // Rejection at any step immediately rejects the whole request
          await admin
            .from('leave_approvals')
            .upsert({
              leave_request_id,
              step_number: stepOrder,
              approver_role: matchingStep.approver_role,
              approver_id: approverRole.employee_id,
              status: 'rejected',
              comments: comments ?? null,
              approved_at: new Date().toISOString(),
              is_optional: matchingStep.is_optional ?? false,
            }, { onConflict: 'leave_request_id,step_number' })

          finalStatus = 'rejected'
        } else {
          // Mark this step as approved
          await admin
            .from('leave_approvals')
            .upsert({
              leave_request_id,
              step_number: stepOrder,
              approver_role: matchingStep.approver_role,
              approver_id: approverRole.employee_id,
              status: 'approved',
              comments: comments ?? null,
              approved_at: new Date().toISOString(),
              is_optional: matchingStep.is_optional ?? false,
            }, { onConflict: 'leave_request_id,step_number' })

          // Check if all required steps are now approved
          const { data: existingApprovals } = await admin
            .from('leave_approvals')
            .select('step_number, status, is_optional')
            .eq('leave_request_id', leave_request_id)

          const approvedStepNums = new Set(
            (existingApprovals ?? [])
              .filter((a: any) => a.status === 'approved' || a.status === 'skipped')
              .map((a: any) => a.step_number)
          )

          const requiredSteps = steps.filter((s: any) => !s.is_optional)
          const allRequiredDone = requiredSteps.every((s: any) =>
            approvedStepNums.has(s.step_order ?? 1)
          )
          finalStatus = allRequiredDone ? 'approved' : 'pending'
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // Only update leave_requests when the final status changes from pending
    if (finalStatus !== 'pending') {
      const { data: updated, error: updateError } = await admin
        .from('leave_requests')
        .update({ status: finalStatus as 'approved' | 'rejected' | 'cancelled' | 'pending' })
        .eq('id', leave_request_id)
        .select()
        .single()

      if (updateError) {
        console.error('[leave/decision] Update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // ── Google Workspace side-effects ─────────────────────────────────────
      // Fire-and-forget: don't block the response on Google API calls
      ;(async () => {
        try {
          // Fetch employee email + name + leave dates
          const { data: employeeRow } = await admin
            .from('employees')
            .select('email, first_name, last_name')
            .eq('id', updated.employee_id)
            .single()

          // Also fetch the full leave request for dates + leave_type
          const { data: lrFull } = await admin
            .from('leave_requests')
            .select('start_date, end_date, leave_type_id, reason')
            .eq('id', leave_request_id)
            .single()

          const employeeEmail = employeeRow?.email
          const employeeName = employeeRow
            ? `${employeeRow.first_name} ${employeeRow.last_name}`
            : 'Employee'

          if (employeeEmail && lrFull) {
            const origin = req.nextUrl.origin

            if (finalStatus === 'approved') {
              // Create OOO calendar event on the employee's primary calendar
              fetch(`${origin}/api/google/calendar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'create',
                  userEmail: employeeEmail,
                  event: {
                    summary: `🌴 On Leave`,
                    description: lrFull.reason
                      ? `Leave reason: ${lrFull.reason}`
                      : 'Approved leave request',
                    start: lrFull.start_date,
                    end: lrFull.end_date,
                    allDay: true,
                  },
                }),
              }).catch(e => console.warn('[leave/decision] Calendar create error:', e))
            }

            // Send Chat DM with the decision
            const chatMsg = finalStatus === 'approved'
              ? `✅ Hi ${employeeRow?.first_name ?? 'there'}, your leave request (${lrFull.start_date} – ${lrFull.end_date}) has been *approved*. Have a good break! 🎉`
              : `❌ Hi ${employeeRow?.first_name ?? 'there'}, your leave request (${lrFull.start_date} – ${lrFull.end_date}) has been *rejected*${comments ? `.\n\nReason: _${comments}_` : '.'}`

            fetch(`${origin}/api/google/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sendDM',
                userEmail: employeeEmail,
                message: chatMsg,
              }),
            }).catch(e => console.warn('[leave/decision] Chat DM error:', e))
          }
        } catch (e) {
          console.warn('[leave/decision] Google Workspace side-effects error:', e)
        }
      })()
      // ─────────────────────────────────────────────────────────────────────

      // Notify the employee of the final decision
      const notifTitle = finalStatus === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected'
      const notifMessage = finalStatus === 'approved'
        ? 'Your leave request has been approved.'
        : `Your leave request has been rejected${comments ? `: ${comments}` : '.'}`

      fetch(`${req.nextUrl.origin}/api/notifications/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'leave_request_notifications',
          requestTable: 'leave_requests',
          requestId: leave_request_id,
          decision: finalStatus,
          title: notifTitle,
          message: notifMessage,
        }),
      }).catch((e) => console.warn('[leave/decision] Notification error:', e))

      return NextResponse.json({ success: true, data: updated })
    }

    // Still pending (waiting for more workflow steps) — return current state
    const { data: current } = await admin
      .from('leave_requests')
      .select()
      .eq('id', leave_request_id)
      .single()

    return NextResponse.json({ success: true, data: current, pending_steps: true })
  } catch (err: any) {
    console.error('[leave/decision] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
