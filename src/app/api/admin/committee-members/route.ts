import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

// POST — add member
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { committee_id, employee_id, role, joined_at } = await req.json()
    if (!committee_id || !employee_id) return NextResponse.json({ error: 'committee_id and employee_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('committee_members')
      .insert({ committee_id, employee_id, role: role ?? 'member', joined_at: joined_at ?? null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

// PATCH — update member role
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, role } = await req.json()
    if (!id || !role) return NextResponse.json({ error: 'id and role required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('committee_members').update({ role }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

// DELETE — remove member
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('committee_members').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
