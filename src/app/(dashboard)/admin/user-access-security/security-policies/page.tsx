'use client'

import { Card } from '@/components/ui'
import { Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react'

export default function SecurityPoliciesPage() {
  const securityPolicies = [
    {
      id: 1,
      title: 'Login Attempt Limit',
      description: 'Maximum failed login attempts before account lockout',
      value: '5 attempts',
      status: 'active',
      icon: Lock,
    },
    {
      id: 2,
      title: 'Account Lockout Duration',
      description: 'Time period for account lockout after failed attempts',
      value: '30 minutes',
      status: 'active',
      icon: AlertTriangle,
    },
    {
      id: 3,
      title: 'Session Timeout',
      description: 'Automatic logout after period of inactivity',
      value: '60 minutes',
      status: 'active',
      icon: Shield,
    },
    {
      id: 4,
      title: 'IP Whitelist',
      description: 'Restrict access to specific IP addresses',
      value: 'Disabled',
      status: 'inactive',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Policies</h1>
        <p className="text-gray-600 mt-1">
          Configure system-wide security policies and access controls
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPolicies.map((policy) => {
          const Icon = policy.icon
          return (
            <Card key={policy.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  policy.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    policy.status === 'active' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{policy.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      policy.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {policy.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                  <p className="text-sm font-medium text-gray-900">Current: {policy.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
