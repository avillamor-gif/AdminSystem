'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Keep these in sync with middleware.ts
const TIMEOUT_MS = 24 * 60 * 1000       // 24 minutes total
const WARNING_MS = 20 * 60 * 1000       // warn at 20 minutes (4 min left)
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const

// Cookie helper (client-side, so not httpOnly — mirrors the httpOnly one in middleware)
// We write a non-httpOnly cookie that JS can reset on activity; middleware reads its own httpOnly copy.
const LAST_ACTIVE_COOKIE = 'last_active'

function stampLastActive() {
  const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString()
  document.cookie = `${LAST_ACTIVE_COOKIE}=${Date.now()}; path=/; SameSite=Lax; expires=${expires}`
}

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(4 * 60) // seconds remaining shown in modal
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const signOutAndRedirect = useCallback(async () => {
    clearAllTimers()
    setShowWarning(false)
    await supabase.auth.signOut()
    router.push('/login?reason=timeout')
    router.refresh()
  }, [supabase, router, clearAllTimers])

  const resetTimers = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    stampLastActive()

    // Warning fires at 20 minutes
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(4 * 60)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, WARNING_MS)

    // Hard logout at 24 minutes
    timerRef.current = setTimeout(() => {
      signOutAndRedirect()
    }, TIMEOUT_MS)
  }, [clearAllTimers, signOutAndRedirect])

  // Start timers on mount, bind activity listeners
  useEffect(() => {
    stampLastActive()
    resetTimers()

    const handleActivity = () => {
      // Only reset if warning isn't showing — once the warning appears the
      // user must explicitly click "Stay signed in"
      if (!showWarning) {
        resetTimers()
      }
    }

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))
    return () => {
      clearAllTimers()
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStaySignedIn = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <>
      {children}

      {/* Inactivity warning modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Modal */}
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <h2 className="mb-1 text-center text-lg font-semibold text-gray-900">
              Session expiring soon
            </h2>
            <p className="mb-5 text-center text-sm text-gray-500">
              You've been inactive. Your session will automatically end in:
            </p>

            {/* Countdown */}
            <div className="mb-6 text-center">
              <span className="text-4xl font-bold tabular-nums text-orange-500">
                {formatCountdown(countdown)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={signOutAndRedirect}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Sign out
              </button>
              <button
                onClick={handleStaySignedIn}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
