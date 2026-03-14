import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/mobile-capture/barcode
// Body: { session, barcode }
// Broadcasts barcode value via Realtime so desktop can fill in serial / asset tag
export async function POST(req: NextRequest) {
  try {
    const { session, barcode } = await req.json()

    if (!session || !barcode) {
      return NextResponse.json({ error: 'Missing session or barcode' }, { status: 400 })
    }

    const supabase = createAdminClient()

    await supabase
      .channel(`mobile-capture-${session}`)
      .send({
        type: 'broadcast',
        event: 'barcode',
        payload: { barcode },
      })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[mobile-capture/barcode]', err)
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 })
  }
}
