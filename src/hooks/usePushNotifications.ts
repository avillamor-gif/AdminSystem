'use client'

import { useState, useEffect, useCallback } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

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

    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    )
  }, [isSupported])

  const subscribe = useCallback(async () => {
    // Debug: show support status regardless
    const swSupported = 'serviceWorker' in navigator
    const pmSupported = 'PushManager' in window
    const notifSupported = 'Notification' in window
    if (!swSupported || !pmSupported || !notifSupported) {
      alert(`❌ Not supported:\n- ServiceWorker: ${swSupported}\n- PushManager: ${pmSupported}\n- Notification: ${notifSupported}`)
      return
    }
    if (!isSupported) { alert('❌ Push not supported on this browser/device'); return }
    setIsLoading(true)
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { alert('❌ VAPID key missing — check Vercel env vars'); return }

      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') { alert('⚠️ Permission not granted: ' + perm); return }

      // Unregister any broken/stale service workers first
      const existingRegs = await navigator.serviceWorker.getRegistrations()
      alert('Found ' + existingRegs.length + ' SW registration(s). Cleaning up...')
      for (const reg of existingRegs) {
        await reg.unregister()
      }

      // Re-register the service worker
      alert('Re-registering sw.js...')
      const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      alert('Registered! State: ' + (newReg.active?.state ?? newReg.installing?.state ?? newReg.waiting?.state ?? 'unknown') + '. Waiting for activation...')

      // Wait for it to become active
      const activeReg = await new Promise<ServiceWorkerRegistration>((resolve, reject) => {
        if (newReg.active) { resolve(newReg); return }
        const sw = newReg.installing ?? newReg.waiting
        if (!sw) { reject(new Error('No SW installing or waiting')); return }
        sw.addEventListener('statechange', function handler() {
          if (sw.state === 'activated') { sw.removeEventListener('statechange', handler); resolve(newReg) }
          if (sw.state === 'redundant') { sw.removeEventListener('statechange', handler); reject(new Error('SW became redundant')) }
        })
        setTimeout(() => reject(new Error('SW activation timed out')), 15000)
      })

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
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
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
