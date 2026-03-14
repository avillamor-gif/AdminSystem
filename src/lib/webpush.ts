import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO ?? 'mailto:admin@iboninternational.org',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
}

/**
 * Send a push notification to all subscribed devices for the given user IDs.
 * Fire-and-forget — stale/expired subscriptions are removed automatically.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  if (userIds.length === 0) return

  console.log(`[webpush] sendPushToUsers — users: [${userIds.join(', ')}] title: "${payload.title}"`)

  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions' as any)
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) {
    console.log('[webpush] no subscriptions found, skipping')
    return
  }

  // Deduplicate by endpoint — safety guard against duplicate rows in DB
  const seen = new Set<string>()
  const uniqueSubs = (subs as any[]).filter((s) => {
    if (seen.has(s.endpoint)) return false
    seen.add(s.endpoint)
    return true
  })
  console.log(`[webpush] sending to ${uniqueSubs.length} unique endpoint(s)`)

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    icon: payload.icon ?? '/icons/icon-192x192.png',
    tag: payload.tag ?? 'ibon-admin',
  })

  const staleIds: string[] = []

  await Promise.allSettled(
    uniqueSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        )
      } catch (err: any) {
        // 410 Gone or 404 = subscription expired, clean it up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          staleIds.push(sub.id)
        }
      }
    })
  )

  if (staleIds.length > 0) {
    await admin.from('push_subscriptions' as any).delete().in('id', staleIds)
  }
}
