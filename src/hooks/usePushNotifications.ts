'use client'

import { useState, useEffect, useCallback } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

/**
 * Wait for any active service worker on scope '/'.
 * Uses navigator.serviceWorker.ready which resolves as soon as there is an
 * active+controlling SW — works correctly with skipWaiting because after
 * skipWaiting the new SW calls clients.claim() and ready resolves immediately.
 * We add a hard 30s timeout so it never hangs forever.
 */
function waitForActiveSW(_reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('SW activation timed out after 30s. Close all tabs of this app and try again.'))
    }, 30000)

    // navigator.serviceWorker.ready resolves with the active registration
    // once skipWaiting + clients.claim() complete — this is the correct API
    navigator.serviceWorker.ready.then((activeReg) => {
      clearTimeout(timeout)
      resolve(activeReg)
    }).catch((err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  useEffect(() => {
    if (!isSupported) { setPermission('unsupported'); return }
    setPermission(Notification.permission as PushPermission)
    navigator.serviceWorker.getRegistration('/').then((reg) => {
      if (reg) reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    })
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported) { alert('❌ Push not supported on this browser/device'); return }
    setIsLoading(true)
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { alert('❌ VAPID key missing — check Vercel env vars'); return }

      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') { alert('⚠️ Permission not granted: ' + perm); return }

      // Get existing registration — next-pwa registers sw.js at scope '/'
      let reg = await navigator.serviceWorker.getRegistration('/')
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      }

      alert(`SW state — active: ${!!reg.active}  installing: ${!!reg.installing}  waiting: ${!!reg.waiting} — waiting for ready...`)

      // Wait for the SW to be fully active (handles skipWaiting + clientsClaim)
      const activeReg = await waitForActiveSW(reg)

      alert('✓ SW active! Subscribing to push...')
      const sub = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert('❌ Subscribe failed: ' + (data.error ?? res.status))
      } else {
        alert('✅ Subscribed! You will now receive push notifications on this device.')
        setIsSubscribed(true)
      }
    } catch (err) {
      alert('❌ Subscribe error: ' + String(err))
      console.error('Push subscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
