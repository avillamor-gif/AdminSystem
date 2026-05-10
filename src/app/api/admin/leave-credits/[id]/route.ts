import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/admin/leave-credits/[id]
 * Approve or reject a leave credit request (bypasses RLS via service-role client).
 * Body: { action: 'approve', days_approved: number, reviewed_by: string, reviewer_notes?: string }
 *    or { action: 'reject', reviewed_by: string, reviewer_notes: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const { action, days_approved, reviewed_by, reviewer_notes } = body

  if (!action || !reviewed_by) {
    return NextResponse.json({ error: 'Missing action or reviewed_by' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === 'approve') {
    if (!days_approved || days_approved <= 0) {
      return NextResponse.json({ error: 'Invalid days_approved' }, { status: 400 })
    }

    // Fetch full request first
    const { data: req_data, error: fetchErr } = await supabase
      .from('leave_credit_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr || !req_data) {
      return NextResponse.json({ error: fetchErr?.message ?? 'Not found' }, { status: 404 })
    }

    // Mark approved
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .update({
        status: 'approved',
        days_approved,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewer_notes ?? null,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-credit leave balance
    const leave_type_id = req_data.leave_type_id
    if (leave_type_id) {
      const year = new Date(req_data.work_date_from).getFullYear()
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('id, total_allocated')
        .eq('employee_id', req_data.employee_id)
        .eq('leave_type_id', leave_type_id)
        .eq('year', year)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('leave_balances')
          .update({ total_allocated: (existing.total_allocated ?? 0) + days_approved })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('leave_balances')
          .insert({
            employee_id: req_data.employee_id,
            leave_type_id,
            year,
            total_allocated: days_approved,
            used_days: 0,
            pending_days: 0,
            carried_over: 0,
          })
      }
    }

    return NextResponse.json(data)
  }

  if (action === 'reject') {
    if (!reviewer_notes?.trim()) {
      return NextResponse.json({ error: 'reviewer_notes is required for rejection' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .update({
        status: 'rejected',
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        reviewer_notes,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
