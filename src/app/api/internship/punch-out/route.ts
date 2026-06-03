import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/internship/punch-out
 * Body: { attendanceRecordId: string, enrollmentId: string }
 *
 * 1. Clocks out the attendance record (sets clock_out = now)
 * 2. Calculates session hours from clock_in → clock_out
 * 3. Adds session hours to program_enrollments.rendered_hours
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { attendanceRecordId, enrollmentId } = body as {
    attendanceRecordId: string
    enrollmentId: string
  }
  if (!attendanceRecordId || !enrollmentId) {
    return NextResponse.json({ error: 'attendanceRecordId and enrollmentId are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Fetch the attendance record to get clock_in
  const { data: record, error: recErr } = await admin
    .from('attendance_records')
    .select('id, clock_in, clock_out, employee_id')
    .eq('id', attendanceRecordId)
    .single()

  if (recErr || !record) {
    return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
  }
  if (record.clock_out) {
    return NextResponse.json({ error: 'Already clocked out' }, { status: 400 })
  }

  const clockOut = new Date()
  const clockIn = new Date(record.clock_in as string)
  const sessionHours = Math.max(0, (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60))

  // 2. Update attendance record with clock_out
  const { error: outErr } = await admin
    .from('attendance_records')
    .update({ clock_out: clockOut.toISOString() } as never)
    .eq('id', attendanceRecordId)
  if (outErr) return NextResponse.json({ error: outErr.message }, { status: 400 })

  // 3. Fetch current rendered_hours on enrollment
  const { data: enrollment, error: enrErr } = await admin
    .from('program_enrollments' as never)
    .select('id, rendered_hours')
    .eq('id', enrollmentId)
    .single()
  if (enrErr || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  const currentHours = Number((enrollment as { rendered_hours: number }).rendered_hours ?? 0)
  const newHours = Math.round((currentHours + sessionHours) * 100) / 100

  // 4. Update rendered_hours
  const { error: updErr } = await admin
    .from('program_enrollments' as never)
    .update({ rendered_hours: newHours, updated_at: clockOut.toISOString() } as never)
    .eq('id', enrollmentId)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

  return NextResponse.json({
    clock_out: clockOut.toISOString(),
    session_hours: sessionHours,
    rendered_hours: newHours,
  })
}
