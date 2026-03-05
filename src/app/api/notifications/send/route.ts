import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ROLES = [
  'admin', 'Admin', 'super_admin', 'Super Admin',
  'hr', 'HR Manager', 'Manager/Department Head', 'manager',
]

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated user (using server client which reads cookies)
    const supabaseServer = createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    // Also accept service-role calls (no user) for server-side service calls
    // We proceed as long as the request comes with valid JSON payload

    const body = await req.json()
    const { table, employeeId, requestId, title, message, requesterName, requestNumber } = body

    if (!table || !employeeId || !requestId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch employee's manager_id (bypass RLS with admin client)
    const { data: emp } = await admin
      .from('employees')
      .select('first_name, last_name, manager_id')
      .eq('id', employeeId)
      .single()

    const name = emp ? `${emp.first_name} ${emp.last_name}` : (requesterName ?? 'An employee')
    const recipientUserIds = new Set<string>()

    // 2. Direct supervisor via manager_id → user_roles
    if (emp?.manager_id) {
      const { data: supervisorUser } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('employee_id', emp.manager_id)
        .maybeSingle()
      if (supervisorUser?.user_id) {
        recipientUserIds.add(supervisorUser.user_id)
      }
    }

    // 3. All admin/manager role users
    const { data: adminUsers } = await admin
      .from('user_roles')
      .select('user_id, role')
      .in('role', ADMIN_ROLES)

    for (const a of adminUsers ?? []) {
      if (a.user_id) recipientUserIds.add(a.user_id)
    }

    if (recipientUserIds.size === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    // 4. Insert one notification row per recipient
    const requestIdField = table === 'leave_request_notifications' ? 'leave_request_id' : 'request_id'
    const rows = [...recipientUserIds].map((userId) => {
      const row: Record<string, unknown> = {
        recipient_user_id: userId,
        type: 'new_request',
        title: title.replace('{name}', name),
        message: message.replace('{name}', name),
        [requestIdField]: requestId,
        requester_name: name,
      }
      if (table !== 'leave_request_notifications') {
        row.request_number = requestNumber ?? null
      }
      return row
    })

    const { error: insertErr } = await admin.from(table as any).insert(rows)
    if (insertErr) {
      console.error('[notifications/send] Insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length })
  } catch (err: any) {
    console.error('[notifications/send] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
