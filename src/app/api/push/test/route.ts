import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check subscriptions first for better diagnostics
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions' as any)
    .select('id, endpoint')
    .eq('user_id', user.id)

  console.log('[push/test] userId:', user.id, 'subs found:', subs?.length ?? 0)
  if (subs && subs.length > 0) {
    subs.forEach((s: any, i: number) => console.log(`  sub[${i}] id=${s.id} endpoint=...${s.endpoint.slice(-30)}`))
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'No subscriptions found for your account. Subscribe from your phone or another browser by clicking the 🔔 bell icon first.',
      userId: user.id,
    })
  }

  await sendPushToUsers([user.id], {
    title: '🔔 IBON Admin',
    body: 'Push notifications are working!',
    url: '/',
  })

  return NextResponse.json({ ok: true, subscriptionsFound: subs.length })
}
