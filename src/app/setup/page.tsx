'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'

export default function SetupPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  async function createAdminUser() {
    setLoading(true)
    setStatus('Creating admin user via Admin API...')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setStatus(`Error: ${result.error}`)
        return
      }

      setStatus(`Success! ${result.message}`)
    } catch (error) {
      setStatus(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function setupUserRoles() {
    setRoleLoading(true)
    setStatus('Setting up user roles...')

    try {
      const response = await fetch('/api/setup-role', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setStatus(`Error: ${result.error}`)
        return
      }

      setStatus(`Success! ${result.message}\n${JSON.stringify(result.results, null, 2)}`)
    } catch (error) {
      setStatus(`Error: ${error}`)
    } finally {
      setRoleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Setup Admin User</h1>
        
        <p className="text-gray-600 mb-4 text-sm">
          Click the button below to create the default admin user for the HRM system.
        </p>

        <div className="space-y-3">
          <Button onClick={createAdminUser} className="w-full" loading={loading}>
            1. Create Admin User
          </Button>

          <Button onClick={setupUserRoles} className="w-full" variant="outline" loading={roleLoading}>
            2. Setup User Roles (Required for RLS)
          </Button>
        </div>

        {status && (
          <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap font-mono text-xs">
            {status}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This will create:</p>
          <p className="font-mono text-xs mt-1">aviilamor@iboninternational.org / password123</p>
        </div>
      </Card>
    </div>
  )
}
