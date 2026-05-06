import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('general_settings')
      .update({ value, updated_at: new Date().toISOString() } as never)
      .eq('key', key)

    if (error) {
      console.error('[general-settings PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
