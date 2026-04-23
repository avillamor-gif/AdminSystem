'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Eye, EyeOff, Fingerprint, AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

// ── Biometric helpers (WebAuthn + localStorage credential cache) ──────────────

const BIOMETRIC_KEY = 'biometric_email'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'
const BIO_PWD_KEY = 'bio_credential'

// Simple reversible obfuscation — NOT encryption, just prevents plaintext
// exposure in localStorage to casual snooping. The real security is WebAuthn.
function obfuscate(s: string): string {
  return btoa(s.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 97) ^ 42)).join(''))
}
function deobfuscate(s: string): string {
  try {
    const decoded = atob(s)
    return decoded.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 97) ^ 42)).join('')
  } catch { return '' }
}

async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Trigger the platform authenticator (fingerprint / face / pattern).
// Strategy:
//   1. Try credentials.get() with stored credential ID first (works after first registration)
//   2. If no passkey exists yet, register one with credentials.create() to enroll the device
//   3. After create() succeeds the passkey is saved — subsequent logins use get()
// This way the biometric prompt always appears and never shows "No passkeys available".

const PASSKEY_ID_KEY = 'bio_passkey_id'

function str2ab(str: string): ArrayBuffer {
  return Uint8Array.from(str, c => c.charCodeAt(0)).buffer
}

async function triggerBiometric(): Promise<boolean> {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const storedId = localStorage.getItem(PASSKEY_ID_KEY)

  // If we have a registered credential, use get() directly
  if (storedId) {
    try {
      const idBytes = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: 'required',
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: [{ type: 'public-key', id: idBytes }],
        },
      }) as PublicKeyCredential | null
      if (assertion) return true
    } catch {
      // Credential may have been cleared — fall through to re-register
      localStorage.removeItem(PASSKEY_ID_KEY)
    }
  }

  // No stored credential — register a new passkey to enroll the device biometric
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'IBON Admin', id: window.location.hostname },
        user: { id: str2ab('ibon-bio-user'), name: 'biometric', displayName: 'IBON Biometric' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null
    if (cred) {
      // Store the credential ID so future logins use get() instead of create()
      const idB64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)))
      localStorage.setItem(PASSKEY_ID_KEY, idB64)
      return true
    }
    return false
  } catch {
    return false
  }
}

function LoginContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [loading, setLoading] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioEmail, setBioEmail] = useState<string | null>(null)
  const [bioReady, setBioReady] = useState(false)  // true only when both email + password are cached
  const [showForm, setShowForm] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setHydrated(true)
    document.cookie = 'last_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    const error = searchParams.get('error')
    const reason = searchParams.get('reason')
    if (error === 'unauthorized') toast.error('You are not authorized. Contact your administrator.')
    if (reason === 'timeout') setTimedOut(true)

    // Check biometric availability
    isBiometricAvailable().then(available => {
      setBioAvailable(available)
      const saved = localStorage.getItem(BIOMETRIC_KEY)
      const pwdSaved = !!localStorage.getItem(BIO_PWD_KEY)
      const enabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) !== 'false'
      setBioEnabled(enabled)
      if (available && saved && enabled && pwdSaved) {
        setBioEmail(saved)
        setBioReady(true)
      } else {
        setShowForm(true)
      }
    })
  }, [searchParams])

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function doLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    try { await fetch('/api/sessions/create', { method: 'POST' }) } catch {}
    // Use hard redirect for reliability on mobile PWA — router.push can silently
    // fail if the session cookie hasn't propagated to the middleware yet
    window.location.href = redirectTo
  }

  async function handleBiometric() {
    if (!bioEmail) return
    setBioLoading(true)
    try {
      const verified = await triggerBiometric()
      if (!verified) { toast.error('Biometric verification failed'); return }
      // Biometric passed — we need a stored password. Prompt if not cached.
      const stored = localStorage.getItem(BIO_PWD_KEY)
      const pwd = stored ? deobfuscate(stored) : ''
      if (!pwd) {
        toast('Enter your password once to enable biometric login.', { icon: '🔒' })
        setShowForm(true)
        return
      }
      await doLogin(bioEmail, pwd)
      toast.success('Biometric login successful')
    } catch (err: any) {
      toast.error(err.message ?? 'Biometric login failed')
    } finally {
      setBioLoading(false)
    }
  }

  // After password login, cache pwd in sessionStorage for biometric use
  async function onSubmitWithBioCache(data: LoginForm) {
    setLoading(true)
    if (typeof window !== 'undefined') window.history.replaceState({}, '', '/login')
    try {
      await doLogin(data.email, data.password)
      if (bioAvailable && bioEnabled) {
        localStorage.setItem(BIOMETRIC_KEY, data.email)
        localStorage.setItem(BIO_PWD_KEY, obfuscate(data.password))
        setBioEmail(data.email)
        setBioReady(true)
      }
      toast.success('Logged in successfully')
    } catch (err: any) {
      toast.error(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })
      if (error) toast.error(error.message)
    } catch {
      toast.error('An error occurred with Google login')
    }
  }

  // Show biometric screen only when both email + password are cached and the form is hidden
  const showBiometricScreen = bioAvailable && bioReady && !!bioEmail && !showForm && bioEnabled

  return (
    <div className="min-h-screen flex">

      {/* ── Desktop: left orange branding panel ────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#ff7e15] via-[#e06a08] to-[#b85506] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl mx-auto mb-6 bg-white p-2">
            <Image src="/ibon-icon.png" alt="IBON" width={128} height={128} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">IBON International</h1>
          <p className="text-white/70 text-base tracking-wide uppercase">Admin System</p>
        </div>
      </div>

      {/* ── Desktop: right white form panel ────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 px-8 pt-8 pb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-400 text-sm mt-1">Enter your credentials to continue</p>
          </div>
          {timedOut && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Session expired</p>
                <p className="text-xs text-amber-700">Signed out after inactivity. Please sign in again.</p>
              </div>
              <button onClick={() => setTimedOut(false)} className="text-amber-400 hover:text-amber-600">
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmitWithBioCache)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" autoComplete="email" placeholder="you@iboninternational.org"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7e15] focus:border-transparent focus:bg-white transition-all"
                {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7e15] focus:border-transparent focus:bg-white transition-all"
                  {...register('password')} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <a href="#" className="text-xs text-[#ff7e15] font-medium hover:underline">Forgot password?</a>
            </div>
            <button type="submit" disabled={loading || !hydrated}
              className="w-full py-3.5 bg-[#ff7e15] text-white font-semibold rounded-xl hover:bg-[#e06a08] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ffc999] mt-2">
              {loading || !hydrated ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <button type="button" onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          <p className="text-center text-gray-300 text-xs mt-8">IBON International · Admin System v1.0</p>
        </div>
      </div>

      {/* ── Mobile: full-screen orange + white card ─────────────────── */}
      <div className="flex lg:hidden flex-col w-full bg-[#ff7e15] overflow-hidden min-h-screen">

        {/* Top orange section */}
        <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6 min-h-[38vh]">
          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-2xl mb-3 bg-white p-2">
            <Image src="/ibon-icon.png" alt="IBON" width={96} height={96} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IBON International</h1>
          <p className="text-white/70 text-sm mt-1 tracking-wide uppercase">Admin System</p>
        </div>

        {/* Bottom white card */}
        <div className="flex-1 bg-white rounded-t-3xl shadow-2xl px-6 pt-8 pb-10 w-full">

        {/* Session timeout banner */}
        {timedOut && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Session expired</p>
              <p className="text-xs text-amber-700">Signed out after inactivity. Please sign in again.</p>
            </div>
            <button onClick={() => setTimedOut(false)} className="text-amber-400 hover:text-amber-600">
              <EyeOff className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Biometric screen ── */}
        {showBiometricScreen ? (
          <div className="flex flex-col items-center text-center py-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Welcome back</p>
            <p className="text-xl font-bold text-gray-900 mb-1 truncate max-w-full">{bioEmail}</p>
            <p className="text-sm text-gray-400 mb-8">Use biometrics to sign in</p>

            <button
              onClick={handleBiometric}
              disabled={bioLoading}
              className="w-24 h-24 rounded-full bg-[#fff4ec] border-4 border-[#ffc999] flex items-center justify-center mb-3 hover:bg-[#ffe5cc] active:scale-95 transition-all disabled:opacity-50 shadow-lg"
            >
              {bioLoading
                ? <Loader2 className="w-10 h-10 text-[#ff7e15] animate-spin" />
                : <Fingerprint className="w-12 h-12 text-[#ff7e15]" />
              }
            </button>
            <p className="text-sm text-gray-500 mb-8">{bioLoading ? 'Verifying…' : 'Tap to authenticate'}</p>

            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-[#ff7e15] font-medium hover:underline"
            >
              Use password instead
            </button>
          </div>
        ) : (
          /* ── Password form ── */
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-400 text-sm mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmitWithBioCache)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@iboninternational.org"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7e15] focus:border-transparent focus:bg-white transition-all"
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7e15] focus:border-transparent focus:bg-white transition-all"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-xs text-[#ff7e15] font-medium hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading || !hydrated}
                className="w-full py-3.5 bg-[#ff7e15] text-white font-semibold rounded-xl hover:bg-[#e06a08] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ffc999] mt-2"
              >
                {loading || !hydrated
                  ? <Loader2 className="animate-spin h-5 w-5" />
                  : 'Sign In'
                }
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Alternative sign-in row */}
            <div className={`grid gap-3 ${bioAvailable && bioEmail ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Google */}
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              {/* Biometric — only shown if available and previously logged in */}
              {bioAvailable && bioEmail && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-[#ffc999] rounded-xl bg-[#fff4ec] text-[#ff7e15] text-sm font-medium hover:bg-[#ffe5cc] active:scale-[0.98] transition-all"
                >
                  <Fingerprint className="w-4 h-4" />
                  Biometrics
                </button>
              )}
            </div>
          </>
        )}

        <p className="text-center text-gray-300 text-xs mt-8">IBON International · Admin System v1.0</p>

        {/* Biometrics / Pattern toggle — only shown when platform supports it */}
        {bioAvailable && (
          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Biometrics / Pattern unlock</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !bioEnabled
                setBioEnabled(next)
                localStorage.setItem(BIOMETRIC_ENABLED_KEY, String(next))
                if (!next) {
                  localStorage.removeItem(BIOMETRIC_KEY)
                  localStorage.removeItem(BIO_PWD_KEY)
                  localStorage.removeItem(PASSKEY_ID_KEY)
                  sessionStorage.removeItem('bio_pwd')
                  setBioEmail(null)
                  setBioReady(false)
                  setShowForm(true)
                } else if (bioEmail) {
                  setShowForm(false)
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                bioEnabled ? 'bg-[#ff7e15]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                bioEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#ff7e15] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden">
          <Image src="/ibon-icon.png" alt="IBON" width={64} height={64} className="w-full h-full object-contain" />
        </div>
        <Loader2 className="animate-spin w-6 h-6 text-white/60" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
