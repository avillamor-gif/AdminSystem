import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/leave-credits
 * Returns all leave credit requests (bypasses RLS via service-role client).
 * Used by the admin Leave Credit Approvals page.
 */
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('leave_credit_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leave credit requests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json([])
  }

  // Resolve relations
  const employeeIds = [...new Set(data.map((r: any) => r.employee_id).filter(Boolean))]
  const leaveTypeIds = [...new Set(data.map((r: any) => r.leave_type_id).filter(Boolean))]
  const reviewerIds = [...new Set(data.map((r: any) => r.reviewed_by).filter(Boolean))]

  const [{ data: employees }, { data: leaveTypes }, { data: reviewers }] = await Promise.all([
    employeeIds.length
      ? supabase.from('employees').select('id, first_name, last_name, employee_id').in('id', employeeIds)
      : { data: [] },
    leaveTypeIds.length
      ? supabase.from('leave_types').select('id, leave_type_name').in('id', leaveTypeIds as string[])
      : { data: [] },
    reviewerIds.length
      ? supabase.from('employees').select('id, first_name, last_name').in('id', reviewerIds as string[])
      : { data: [] },
  ])

  const empMap = new Map((employees || []).map((e: any) => [e.id, e]))
  const ltMap = new Map((leaveTypes || []).map((t: any) => [t.id, t]))
  const revMap = new Map((reviewers || []).map((e: any) => [e.id, e]))

  const enriched = data.map((r: any) => ({
    ...r,
    employee: empMap.get(r.employee_id) ?? null,
    leave_type: r.leave_type_id ? (ltMap.get(r.leave_type_id) ?? null) : null,
    reviewer: r.reviewed_by ? (revMap.get(r.reviewed_by) ?? null) : null,
  }))

  return NextResponse.json(enriched)
}
