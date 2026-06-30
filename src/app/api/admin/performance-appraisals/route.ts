import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['admin', 'hr', 'ed', 'super admin']

async function ensureAdminAccess() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }

  const admin = createAdminClient()
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const hasAccess = (roles ?? []).some((r: any) => ALLOWED_ROLES.includes(String(r.role)))
  if (!hasAccess) return { error: 'Forbidden', status: 403 as const }

  return { admin, user }
}

export async function GET(req: NextRequest) {
  try {
    const access = await ensureAdminAccess()
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const period = searchParams.get('period')
    const year = searchParams.get('year')

    let query = access.admin
      .from('performance_appraisals')
      .select(`
        *,
        appraisee:employees!performance_appraisals_appraisee_employee_id_fkey(id, employee_id, first_name, last_name, email, department_id),
        appraiser:employees!performance_appraisals_appraiser_employee_id_fkey(id, first_name, last_name)
      `)
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (period && period !== 'all') {
      query = query.eq('period_covered', period)
    }

    if (year && year !== 'all') {
      query = query.eq('review_year', Number(year))
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const access = await ensureAdminAccess()
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json()
    const id = body.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const allowedFields = ['status', 'appraiser_employee_id', 'form_data']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    const { data: current } = await access.admin
      .from('performance_appraisals')
      .select('id, appraiser_employee_id, form_data')
      .eq('id', id)
      .maybeSingle()

    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if ('appraiser_employee_id' in updates) {
      const incomingAppraiser = (updates.appraiser_employee_id as string | null) ?? null
      const previousAppraiser = current.appraiser_employee_id ?? null

      if (incomingAppraiser !== previousAppraiser) {
        const baseFormData = (updates.form_data as Record<string, unknown> | undefined) ?? (current.form_data as Record<string, unknown> | undefined) ?? {}
        updates.form_data = {
          ...baseFormData,
          appraiser_override: {
            previous_appraiser_employee_id: previousAppraiser,
            new_appraiser_employee_id: incomingAppraiser,
            overridden_at: new Date().toISOString(),
            overridden_by_user_id: access.user.id,
          },
        }
      }
    }

    if ('status' in updates && updates.status === 'completed') {
      updates.finalized_at = new Date().toISOString()
    }

    updates.updated_at = new Date().toISOString()
    updates.updated_by = access.user.id

    const { data, error } = await access.admin
      .from('performance_appraisals')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}
