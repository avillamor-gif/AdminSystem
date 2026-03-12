// Appends push notification handler to the next-pwa generated sw.js
const fs = require('fs')
const path = require('path')

const swPath = path.join(__dirname, '../public/sw.js')

if (!fs.existsSync(swPath)) {
  console.error('sw.js not found at', swPath)
  process.exit(1)
}

const pushHandler = `

// ---- Push Notification Handler (appended by scripts/append-sw-push.js) ----
self.addEventListener('push', function (event) {
  if (!event.data) return
  var data = {}
  try { data = event.data.json() } catch (e) { data = { title: 'IBON Admin', body: event.data.text() } }
  var title = data.title || 'IBON Admin'
  var options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url || '/' },
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var url = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
`

const existing = fs.readFileSync(swPath, 'utf8')
if (existing.includes('push notification handler')) {
  console.log('Push handler already in sw.js, skipping.')
} else {
  fs.appendFileSync(swPath, pushHandler)
  console.log('✅ Push handler appended to sw.js')
}
