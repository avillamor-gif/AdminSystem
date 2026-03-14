// Plain service worker — handles Web Push only.
// No Workbox, no precaching, nothing that can go stale between deployments.

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', function (event) {
  if (!event.data) return
  var data = {}
  try { data = event.data.json() } catch (e) { data = { title: 'IBON Admin', body: event.data.text() } }

  // Set app icon badge — use count from payload if provided, otherwise 1
  if ('setAppBadge' in self.registration) {
    var badgeCount = (data.badge_count && typeof data.badge_count === 'number') ? data.badge_count : 1
    self.registration.setAppBadge(badgeCount).catch(function () {})
  }

  // tag: collapses duplicate notifications (same tag = replace, not stack)
  // requireInteraction: keeps notification visible until user taps it
  // — both are key to avoiding Chrome's spam detection on mobile
  var tag = data.tag || (data.title || 'ibon').toLowerCase().replace(/\s+/g, '-')
  event.waitUntil(
    self.registration.showNotification(data.title || 'IBON Admin', {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: tag,
      renotify: false,
      requireInteraction: true,
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  // Clear the app icon badge when user taps the notification
  if ('clearAppBadge' in self.registration) {
    self.registration.clearAppBadge().catch(function () {})
  }

  var url = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(self.location.origin) !== -1 && 'focus' in list[i]) {
          list[i].navigate(url)
          return list[i].focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
