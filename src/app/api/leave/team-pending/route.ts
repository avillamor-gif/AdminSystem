import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    // Verify caller is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get the manager's employee_id and role from user_roles
    const { data: managerRole } = await admin
      .from('user_roles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!managerRole?.employee_id) {
      return NextResponse.json({ data: [] })
    }

    const adminRoles = ['admin', 'Admin', 'super_admin', 'Super Admin', 'hr', 'HR Manager']
    const isAdmin = adminRoles.includes(managerRole.role ?? '')

    // Determine which employee IDs to fetch requests for
    let targetEmployeeIds: string[] = []

    if (isAdmin) {
      // Admins/HR see ALL pending — no employee filter needed; we'll query without .in()
    } else {
      // Managers see only their direct reports
      const { data: reports } = await admin
        .from('employees')
        .select('id')
        .eq('manager_id', managerRole.employee_id)

      if (!reports || reports.length === 0) {
        return NextResponse.json({ data: [] })
      }
      targetEmployeeIds = reports.map((e: any) => e.id)
    }

    // Fetch pending leave requests — NO joins (avoids ambiguous FK / PGRST200 errors)
    let query = admin
      .from('leave_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.in('employee_id', targetEmployeeIds)
    }

    const { data: leaveRequests, error } = await query

    if (error) {
      console.error('[team-pending] leave_requests error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!leaveRequests?.length) {
      return NextResponse.json({ data: [] })
    }

    // Fetch employees and leave types separately and map them in JS
    const empIds = [...new Set(leaveRequests.map((r: any) => r.employee_id))]
    const ltIds  = [...new Set(leaveRequests.map((r: any) => r.leave_type_id).filter(Boolean))]

    const [{ data: employees }, { data: leaveTypes }] = await Promise.all([
      admin.from('employees').select('id, first_name, last_name, employee_id').in('id', empIds),
      ltIds.length
        ? admin.from('leave_types').select('id, leave_type_name, color_code').in('id', ltIds)
        : Promise.resolve({ data: [] }),
    ])

    const empMap  = Object.fromEntries((employees ?? []).map((e: any) => [e.id, e]))
    const ltMap   = Object.fromEntries((leaveTypes  ?? []).map((l: any) => [l.id, l]))

    const data = leaveRequests.map((r: any) => ({
      ...r,
      employee:   empMap[r.employee_id]   ?? null,
      leave_type: ltMap[r.leave_type_id]  ?? null,
    }))

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[team-pending] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
