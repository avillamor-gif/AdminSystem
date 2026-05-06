'use client'

import { useState } from 'react'
import { UserPlus, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'

export default function CreateAccountPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus]     = useState<{ ok: boolean; message: string } | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/create-employee-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()

      if (!res.ok) {
        setStatus({ ok: false, message: result.error ?? 'Something went wrong' })
        return
      }

      setStatus({
        ok: true,
        message: `Account created for ${result.details?.employee_name ?? email}. A welcome email with login instructions has been sent.`,
      })
      setEmail('')
      setPassword('')
    } catch (err) {
      setStatus({ ok: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Login Account</h1>
        <p className="text-gray-600 mt-1">Create a system login account for an existing employee and send them their credentials via email.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-orange-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">New Login Account</h2>
              <p className="text-xs text-gray-500">Employee must already exist in the HR database</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Work Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="employee@iboninternational.org"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Must match the employee's <code className="bg-gray-100 px-1 rounded">work_email</code> in the database</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Set a temporary password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">The employee will be prompted to change this on first login</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating account…' : 'Create Account & Send Welcome Email'}
            </Button>
          </form>

          {status && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${
              status.ok
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {status.ok ? '✅ ' : '❌ '}{status.message}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Important Notes</h3>
          </div>
          <ul className="space-y-3 text-sm text-amber-800">
            <li className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0">•</span>
              The employee must already be added to the HR system with a <strong>work email</strong> before creating a login account.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0">•</span>
              A <strong>Welcome Email</strong> is automatically sent with the login email and temporary password.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0">•</span>
              If the employee uses a <strong>@iboninternational.org</strong> email, a Google Workspace account will also be created automatically.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0">•</span>
              If an account already exists for the email, the request is safely ignored — no duplicate is created.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex-shrink-0">•</span>
              <strong>Share the temporary password securely</strong> — do not send it over chat. The welcome email already includes it.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
