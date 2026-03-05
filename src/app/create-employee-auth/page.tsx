'use client'

import { useState } from 'react'
import { Button, Card, Input } from '@/components/ui'

export default function CreateEmployeeAuthPage() {
  const [email, setEmail] = useState('mjmalaki@iboninternational.org')
  const [password, setPassword] = useState('employee123')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function createEmployeeAuth() {
    if (!email || !password) {
      setStatus('Please enter both email and password')
      return
    }

    setLoading(true)
    setStatus('Creating employee auth account...')

    try {
      const response = await fetch('/api/create-employee-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setStatus(`Error: ${result.error}`)
        return
      }

      setStatus(`✅ Success!\n\nYou can now login with:\nEmail: ${result.details.email}\nPassword: ${password}\n\nEmployee: ${result.details.employee_name}\nEmployee ID: ${result.details.employee_id}`)
    } catch (error) {
      setStatus(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Create Employee Auth Account</h1>
        
        <p className="text-gray-600 mb-4 text-sm">
          Add authentication (login credentials) for an existing employee in the database.
        </p>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@iboninternational.org"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must match an existing employee's work_email in the database
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Employee will use this to login
            </p>
          </div>
        </div>

        <Button onClick={createEmployeeAuth} className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Auth Account'}
        </Button>

        {status && (
          <div className={`mt-4 p-3 rounded whitespace-pre-wrap text-sm ${
            status.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-gray-100'
          }`}>
            {status}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">Quick Setup:</h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter the employee's work email from your database</li>
            <li>Set a password they'll use to login</li>
            <li>Click "Create Auth Account"</li>
            <li>The employee can now login at <code className="bg-blue-100 px-1 rounded">/login</code></li>
          </ol>
        </div>

        <div className="mt-4">
          <a 
            href="/" 
            className="text-sm text-orange-600 hover:text-orange-700 block text-center"
          >
            ← Back to Home
          </a>
        </div>
      </Card>
    </div>
  )
}
