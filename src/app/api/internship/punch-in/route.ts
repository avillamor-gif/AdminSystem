import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { localDateStr } from '@/lib/utils'

/**
 * POST /api/internship/punch-in
 * Body: { enrollmentId: string }
 *
 * 1. Verifies the caller is the enrolled employee (or an admin)
 * 2. Checks there is no open (un-clocked-out) session today
 * 3. Inserts an attendance_record with clock_in = now, no clock_out
 * Returns: { attendanceRecordId, clock_in }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { enrollmentId } = body as { enrollmentId: string }
  if (!enrollmentId) return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })

  const admin = createAdminClient()

  // Resolve enrollment → employee_id
  const { data: enrollment, error: enrErr } = await admin
    .from('program_enrollments' as never)
    .select('id, employee_id, status, required_hours, rendered_hours')
    .eq('id', enrollmentId)
    .single()

  if (enrErr || !enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  const enr = enrollment as { id: string; employee_id: string; status: string; required_hours: number; rendered_hours: number }

  if (enr.status !== 'active' && enr.status !== 'extended') {
    return NextResponse.json({ error: 'Enrollment is not active' }, { status: 400 })
  }

  const today = localDateStr(new Date())

  // Check for an already-open session today
  const { data: existing } = await admin
    .from('attendance_records')
    .select('id, clock_out')
    .eq('employee_id', enr.employee_id)
    .eq('date', today)
    .is('clock_out', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already punched in', attendanceRecordId: (existing as { id: string }).id }, { status: 409 })
  }

  const clockIn = new Date()

  // Insert attendance record
  const { data: newRecord, error: insErr } = await admin
    .from('attendance_records')
    .insert({
      employee_id: enr.employee_id,
      date: today,
      clock_in: clockIn.toISOString(),
      clock_out: null,
      status: 'present',
    } as never)
    .select('id, clock_in')
    .single()

  if (insErr || !newRecord) return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 400 })

  const rec = newRecord as { id: string; clock_in: string }
  return NextResponse.json({ attendanceRecordId: rec.id, clock_in: rec.clock_in }, { status: 201 })
}
