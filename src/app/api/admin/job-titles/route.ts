import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = [
  'title', 'code', 'description', 'job_category_id', 'department_id',
  'min_salary', 'max_salary', 'currency', 'employment_type', 'experience_level',
  'location', 'responsibilities', 'requirements', 'benefits', 'is_active',
]

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const filtered: Record<string, unknown> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.includes(key)) filtered[key] = body[key]
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('job_titles')
      .insert(filtered)
      .select('*')
      .single()

    if (error) {
      console.error('[api/admin/job-titles] Create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const filtered: Record<string, unknown> = {}
    for (const key of Object.keys(rest)) {
      if (ALLOWED_FIELDS.includes(key)) filtered[key] = rest[key]
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('job_titles')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[api/admin/job-titles] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('job_titles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[api/admin/job-titles] Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
