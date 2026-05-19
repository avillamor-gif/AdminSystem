import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TABLES = [
  'asset_categories', 'asset_brands', 'asset_vendors', 'asset_locations',
  'assets', 'asset_maintenance', 'asset_requests', 'asset_assignments',
] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

export async function POST(req: NextRequest) {
  return handleWrite(req, 'insert')
}

export async function PATCH(req: NextRequest) {
  return handleWrite(req, 'update')
}

export async function DELETE(req: NextRequest) {
  return handleWrite(req, 'delete')
}

async function handleWrite(req: NextRequest, operation: 'insert' | 'update' | 'delete') {
  try {
    const supabaseServer = createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: roleRows } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const hasAccess = (roleRows ?? []).some((r: any) => ['admin', 'hr', 'ed'].includes(r.role))
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { table, id, data } = body

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    if (operation === 'insert') {
      const { data: row, error } = await admin
        .from(table as AllowedTable)
        .insert(data)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(row)
    }

    if (operation === 'update') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const { data: row, error } = await admin
        .from(table as AllowedTable)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(row)
    }

    if (operation === 'delete') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const { error } = await admin
        .from(table as AllowedTable)
        .delete()
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
