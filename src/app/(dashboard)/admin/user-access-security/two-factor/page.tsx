'use client'

import { Card, Button, Badge } from '@/components/ui'
import { Smartphone, Mail, Shield, CheckCircle, XCircle } from 'lucide-react'

export default function TwoFactorAuthPage() {
  const twoFactorMethods = [
    {
      id: 1,
      name: 'Authenticator App',
      description: 'Use apps like Google Authenticator or Authy',
      icon: Smartphone,
      status: 'enabled',
      users: 45,
    },
    {
      id: 2,
      name: 'Email Verification',
      description: 'Receive verification codes via email',
      icon: Mail,
      status: 'enabled',
      users: 32,
    },
    {
      id: 3,
      name: 'SMS Verification',
      description: 'Receive verification codes via SMS',
      icon: Shield,
      status: 'disabled',
      users: 0,
    },
  ]

  const userStats = [
    {
      label: '2FA Enabled',
      value: '68%',
      count: '45/66',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
    },
    {
      label: '2FA Disabled',
      value: '32%',
      count: '21/66',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-gray-600 mt-1">
            Configure and manage two-factor authentication settings
          </p>
        </div>
        <Button>Configure Settings</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.count} users</p>
                </div>
                <div className={`w-16 h-16 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {twoFactorMethods.map((method) => {
            const Icon = method.icon
            return (
              <Card key={method.id} className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                    method.status === 'enabled' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      method.status === 'enabled' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{method.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={method.status === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {method.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{method.users} users</span>
                  </div>
                  <Button 
                    variant={method.status === 'enabled' ? 'secondary' : 'primary'}
                    className="w-full"
                  >
                    {method.status === 'enabled' ? 'Configure' : 'Enable'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Security Recommendations</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Enforce 2FA for all administrators</p>
              <p className="text-sm text-gray-600">Require two-factor authentication for users with admin privileges</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Use authenticator apps over SMS</p>
              <p className="text-sm text-gray-600">Authenticator apps are more secure than SMS-based verification</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Provide backup codes</p>
              <p className="text-sm text-gray-600">Ensure users have backup codes in case they lose access to their 2FA device</p>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  )
}
