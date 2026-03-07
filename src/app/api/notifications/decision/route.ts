import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { table, requestTable, requestId, decision, title, message, requestNumber, notifyManagers } = await req.json()

    if (!table || !requestTable || !requestId || !decision || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Always dismiss the original 'new_request' notifications for this request
    // regardless of whether the employee lookup succeeds below.
    const requestIdField = table === 'leave_request_notifications' ? 'leave_request_id' : 'request_id'
    await admin
      .from(table as any)
      .update({ is_read: true })
      .eq(requestIdField, requestId)
      .eq('type', 'new_request')

    // Look up employee_id on the request row to send decision notification to requester
    const { data: reqRow } = await admin
      .from(requestTable as any)
      .select('employee_id')
      .eq('id', requestId)
      .single() as { data: { employee_id: string } | null }

    if (!reqRow?.employee_id) {
      return NextResponse.json({ inserted: 0 })
    }

    // Look up the employee's user_id from user_roles
    const { data: ur } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('employee_id', reqRow.employee_id)
      .maybeSingle()

    if (!ur?.user_id) {
      return NextResponse.json({ inserted: 0 })
    }

    // Build list of recipients: always the requester
    const recipientUserIds = new Set<string>([ur.user_id])

    // For travel decisions: also notify admin managers + finance managers
    if (notifyManagers === 'travel_managers') {
      // All users with admin role
      const { data: adminUsers } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
      for (const u of adminUsers ?? []) {
        if (u.user_id) recipientUserIds.add(u.user_id)
      }

      // All employees in Finance Department
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
    }

    const rows = [...recipientUserIds].map((userId) => {
      const row: Record<string, unknown> = {
        recipient_user_id: userId,
        type: decision,
        title,
        message,
        [requestIdField]: requestId,
        requester_name: '',
      }
      if (table !== 'leave_request_notifications' && table !== 'leave_credit_notifications') {
        row.request_number = requestNumber ?? null
      }
      return row
    })

    const { error: insertErr } = await admin.from(table as any).insert(rows)
    if (insertErr) {
      console.error('[notifications/decision] Insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length })
  } catch (err: any) {
    console.error('[notifications/decision] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

