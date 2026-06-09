import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/recalc-internship-hours
 * Recalculates rendered_hours for all or specific program enrollments
 * by summing hours from their attendance_records
 *
 * Body: { enrollmentId?: string } (optional - if provided, recalc only that enrollment)
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userRole || !['admin', 'hr_manager', 'hr_staff'].includes(userRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const body = await req.json().catch(() => ({}))
  const enrollmentId = body.enrollmentId as string | undefined

  try {
    let enrollmentIds: string[] = []

    if (enrollmentId) {
      // Recalc specific enrollment
      enrollmentIds = [enrollmentId]
    } else {
      // Recalc all active enrollments
      const { data: enrollments, error } = await admin
        .from('program_enrollments')
        .select('id')
        .in('status', ['active', 'extended', 'pending'] as never)

      if (error) throw error
      enrollmentIds = enrollments?.map((e: any) => e.id) ?? []
    }

    const results: any[] = []

    for (const eid of enrollmentIds) {
      // Fetch all attendance records for this enrollment with clock_out times
      const { data: records, error: fetchErr } = await admin
        .from('attendance_records')
        .select('clock_in, clock_out')
        .eq('enrollment_id' as never, eid)
        .not('clock_out', 'is', null)

      if (fetchErr) {
        results.push({ enrollmentId: eid, error: fetchErr.message })
        continue
      }

      // Calculate total hours
      const totalHours = ((records ?? []) as { clock_in: string; clock_out: string }[]).reduce((sum, r) => {
        if (!r.clock_in || !r.clock_out) return sum
        const hrs = (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / (1000 * 60 * 60)
        return sum + Math.max(0, hrs)
      }, 0)

      // Update the enrollment
      const { error: updateErr } = await admin
        .from('program_enrollments' as never)
        .update({
          rendered_hours: Math.round(totalHours * 100) / 100,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', eid)

      if (updateErr) {
        results.push({ enrollmentId: eid, error: updateErr.message })
      } else {
        results.push({
          enrollmentId: eid,
          success: true,
          renderedHours: Math.round(totalHours * 100) / 100,
          recordCount: records?.length ?? 0,
        })
      }
    }

    return NextResponse.json({
      message: `Recalculated ${results.filter((r) => r.success).length} enrollment(s)`,
      results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
