'use client'

import { Card, Button, Badge } from '@/components/ui'
import { Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function PasswordPoliciesPage() {
  const passwordRules = [
    {
      id: 1,
      rule: 'Minimum Length',
      description: 'Minimum number of characters required',
      currentValue: '8 characters',
      status: 'active',
      icon: CheckCircle,
    },
    {
      id: 2,
      rule: 'Uppercase Letters',
      description: 'Require at least one uppercase letter',
      currentValue: 'Required',
      status: 'active',
      icon: CheckCircle,
    },
    {
      id: 3,
      rule: 'Lowercase Letters',
      description: 'Require at least one lowercase letter',
      currentValue: 'Required',
      status: 'active',
      icon: CheckCircle,
    },
    {
      id: 4,
      rule: 'Numbers',
      description: 'Require at least one number',
      currentValue: 'Required',
      status: 'active',
      icon: CheckCircle,
    },
    {
      id: 5,
      rule: 'Special Characters',
      description: 'Require at least one special character (!@#$%^&*)',
      currentValue: 'Optional',
      status: 'inactive',
      icon: XCircle,
    },
    {
      id: 6,
      rule: 'Password Expiry',
      description: 'Force password change after specified days',
      currentValue: '90 days',
      status: 'active',
      icon: AlertTriangle,
    },
    {
      id: 7,
      rule: 'Password History',
      description: 'Prevent reuse of previous passwords',
      currentValue: 'Last 5 passwords',
      status: 'active',
      icon: CheckCircle,
    },
    {
      id: 8,
      rule: 'Account Lockout',
      description: 'Lock account after failed attempts',
      currentValue: '5 attempts',
      status: 'active',
      icon: Lock,
    },
  ]

  const securityMetrics = [
    {
      label: 'Strong Passwords',
      value: '85%',
      count: '56/66 users',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Weak Passwords',
      value: '15%',
      count: '10/66 users',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Expiring Soon',
      value: '12',
      count: 'In next 7 days',
      color: 'text-orange',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Password Policies</h1>
          <p className="text-gray-600 mt-1">
            Configure password requirements and security rules
          </p>
        </div>
        <Button>Update Policies</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {securityMetrics.map((metric) => (
          <Card key={metric.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                <p className="text-sm text-gray-500 mt-1">{metric.count}</p>
              </div>
              <div className={`w-16 h-16 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                <Lock className={`w-8 h-8 ${metric.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Password Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passwordRules.map((rule) => {
            const Icon = rule.icon
            return (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    rule.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      rule.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{rule.rule}</h3>
                      <Badge className={rule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {rule.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <p className="text-sm font-medium text-gray-900">Current: {rule.currentValue}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Password Strength Guidelines</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Strong Password Example</span>
              <Badge className="bg-green-100 text-green-800">Recommended</Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-900">
              MyP@ssw0rd2024!Secure
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Weak Password Example</span>
              <Badge className="bg-red-100 text-red-800">Avoid</Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-900 line-through">
              password123
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
