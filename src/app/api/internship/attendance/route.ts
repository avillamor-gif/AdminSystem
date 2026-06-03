import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_ROLES = ['admin', 'hr_manager', 'hr_staff', 'manager']

async function authorize(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  if (!data || !ALLOWED_ROLES.includes(data.role)) return null
  return user
}

/**
 * GET  /api/internship/attendance?employeeId=xxx              → list records
 * POST /api/internship/attendance                             → create manual record
 * PATCH /api/internship/attendance                            → update clock_in / clock_out
 * DELETE /api/internship/attendance?id=xxx&enrollmentId=xxx  → delete + recalculate hours
 */

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!await authorize(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employeeId = req.nextUrl.searchParams.get('employeeId')
  if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })
    .limit(90)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!await authorize(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { employee_id, date, clock_in, clock_out, enrollmentId } = body as {
    employee_id: string
    date: string
    clock_in: string        // ISO datetime string
    clock_out: string | null
    enrollmentId: string
  }

  if (!employee_id || !date || !clock_in || !enrollmentId) {
    return NextResponse.json({ error: 'employee_id, date, clock_in, enrollmentId are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Insert the attendance record
  const { data: record, error: insErr } = await admin
    .from('attendance_records')
    .insert({ employee_id, date, clock_in, clock_out: clock_out ?? null, status: 'present' } as never)
    .select('*')
    .single()

  if (insErr || !record) return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 400 })

  // Recalculate rendered_hours for the enrollment
  if (clock_out) {
    await recalcEnrollmentHours(admin, enrollmentId)
  }

  return NextResponse.json(record, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  if (!await authorize(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, clock_in, clock_out, enrollmentId } = body as {
    id: string
    clock_in: string
    clock_out: string | null
    enrollmentId: string
  }

  if (!id || !clock_in || !enrollmentId) {
    return NextResponse.json({ error: 'id, clock_in, enrollmentId are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: record, error: updErr } = await admin
    .from('attendance_records')
    .update({ clock_in, clock_out: clock_out ?? null } as never)
    .eq('id', id)
    .select('*')
    .single()

  if (updErr || !record) return NextResponse.json({ error: updErr?.message ?? 'Update failed' }, { status: 400 })

  // Recalculate rendered_hours
  await recalcEnrollmentHours(admin, enrollmentId)

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  if (!await authorize(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const enrollmentId = req.nextUrl.searchParams.get('enrollmentId')

  if (!id || !enrollmentId) return NextResponse.json({ error: 'id and enrollmentId required' }, { status: 400 })

  const admin = createAdminClient()

  const { error: delErr } = await admin.from('attendance_records').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 })

  await recalcEnrollmentHours(admin, enrollmentId)

  return NextResponse.json({ success: true })
}

// ─── Recalculate rendered_hours from all attendance records for an enrollment ─

async function recalcEnrollmentHours(admin: ReturnType<typeof createAdminClient>, enrollmentId: string) {
  // Get employee_id from enrollment
  const { data: enr } = await admin
    .from('program_enrollments' as never)
    .select('employee_id')
    .eq('id', enrollmentId)
    .single()

  if (!enr) return

  const empId = (enr as { employee_id: string }).employee_id

  // Fetch all completed attendance records for this employee
  const { data: records } = await admin
    .from('attendance_records')
    .select('clock_in, clock_out')
    .eq('employee_id', empId)
    .not('clock_out', 'is', null)

  const totalHours = ((records ?? []) as { clock_in: string; clock_out: string }[]).reduce((sum, r) => {
    if (!r.clock_in || !r.clock_out) return sum
    const hrs = (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / (1000 * 60 * 60)
    return sum + Math.max(0, hrs)
  }, 0)

  await admin
    .from('program_enrollments' as never)
    .update({ rendered_hours: Math.round(totalHours * 100) / 100, updated_at: new Date().toISOString() } as never)
    .eq('id', enrollmentId)
}
