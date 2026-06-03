import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST  → create enrollment
// PATCH → update enrollment (body must include `id`)
// DELETE → delete enrollment (body must include `id`)

const ALLOWED_FIELDS = [
  'employee_id', 'partner_institution_id', 'program_type', 'department_id',
  'supervisor_id', 'school_coordinator', 'school_coordinator_email',
  'endorsement_letter_path', 'start_date', 'end_date', 'required_hours',
  'rendered_hours', 'status', 'certificate_issued', 'certificate_issued_at',
  'certificate_file_path', 'notes', 'created_by',
]

async function getAuthedUser() {
  const supabaseServer = createClient()
  const { data: { user }, error } = await supabaseServer.auth.getUser()
  if (error || !user) return null
  return user
}

function filterFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.includes(key)) out[key] = body[key]
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const filtered = filterFields(body)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('program_enrollments')
      .insert(filtered)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const filtered = { ...filterFields(rest), updated_at: new Date().toISOString() }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('program_enrollments')
      .update(filtered)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('program_enrollments').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
