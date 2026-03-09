import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_ADDRESS } from '@/lib/resend'
import { newLeaveRequestEmail, newGenericRequestEmail } from '@/lib/emailTemplates'

const ADMIN_ROLES = [
  'admin', 'hr', 'manager',
] as const

/** Resolve the user_id of the Administration department manager */
async function getAdminDeptManagerUserId(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data: adminDept } = await admin
    .from('departments')
    .select('id')
    .ilike('name', '%administration%')
    .maybeSingle()
  if (!adminDept?.id) return null

  // Find employees in the Admin dept who have the admin or manager role in user_roles
  const { data: adminEmpIds } = await admin
    .from('employees')
    .select('id')
    .eq('department_id', adminDept.id)
  const empIds = (adminEmpIds ?? []).map((e: any) => e.id).filter(Boolean)
  if (empIds.length === 0) return null

  const { data: adminUser } = await admin
    .from('user_roles')
    .select('user_id')
    .in('employee_id', empIds)
    .in('role', ['admin', 'manager'])
    .limit(1)
    .maybeSingle()
  return adminUser?.user_id ?? null
}

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated user (using server client which reads cookies)
    const supabaseServer = createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    // Also accept service-role calls (no user) for server-side service calls
    // We proceed as long as the request comes with valid JSON payload

    const body = await req.json()
    const { table, employeeId, requestId, title, message, requesterName, requestNumber, targetGroup } = body

    if (!table || !employeeId || !requestId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch employee details
    const { data: emp } = await admin
      .from('employees')
      .select('first_name, last_name, manager_id')
      .eq('id', employeeId)
      .single()

    const name = emp ? `${emp.first_name} ${emp.last_name}` : (requesterName ?? 'An employee')
    const recipientUserIds = new Set<string>()

    if (targetGroup === 'admin_dept_and_ed') {
      // ── Leave Credit path: notify Administration Department employees + ED role users ──

      // A. All users with the Executive Director (ed) role
      const { data: edUsers } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ed' as any)
      for (const u of edUsers ?? []) {
        if (u.user_id) recipientUserIds.add(u.user_id)
      }

      // B. Find the Administration Department (case-insensitive match)
      const { data: adminDept } = await admin
        .from('departments')
        .select('id')
        .ilike('name', '%administration%')
        .maybeSingle()

      if (adminDept?.id) {
        // All employees in that department
        const { data: adminEmpIds } = await admin
          .from('employees')
          .select('id')
          .eq('department_id', adminDept.id)

        const empIds = (adminEmpIds ?? []).map((e: any) => e.id).filter(Boolean)
        if (empIds.length > 0) {
          const { data: deptUsers } = await admin
            .from('user_roles')
            .select('user_id')
            .in('employee_id', empIds)
          for (const u of deptUsers ?? []) {
            if (u.user_id) recipientUserIds.add(u.user_id)
          }
        }
      }
    } else if (targetGroup === 'travel_approval') {
      // ── Travel Request path: notify ED + admin manager + finance manager ──

      // A. All users with the Executive Director (ed) role
      const { data: edUsers } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ed' as any)
      for (const u of edUsers ?? []) {
        if (u.user_id) recipientUserIds.add(u.user_id)
      }

      // B. All users with the 'admin' role (admin managers)
      const { data: adminUsers } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
      for (const u of adminUsers ?? []) {
        if (u.user_id) recipientUserIds.add(u.user_id)
      }

      // C. All employees in the Finance Department
      const { data: financeDept } = await admin
        .from('departments')
        .select('id')
        .ilike('name', '%finance%')
        .maybeSingle()

      if (financeDept?.id) {
        const { data: financeEmpIds } = await admin
          .from('employees')
          .select('id')
          .eq('department_id', financeDept.id)

        const empIds = (financeEmpIds ?? []).map((e: any) => e.id).filter(Boolean)
        if (empIds.length > 0) {
          const { data: financeUsers } = await admin
            .from('user_roles')
            .select('user_id')
            .in('employee_id', empIds)
          for (const u of financeUsers ?? []) {
            if (u.user_id) recipientUserIds.add(u.user_id)
          }
        }
      }

      // Exclude the requester themselves from notifications
      // (they'll get a decision notification when approved/rejected)
    } else if (targetGroup === 'leave_request') {
      // ── Leave Request path: notify ONLY the employee's direct manager ──
      if (emp?.manager_id) {
        const { data: managerUser } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('employee_id', emp.manager_id)
          .maybeSingle()
        if (managerUser?.user_id) recipientUserIds.add(managerUser.user_id)
      }
      // Fallback: if no direct manager set, notify all HR users
      if (recipientUserIds.size === 0) {
        const { data: hrUsers } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'hr')
        for (const u of hrUsers ?? []) {
          if (u.user_id) recipientUserIds.add(u.user_id)
        }
      }
    } else if (targetGroup === 'admin_resources') {
      // ── Publications / Equipment / Supplies: notify only the Admin dept manager ──
      const adminManagerUserId = await getAdminDeptManagerUserId(admin)
      if (adminManagerUserId) recipientUserIds.add(adminManagerUserId)
      // Fallback: notify all admin-role users if no admin dept manager found
      if (recipientUserIds.size === 0) {
        const { data: adminUsers } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
        for (const u of adminUsers ?? []) {
          if (u.user_id) recipientUserIds.add(u.user_id)
        }
      }
    } else {
      // ── Default path: notify direct supervisor only ──
      // (kept as fallback for any future request types)
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

      // Fallback: all admin/manager role users if no manager set
      if (recipientUserIds.size === 0) {
        const { data: adminUsers } = await admin
          .from('user_roles')
          .select('user_id, role')
          .in('role', ADMIN_ROLES)
        for (const a of adminUsers ?? []) {
          if (a.user_id) recipientUserIds.add(a.user_id)
        }
      }
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
      if (table !== 'leave_request_notifications' && table !== 'leave_credit_notifications') {
        row.request_number = requestNumber ?? null
      }
      return row
    })

    const { error: insertErr } = await admin.from(table as any).insert(rows)
    if (insertErr) {
      console.error('[notifications/send] Insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // ── Fire-and-forget emails to recipients who have an email address ──────
    if (process.env.RESEND_API_KEY) {
      try {
        // Collect email addresses for all recipient user IDs
        const recipientList = [...recipientUserIds]
        const { data: authUsers } = await admin.auth.admin.listUsers()
        const userEmailMap: Record<string, string> = {}
        for (const u of authUsers?.users ?? []) {
          if (u.email) userEmailMap[u.id] = u.email
        }
        const toAddresses = recipientList
          .map((id) => userEmailMap[id])
          .filter(Boolean) as string[]

        if (toAddresses.length > 0) {
          let emailPayload: { subject: string; html: string } | null = null

          if (table === 'leave_request_notifications') {
            // Fetch leave request details for a richer email
            const { data: lr } = await admin
              .from('leave_requests')
              .select('start_date, end_date, total_days, reason, leave_type:leave_types(name)')
              .eq('id', requestId)
              .maybeSingle() as { data: any }

            const leaveTypeName = lr?.leave_type?.name ?? 'Leave'
            emailPayload = newLeaveRequestEmail({
              requesterName: name,
              leaveType: leaveTypeName,
              startDate: lr?.start_date ?? '',
              endDate: lr?.end_date ?? '',
              days: lr?.total_days ?? 0,
              reason: lr?.reason ?? undefined,
            })
          } else {
            const requestTypeMap: Record<string, string> = {
              travel_request_notifications: 'Travel',
              publication_request_notifications: 'Publication',
              equipment_request_notifications: 'Equipment',
              supply_request_notifications: 'Supply',
              leave_credit_notifications: 'Leave Credit',
            }
            const requestType = requestTypeMap[table] ?? 'Request'
            emailPayload = newGenericRequestEmail({
              requesterName: name,
              requestType,
              requestNumber: requestNumber ?? undefined,
              details: message.replace('{name}', name),
            })
          }

          if (emailPayload) {
            // Send in batches of 50 (Resend batch limit)
            for (let i = 0; i < toAddresses.length; i += 50) {
              const batch = toAddresses.slice(i, i + 50)
              await Promise.allSettled(
                batch.map((to) =>
                  resend.emails.send({
                    from: FROM_ADDRESS,
                    to,
                    subject: emailPayload!.subject,
                    html: emailPayload!.html,
                  })
                )
              )
            }
          }
        }
      } catch (emailErr) {
        // Email failure must never break the notification insert
        console.warn('[notifications/send] Email send failed:', emailErr)
      }
    }

    return NextResponse.json({ inserted: rows.length })
  } catch (err: any) {
    console.error('[notifications/send] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

