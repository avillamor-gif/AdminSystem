/**
 * POST /api/attendance/late-entry
 *
 * Employees submit a late (forgotten) attendance entry for a past date.
 * The record is upserted into attendance_records with a lateEntry flag in notes,
 * and admins / supervisors are notified via attendance_notifications.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Resolve employee via user_roles
    const { data: ur, error: urErr } = await admin
      .from('user_roles')
      .select('employee_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (urErr || !ur?.employee_id) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 403 })
    }
    const employeeId = ur.employee_id

    const { date, type, timeIn, timeOut, reason } = await req.json()
    if (!date || !type) {
      return NextResponse.json({ error: 'date and type are required' }, { status: 400 })
    }

    // Build the session JSON note, marking it as a lateEntry
    const session = {
      type,
      timeIn:  timeIn  ?? null,
      timeOut: timeOut ?? null,
      note:    reason  ?? '',
      lateEntry: true,
    }
    const notes = JSON.stringify([session])

    // Upsert the attendance record (do not overwrite if already exists with punch data)
    const { data: existing } = await admin
      .from('attendance_records')
      .select('id, notes')
      .eq('employee_id', employeeId)
      .eq('date', date)
      .maybeSingle()

    let recordId: string

    if (existing) {
      // Append the late session to existing sessions
      let sessions: any[] = []
      try { sessions = JSON.parse(existing.notes ?? '[]') } catch {}
      if (!Array.isArray(sessions)) sessions = []
      sessions.push(session)
      const { data: updated, error: updErr } = await admin
        .from('attendance_records')
        .update({ notes: JSON.stringify(sessions), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      recordId = updated.id
    } else {
      const { data: inserted, error: insErr } = await admin
        .from('attendance_records')
        .insert({
          employee_id: employeeId,
          date,
          status: 'present',
          notes,
        })
        .select('id')
        .single()
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      recordId = inserted.id
    }

    // Fetch employee name for notifications
    const { data: emp } = await admin
      .from('employees')
      .select('first_name, last_name, manager_id')
      .eq('id', employeeId)
      .maybeSingle()

    const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'An employee'

    // Collect admin + supervisor user IDs to notify
    const recipientUserIds = new Set<string>()

    // Direct manager
    if (emp?.manager_id) {
      const { data: mgr } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('employee_id', emp.manager_id)
        .maybeSingle()
      if (mgr?.user_id) recipientUserIds.add(mgr.user_id)
    }

    // All admin-role users
    const { data: adminRoles } = await admin
      .from('roles')
      .select('id')
      .in('name', ['Admin', 'Super Admin', 'admin', 'super_admin', 'HR Manager', 'hr'])
    const adminRoleIds = (adminRoles ?? []).map((r: any) => r.id)
    if (adminRoleIds.length > 0) {
      const { data: adminUsers } = await admin
        .from('user_roles')
        .select('user_id')
        .in('role_id', adminRoleIds)
      for (const u of adminUsers ?? []) {
        if (u.user_id) recipientUserIds.add(u.user_id)
      }
    }

    if (recipientUserIds.size > 0) {
      const rows = [...recipientUserIds].map(userId => ({
        recipient_user_id: userId,
        type: 'late_entry',
        title: `Late Attendance Entry — ${empName}`,
        message: `${empName} has submitted a late attendance entry for ${date}${reason ? `: "${reason}"` : '.'}`,
        attendance_record_id: recordId,
        requester_name: empName,
        entry_date: date,
      }))

      await admin.from('attendance_notifications' as any).insert(rows)
    }

    return NextResponse.json({ ok: true, recordId })
  } catch (err: any) {
    console.error('[attendance/late-entry] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
