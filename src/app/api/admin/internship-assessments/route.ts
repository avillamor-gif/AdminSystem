import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['admin', 'hr', 'manager']

const ALLOWED_FIELDS = [
  'enrollment_id', 'created_by',
  'r_attendance', 'r_punctuality', 'r_appropriate_dress', 'r_attitude',
  'r_acceptance_criticism', 'r_asks_questions', 'r_self_motivated', 'r_ethical_behaviour',
  'r_job_knowledge', 'r_verbal_communication', 'r_written_communication', 'r_analytical_skills',
  'r_technical_skills', 'r_meets_deadlines', 'r_takes_initiative', 'r_sets_priorities',
  'strengths_weaknesses', 'important_achievements', 'most_difficult', 'likes_dislikes',
  'overall_performance', 'intern_other_comments',
  'supervisor_strengths_areas', 'supervisor_comments',
  'status', 'part1_submitted_at', 'part2_submitted_at',
]

function filterFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.includes(key)) out[key] = body[key]
  }
  return out
}

async function authorize(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  if (!data || !ALLOWED_ROLES.includes(data.role)) return null
  return user
}

// POST /api/admin/internship-assessments — create assessment for an enrollment
export async function POST(req: NextRequest) {
  try {
    const user = await authorize(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const filtered = filterFields(body)
    if (!filtered.enrollment_id) return NextResponse.json({ error: 'enrollment_id is required' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('internship_assessments' as never)
      .insert(filtered as never)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/admin/internship-assessments — update (admin for Part II; intern for Part I via same route)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const filtered = { ...filterFields(rest), updated_at: new Date().toISOString() }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('internship_assessments' as never)
      .update(filtered as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/admin/internship-assessments — admin only
export async function DELETE(req: NextRequest) {
  try {
    const user = await authorize(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('internship_assessments' as never).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
