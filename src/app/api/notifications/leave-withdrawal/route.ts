import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_ADDRESS } from '@/lib/resend'
import { renderLeaveWithdrawalEmail } from '@/lib/emailTemplateRenderer'
import { sendPushToUsers } from '@/lib/webpush'

export async function POST(req: NextRequest) {
  try {
    const {
      employeeId,
      requestId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      days,
      withdrawnBy,
      adminName,
      title,
      message,
    } = await req.json()

    if (!employeeId || !requestId || !employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get the employee's user_id from user_roles to notify them
    const { data: employeeUserRole } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('employee_id', employeeId)
      .maybeSingle()

    const employeeUserId = employeeUserRole?.user_id

    // Get employee's email
    const { data: employee } = await admin
      .from('employees')
      .select('email')
      .eq('id', employeeId)
      .maybeSingle()

    const employeeEmail = employee?.email

    // Look up supervisors and admins using workflow_configs
    const { data: wfConfig } = await admin
      .from('workflow_configs')
      .select('notify_on_submit')
      .eq('request_type', 'leave')
      .eq('is_active', true)
      .maybeSingle()

    const supervisorAndAdminIds = new Set<string>()

    // Parse notify_on_submit from workflow config
    let notifyRoles: string[] = []
    if (typeof wfConfig?.notify_on_submit === 'string') {
      notifyRoles = wfConfig.notify_on_submit.split(',').map((s: string) => s.trim()).filter(Boolean)
    } else if (Array.isArray(wfConfig?.notify_on_submit)) {
      notifyRoles = wfConfig.notify_on_submit as string[]
    } else {
      notifyRoles = ['direct_manager', 'admin']
    }

    // Resolve role slugs to user IDs
    for (const slug of notifyRoles) {
      if (slug === 'direct_manager') {
        const { data: emp } = await admin
          .from('employees')
          .select('manager_id')
          .eq('id', employeeId)
          .maybeSingle()

        if (emp?.manager_id) {
          const { data: mgr } = await admin
            .from('user_roles')
            .select('user_id')
            .eq('employee_id', emp.manager_id)
            .maybeSingle()

          if (mgr?.user_id) supervisorAndAdminIds.add(mgr.user_id)
        }
      } else if (slug === 'admin') {
        const { data: admins } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')

        for (const a of admins ?? []) {
          if (a.user_id) supervisorAndAdminIds.add(a.user_id)
        }
      } else if (slug === 'hr') {
        const { data: hrs } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'hr')

        for (const h of hrs ?? []) {
          if (h.user_id) supervisorAndAdminIds.add(h.user_id)
        }
      }
    }

    // Insert withdrawal notifications
    const insertedIds: string[] = []
    let notificationInsertions = 0

    if (supervisorAndAdminIds.size > 0) {
      const notifications = Array.from(supervisorAndAdminIds).map((userId: string) => ({
        leave_request_id: requestId,
        user_id: userId,
        type: 'cancelled',
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      }))

      const { data: inserted } = await admin
        .from('leave_request_notifications')
        .insert(notifications)
        .select('id')

      if (inserted) {
        for (const n of inserted) insertedIds.push(n.id)
        notificationInsertions = inserted.length
      }
    }

    // Send push notifications to supervisors and admins
    if (supervisorAndAdminIds.size > 0) {
      try {
        await sendPushToUsers(Array.from(supervisorAndAdminIds), {
          title,
          body: message,
          url: '/admin/leave-management',
        })
      } catch (pushErr) {
        console.warn('[notifications] push send failed:', pushErr)
      }
    }

    // Send email notifications
    const emailResult = await renderLeaveWithdrawalEmail({
      employeeName,
      leaveType,
      startDate,
      endDate,
      days,
      withdrawnBy: withdrawnBy as 'admin' | 'employee',
      adminName,
    })

    if (emailResult && employeeEmail) {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: employeeEmail,
          subject: emailResult.subject,
          html: emailResult.html,
        })
      } catch (emailErr) {
        console.warn('[notifications] email send to employee failed:', emailErr)
      }
    }

    // Also send email to supervisors and admins
    if (supervisorAndAdminIds.size > 0 && emailResult) {
      try {
        const supervisorEmails: string[] = []

        // Get emails for supervisors
        const supervisorIds = Array.from(supervisorAndAdminIds)
        for (const userId of supervisorIds) {
          const { data: ur } = await admin
            .from('user_roles')
            .select('employee_id')
            .eq('user_id', userId)
            .maybeSingle()

          if (ur?.employee_id) {
            const { data: emp } = await admin
              .from('employees')
              .select('email')
              .eq('id', ur.employee_id)
              .maybeSingle()

            if (emp?.email) supervisorEmails.push(emp.email)
          }
        }

        if (supervisorEmails.length > 0) {
          await resend.emails.send({
            from: FROM_ADDRESS,
            to: supervisorEmails[0],
            bcc: supervisorEmails.slice(1),
            subject: `${emailResult.subject} - For Your Review`,
            html: emailResult.html,
          })
        }
      } catch (emailErr) {
        console.warn('[notifications] email send to supervisors failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      notificationsCreated: notificationInsertions,
      insertedIds,
    })
  } catch (error) {
    console.error('[notifications/leave-withdrawal] error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications', details: String(error) },
      { status: 500 }
    )
  }
}
