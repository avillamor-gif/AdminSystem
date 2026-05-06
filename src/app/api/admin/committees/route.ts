import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return user
}

// POST /api/admin/committees — create
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, description, type, formed_at, is_active } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('committees')
      .insert({ name, description: description ?? null, type: type ?? 'standing', formed_at: formed_at ?? null, is_active: is_active ?? true })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

// PATCH /api/admin/committees — update
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('committees')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

// DELETE /api/admin/committees?id=...
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('committees').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
