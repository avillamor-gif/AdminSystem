import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type AppraisalStatus = 'draft' | 'pending_review' | 'in_review' | 'returned' | 'completed'

function periodToLabel(period: string) {
  return period === 'yearend' ? 'YEAREND' : 'MIDYEAR'
}

async function resolveCurrentEmployeeId() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  const { data: role } = await admin
    .from('user_roles')
    .select('employee_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (role?.employee_id) {
    const roleEmployeeId = String(role.employee_id)
    const { data: mappedEmployee } = await admin
      .from('employees')
      .select('id')
      .or(`id.eq.${roleEmployeeId},employee_id.eq.${roleEmployeeId}`)
      .maybeSingle()

    if (mappedEmployee?.id) {
      return { user, employeeId: mappedEmployee.id }
    }
  }

  const { data: employee } = await admin
    .from('employees')
    .select('id')
    .eq('email', user.email ?? '')
    .maybeSingle()

  if (!employee?.id) {
    return { error: 'Employee record not found', status: 404 as const }
  }

  return { user, employeeId: employee.id }
}

export async function GET() {
  try {
    const resolved = await resolveCurrentEmployeeId()
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('performance_appraisals')
      .select(`
        *,
        appraiser:employees!performance_appraisals_appraiser_employee_id_fkey(id, first_name, last_name)
      `)
      .eq('appraisee_employee_id', resolved.employeeId)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveCurrentEmployeeId()
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }

    const body = await req.json()
    const admin = createAdminClient()

    const periodCovered = body.periodCovered === 'yearend' ? 'yearend' : 'midyear'
    const reviewYear = Number(body.reviewYear) || new Date().getFullYear()
    const formData = body.formData ?? {}
    const action = body.action === 'submit' ? 'submit' : 'draft'
    const status: AppraisalStatus = action === 'submit' ? 'pending_review' : 'draft'

    const { data: appraisee } = await admin
      .from('employees')
      .select('last_name, manager_id')
      .eq('id', resolved.employeeId)
      .single()

    const surname = (appraisee?.last_name || 'STAFF').toUpperCase().replace(/\s+/g, '_')
    const filename = `${surname}_${reviewYear}_${periodToLabel(periodCovered)}`

    const existingId = body.id as string | undefined
    const requestedAppraiserEmployeeId = body.appraiserEmployeeId === undefined ? undefined : (body.appraiserEmployeeId || null)

    if (existingId) {
      const { data: current } = await admin
        .from('performance_appraisals')
        .select('id, appraisee_employee_id, created_at, appraiser_employee_id')
        .eq('id', existingId)
        .maybeSingle()

      if (!current || current.appraisee_employee_id !== resolved.employeeId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const resolvedAppraiserEmployeeId =
        requestedAppraiserEmployeeId ?? current.appraiser_employee_id ?? appraisee?.manager_id ?? null

      const { data, error } = await admin
        .from('performance_appraisals')
        .update({
          period_covered: periodCovered,
          review_year: reviewYear,
          appraiser_employee_id: resolvedAppraiserEmployeeId,
          status,
          filename,
          form_data: formData,
          submitted_at: action === 'submit' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
          updated_by: resolved.user.id,
        })
        .eq('id', existingId)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    const resolvedAppraiserEmployeeId = requestedAppraiserEmployeeId ?? appraisee?.manager_id ?? null

    const { data, error } = await admin
      .from('performance_appraisals')
      .insert({
        appraisee_employee_id: resolved.employeeId,
        appraiser_employee_id: resolvedAppraiserEmployeeId,
        period_covered: periodCovered,
        review_year: reviewYear,
        status,
        filename,
        form_data: formData,
        submitted_at: action === 'submit' ? new Date().toISOString() : null,
        created_by: resolved.user.id,
        updated_by: resolved.user.id,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}
