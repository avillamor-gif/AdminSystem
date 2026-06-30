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

  return { admin }
}

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  try {
    const access = await ensureAdminAccess()
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = context.params

    const { data, error } = await access.admin
      .from('performance_appraisals')
      .select(`
        *,
        appraisee:employees!performance_appraisals_appraisee_employee_id_fkey(id, employee_id, first_name, last_name, email),
        appraiser:employees!performance_appraisals_appraiser_employee_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}
