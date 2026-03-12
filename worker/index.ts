// Custom service worker additions — merged by next-pwa into sw.js
// Handles incoming Web Push notifications and notification click events.

declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let data: { title?: string; body?: string; url?: string; icon?: string } = {}
  try { data = event.data.json() } catch { data = { title: 'IBON Admin', body: event.data.text() } }

  const title = data.title ?? 'IBON Admin'
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: data.icon ?? '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    (self.clients as any).matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if ((self.clients as any).openWindow) return (self.clients as any).openWindow(url)
    })
  )
})
