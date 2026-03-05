import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { table, requestTable, requestId, decision, title, message, requestNumber } = await req.json()

    if (!table || !requestTable || !requestId || !decision || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Look up employee_id on the request row
    const { data: reqRow } = await admin
      .from(requestTable as any)
      .select('employee_id')
      .eq('id', requestId)
      .single() as { data: { employee_id: string } | null }

    if (!reqRow?.employee_id) {
      return NextResponse.json({ error: 'Request or employee not found' }, { status: 404 })
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

    const requestIdField = table === 'leave_request_notifications' ? 'leave_request_id' : 'request_id'
    const row: Record<string, unknown> = {
      recipient_user_id: ur.user_id,
      type: decision,
      title,
      message,
      [requestIdField]: requestId,
      requester_name: '',
    }
    if (table !== 'leave_request_notifications') {
      row.request_number = requestNumber ?? null
    }

    const { error: insertErr } = await admin.from(table as any).insert(row)
    if (insertErr) {
      console.error('[notifications/decision] Insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: 1 })
  } catch (err: any) {
    console.error('[notifications/decision] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
