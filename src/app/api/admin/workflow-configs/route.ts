import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    // Verify caller is an authenticated admin / ed user
    const supabaseServer = createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Check role
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleRow || !['admin', 'ed', 'hr'].includes(roleRow.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Whitelist allowed fields
    const allowed = ['display_name', 'description', 'notify_on_submit', 'notify_on_decision', 'approval_steps', 'is_active']
    const payload: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) payload[key] = updates[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('workflow_configs')
      .update(payload as any)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[workflow-configs PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[workflow-configs PATCH] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
