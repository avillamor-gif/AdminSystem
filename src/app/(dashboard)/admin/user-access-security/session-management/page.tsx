'use client'

import { Card, Badge, Button } from '@/components/ui'
import { Monitor, Smartphone, Tablet, MapPin, Clock } from 'lucide-react'

export default function SessionManagementPage() {
  const activeSessions = [
    {
      id: 1,
      user: 'John Doe',
      device: 'Desktop',
      deviceIcon: Monitor,
      browser: 'Chrome 120.0',
      location: 'New York, USA',
      ipAddress: '192.168.1.100',
      loginTime: '2024-02-26 09:30 AM',
      lastActivity: '2 minutes ago',
      status: 'active',
    },
    {
      id: 2,
      user: 'Jane Smith',
      device: 'Mobile',
      deviceIcon: Smartphone,
      browser: 'Safari Mobile',
      location: 'London, UK',
      ipAddress: '192.168.1.105',
      loginTime: '2024-02-26 08:15 AM',
      lastActivity: '15 minutes ago',
      status: 'active',
    },
    {
      id: 3,
      user: 'Mike Johnson',
      device: 'Tablet',
      deviceIcon: Tablet,
      browser: 'Edge 120.0',
      location: 'Tokyo, Japan',
      ipAddress: '192.168.1.110',
      loginTime: '2024-02-26 07:45 AM',
      lastActivity: '1 hour ago',
      status: 'idle',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage active user sessions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Terminate All Sessions</Button>
          <Button>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Idle Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">18</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeSessions.map((session) => {
                const DeviceIcon = session.deviceIcon
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{session.user}</div>
                      <div className="text-sm text-gray-500">{session.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900">{session.device}</div>
                          <div className="text-xs text-gray-500">{session.browser}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {session.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{session.loginTime}</div>
                      <div className="text-xs text-gray-500">{session.lastActivity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {session.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="danger" size="sm">
                        Terminate
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
