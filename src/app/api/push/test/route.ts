import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await sendPushToUsers([user.id], {
    title: '🔔 IBON Admin',
    body: 'Push notifications are working!',
    url: '/',
  })

  return NextResponse.json({ ok: true })
}
