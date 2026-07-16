import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/internship/missing-punch-requests        → create request
 * GET  /api/internship/missing-punch-requests        → list requests (for admin)
 * PATCH /api/internship/missing-punch-requests       → approve/reject request
 */

async function getUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const user = await getUser(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { enrollment_id, date, time_in, time_out, reason } = body

  if (!enrollment_id || !date || !time_in || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the user owns this enrollment
  const { data: enrollment } = await admin
    .from('program_enrollments')
    .select('employee_id')
    .eq('id', enrollment_id)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  // Get the employee from user
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('employee_id')
    .eq('user_id', user.id)
    .single()

  if (!userRole || userRole.employee_id !== enrollment.employee_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create the missing punch request
  const { data: request, error } = await admin
    .from('missing_punch_requests')
    .insert({
      enrollment_id,
      date,
      time_in: time_in,
      time_out: time_out || null,
      status: 'pending',
      reason,
      requested_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(request, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const user = await getUser(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userRole || !['admin', 'hr_manager', 'hr_staff'].includes(userRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const status = req.nextUrl.searchParams.get('status')
  const admin = createAdminClient()

  let query = admin
    .from('missing_punch_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const user = await getUser(supabase)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userRole || !['admin', 'hr_manager', 'hr_staff'].includes(userRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, status, reviewed_notes } = body

  if (!id || !status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get the request with enrollment details
  const { data: request, error: fetchErr } = await admin
    .from('missing_punch_requests')
    .select('*, program_enrollments(id, employee_id, rendered_hours, required_hours)')
    .eq('id', id)
    .single()

  if (fetchErr || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Update the request status
  const { error: updateErr } = await admin
    .from('missing_punch_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewed_notes: reviewed_notes || null,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  // If approved, auto-calculate the hours and add to enrollment
  if (status === 'approved' && request.program_enrollments) {
    const enrollment = request.program_enrollments
    const clockIn = new Date(`${request.date}T${request.time_in}`)
    const clockOut = request.time_out
      ? new Date(`${request.date}T${request.time_out}`)
      : null

    if (clockOut) {
      const hoursToAdd = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
      const newRenderedHours = (Number(enrollment.rendered_hours) || 0) + Math.max(0, hoursToAdd)

      await admin
        .from('program_enrollments')
        .update({
          rendered_hours: Math.round(newRenderedHours * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id)

      // Also create an attendance record for this approved missing punch
      await admin
        .from('attendance_records')
        .insert({
          employee_id: enrollment.employee_id,
          date: request.date,
          clock_in: `${request.date}T${request.time_in}:00`,
          clock_out: `${request.date}T${request.time_out}:00`,
          status: 'present',
          enrollment_id: enrollment.id,
        })
    }
  }

  return NextResponse.json({ success: true, status })
}
