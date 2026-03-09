import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/leave/seed-approvals
 * Seeds leave_approvals rows for a newly created leave request.
 * Uses the service-role client to bypass RLS on leave_approvals.
 *
 * Body: { leaveRequestId: string, workflowId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { leaveRequestId, workflowId } = await req.json()

    if (!leaveRequestId || !workflowId) {
      return NextResponse.json({ error: 'Missing leaveRequestId or workflowId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch workflow steps
    const { data: wf, error: wfErr } = await admin
      .from('leave_approval_workflows')
      .select('workflow_steps')
      .eq('id', workflowId)
      .single()

    if (wfErr || !wf) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const steps: any[] = wf.workflow_steps
      ? (typeof wf.workflow_steps === 'string'
          ? JSON.parse(wf.workflow_steps)
          : wf.workflow_steps)
      : []

    if (steps.length === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    const approvalRows = steps.map((s: any) => ({
      leave_request_id: leaveRequestId,
      step_number: s.step_order ?? 1,
      approver_role: s.approver_role ?? 'Manager',
      status: 'pending',
      is_optional: s.is_optional ?? false,
    }))

    const { error: insertErr } = await admin
      .from('leave_approvals')
      .insert(approvalRows as any)

    if (insertErr) {
      console.error('[leave/seed-approvals] Insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: approvalRows.length })
  } catch (err: any) {
    console.error('[leave/seed-approvals] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
