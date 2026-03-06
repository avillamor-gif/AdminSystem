'use client'

import { useState } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Monitor, Smartphone, Tablet, MapPin, Clock, RefreshCw, Loader2 } from 'lucide-react'
import { useActiveSessions, useTerminateSession, useTerminateAllUserSessions } from '@/hooks/useSessions'
import { formatDistanceToNow } from 'date-fns'

function getDeviceIcon(deviceType: string | null) {
  if (!deviceType) return Monitor
  const d = deviceType.toLowerCase()
  if (d.includes('mobile') || d.includes('phone')) return Smartphone
  if (d.includes('tablet')) return Tablet
  return Monitor
}

export default function SessionManagementPage() {
  const { data: sessions = [], isLoading, refetch, isFetching } = useActiveSessions()
  const terminateMutation = useTerminateSession()
  const terminateAllMutation = useTerminateAllUserSessions()

  const [confirmTerminate, setConfirmTerminate] = useState<string | null>(null)
  const [confirmTerminateAll, setConfirmTerminateAll] = useState(false)

  const activeSessions = sessions.filter(s => s.is_active)
  const idleSessions = sessions.filter(s => {
    const diffMins = (Date.now() - new Date(s.last_activity_at).getTime()) / 1000 / 60
    return diffMins > 15
  })
  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage active user sessions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setConfirmTerminateAll(true)}
            disabled={terminateAllMutation.isPending || sessions.length === 0}
          >
            Terminate All Sessions
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            {isFetching
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : activeSessions.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Idle Sessions (&gt;15 min)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : idleSessions.length}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '—' : uniqueUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No active sessions found</div>
          ) : (
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
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.device_type)
                  const lastActivity = new Date(session.last_activity_at)
                  const isIdle = (Date.now() - lastActivity.getTime()) / 1000 / 60 > 15

                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{session.user_email}</div>
                        <div className="text-sm text-gray-500">{session.ip_address || 'Unknown IP'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">{session.device_type || 'Desktop'}</div>
                            <div className="text-xs text-gray-500 max-w-[160px] truncate">
                              {session.user_agent || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          {session.location || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(session.started_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(lastActivity, { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={isIdle ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {isIdle ? 'idle' : 'active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={terminateMutation.isPending && confirmTerminate === session.id}
                          onClick={() => setConfirmTerminate(session.id)}
                        >
                          Terminate
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Confirm terminate single session */}
      <ConfirmModal
        isOpen={!!confirmTerminate}
        onClose={() => setConfirmTerminate(null)}
        onConfirm={async () => {
          if (confirmTerminate) {
            await terminateMutation.mutateAsync(confirmTerminate)
            setConfirmTerminate(null)
          }
        }}
        title="Terminate Session"
        message="Are you sure you want to terminate this session? The user will be logged out immediately."
        confirmText="Terminate"
        variant="danger"
      />

      {/* Confirm terminate all sessions */}
      <ConfirmModal
        isOpen={confirmTerminateAll}
        onClose={() => setConfirmTerminateAll(false)}
        onConfirm={async () => {
          const uniqueUserIds = [...new Set(sessions.map(s => s.user_id))]
          for (const userId of uniqueUserIds) {
            await terminateAllMutation.mutateAsync(userId)
          }
          setConfirmTerminateAll(false)
        }}
        title="Terminate All Sessions"
        message={`This will log out all ${sessions.length} active session(s) across ${uniqueUsers} user(s). Are you sure?`}
        confirmText="Terminate All"
        variant="danger"
      />
    </div>
  )
}
