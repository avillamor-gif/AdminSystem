import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_ADDRESS } from '@/lib/resend'
import { newLeaveRequestEmail, newGenericRequestEmail } from '@/lib/emailTemplates'
import { sendPushToUsers } from '@/lib/webpush'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Resolve a role slug from workflow_configs.notify_on_submit into a set of user IDs.
 *
 * Slugs:
 *  direct_manager     – the employee's manager_id → user_id
 *  ed                 – all users with role 'ed'
 *  admin              – all users with role 'admin'
 *  hr                 – all users with role 'hr'
 *  finance_dept       – all employees in the Finance department
 *  admin_dept         – all employees in the Administration department
 *  admin_dept_manager – the first admin/manager-role user in the Administration department
 */
async function resolveRoleSlug(
  slug: string,
  admin: AdminClient,
  emp: { manager_id?: string | null } | null
): Promise<string[]> {
  const ids: string[] = []

  if (slug === 'direct_manager') {
    if (emp?.manager_id) {
      const { data } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('employee_id', emp.manager_id)
        .maybeSingle()
      if (data?.user_id) ids.push(data.user_id)
    }
    // Fallback to all HR users when no manager is set
    if (ids.length === 0) {
      const { data } = await admin.from('user_roles').select('user_id').eq('role', 'hr')
      for (const u of data ?? []) if (u.user_id) ids.push(u.user_id)
    }
    return ids
  }

  if (slug === 'ed' || slug === 'admin' || slug === 'hr') {
    const { data } = await admin.from('user_roles').select('user_id').eq('role', slug as any)
    for (const u of data ?? []) if (u.user_id) ids.push(u.user_id)
    return ids
  }

  if (slug === 'finance_dept' || slug === 'admin_dept') {
    const keyword = slug === 'finance_dept' ? '%finance%' : '%administration%'
    const { data: dept } = await admin
      .from('departments')
      .select('id')
      .ilike('name', keyword)
      .maybeSingle()
    if (dept?.id) {
      const { data: empRows } = await admin.from('employees').select('id').eq('department_id', dept.id)
      const empIds = (empRows ?? []).map((e: any) => e.id).filter(Boolean)
      if (empIds.length > 0) {
        const { data: users } = await admin.from('user_roles').select('user_id').in('employee_id', empIds)
        for (const u of users ?? []) if (u.user_id) ids.push(u.user_id)
      }
    }
    return ids
  }

  if (slug === 'admin_dept_manager') {
    const { data: dept } = await admin
      .from('departments')
      .select('id')
      .ilike('name', '%administration%')
      .maybeSingle()
    if (dept?.id) {
      const { data: empRows } = await admin.from('employees').select('id').eq('department_id', dept.id)
      const empIds = (empRows ?? []).map((e: any) => e.id).filter(Boolean)
      if (empIds.length > 0) {
        const { data: mgr } = await admin
          .from('user_roles')
          .select('user_id')
          .in('employee_id', empIds)
          .in('role', ['admin', 'manager'])
          .limit(1)
          .maybeSingle()
        if (mgr?.user_id) ids.push(mgr.user_id)
      }
    }
    // Fallback: all admin-role users
    if (ids.length === 0) {
      const { data } = await admin.from('user_roles').select('user_id').eq('role', 'admin')
      for (const u of data ?? []) if (u.user_id) ids.push(u.user_id)
    }
    return ids
  }

  return ids
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

    // 2. Resolve recipients from workflow_configs (DB-driven)
    //    targetGroup maps to request_type in workflow_configs.
    //    Legacy slug aliases are normalised below for backwards compatibility.
    const requestTypeAlias: Record<string, string> = {
      leave_request:    'leave',
      admin_dept_and_ed: 'leave_credit',
      travel_approval:  'travel',
      admin_resources:  'publication', // generic admin_resources falls back to admin_dept_manager
    }
    const resolvedRequestType = requestTypeAlias[targetGroup] ?? targetGroup

    const { data: wfConfig } = await admin
      .from('workflow_configs')
      .select('notify_on_submit')
      .eq('request_type', resolvedRequestType)
      .eq('is_active', true)
      .maybeSingle()

    const slugs: string[] = Array.isArray(wfConfig?.notify_on_submit) ? wfConfig.notify_on_submit as string[] : []

    for (const slug of slugs) {
      const ids = await resolveRoleSlug(slug, admin, emp)
      ids.forEach(id => recipientUserIds.add(id))
    }

    // 3. Fallback — if config not found or returns no recipients, use direct manager
    if (recipientUserIds.size === 0) {
      const fallbackIds = await resolveRoleSlug('direct_manager', admin, emp)
      fallbackIds.forEach(id => recipientUserIds.add(id))
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

    // ── Fire-and-forget push notifications ───────────────────────────────────
    const pushUrlMap: Record<string, string> = {
      leave_request_notifications:        '/admin/leave-management',
      travel_request_notifications:       '/admin/travel',
      equipment_request_notifications:    '/admin/office-equipment/equipment-requests',
      supply_request_notifications:       '/admin/office-supplies/supply-requests',
      publication_request_notifications:  '/admin/publications/publication-management',
      leave_credit_notifications:         '/admin/leave-management/leave-credits',
    }
    const pushUrl = pushUrlMap[table] ?? '/admin'
    sendPushToUsers([...recipientUserIds], {
      title: title.replace('{name}', name),
      body: message.replace('{name}', name),
      url: pushUrl,
      tag: `new-request-${requestId}`,
    }).catch(() => {})

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

