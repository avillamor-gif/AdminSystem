import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

    // Verify the caller is the manager of the requesting employee
    const { data: lr } = await admin
      .from('leave_requests')
      .select('employee_id, status')
      .eq('id', leave_request_id)
      .single()

    if (!lr) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }
    if (lr.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request is no longer pending' }, { status: 409 })
    }

    // Get the manager's employee_id from user_roles
    const { data: managerRole } = await admin
      .from('user_roles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!managerRole?.employee_id) {
      return NextResponse.json({ error: 'Manager employee record not found' }, { status: 403 })
    }

    // Check manager_id or admin/hr role
    const { data: emp } = await admin
      .from('employees')
      .select('manager_id')
      .eq('id', lr.employee_id)
      .single()

    const isManager = emp?.manager_id === managerRole.employee_id
    const adminRoles = ['admin', 'Admin', 'super_admin', 'Super Admin', 'hr', 'HR Manager', 'Manager/Department Head', 'manager']
    const isAdmin = adminRoles.includes(managerRole.role ?? '')

    if (!isManager && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to approve this request' }, { status: 403 })
    }

    // Update status
    const { data: updated, error: updateError } = await admin
      .from('leave_requests')
      .update({ status: action })
      .eq('id', leave_request_id)
      .select()
      .single()

    if (updateError) {
      console.error('[leave/decision] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Notify the employee via decision API
    const notifTitle = action === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected'
    const notifMessage = action === 'approved'
      ? 'Your leave request has been approved.'
      : `Your leave request has been rejected${comments ? `: ${comments}` : '.'}`

    // Fire-and-forget notification (don't fail the whole request if notif fails)
    fetch(`${req.nextUrl.origin}/api/notifications/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'leave_request_notifications',
        requestTable: 'leave_requests',
        requestId: leave_request_id,
        decision: action,
        title: notifTitle,
        message: notifMessage,
      }),
    }).catch((e) => console.warn('[leave/decision] Notification error:', e))

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('[leave/decision] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
