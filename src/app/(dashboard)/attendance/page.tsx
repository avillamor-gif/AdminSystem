'use client'

import { Clock, LogIn, LogOut, Users } from 'lucide-react'
import { useAttendanceRecords, useClockIn, useClockOut, useCurrentEmployee, useCurrentUserPermissions } from '@/hooks'
import { Card, Button, Badge, Avatar } from '@/components/ui'
import { formatDate, formatTime } from '@/lib/utils'
import type { Tables } from '../../../lib/supabase'
import { useEffect, useState } from 'react'

type AttendanceRecord = Tables<'attendance_records'> & {
  employee?: Tables<'employees'>
}

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0]
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee()
  const { data: permissions, isLoading: isLoadingPermissions } = useCurrentUserPermissions()
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'my' | 'team'>('my')
  
  // Determine if user is manager/admin or regular employee
  const isManagerOrAdmin = permissions?.role_name?.toLowerCase() === 'manager' || 
                           permissions?.role_name?.toLowerCase() === 'admin'
  
  // For managers/admins in team view, show all records. In my view or for employees, show only their own.
  useEffect(() => {
    if (currentEmployee && !isLoadingPermissions) {
      if (isManagerOrAdmin && viewMode === 'team') {
        // Managers in team view see all records (no filter)
        setEmployeeFilter(undefined)
      } else {
        // My view or regular employees see only their own records
        setEmployeeFilter(currentEmployee.id)
      }
    }
  }, [currentEmployee, isManagerOrAdmin, isLoadingPermissions, viewMode])

  const { data: records = [], isLoading } = useAttendanceRecords({ 
    date: today,
    employeeId: employeeFilter 
  })
  
  const clockIn = useClockIn()
  const clockOut = useClockOut()

  // Type-safe records
  const typedRecords = records as AttendanceRecord[]

  // Find today's record for the current employee
  const todayRecord = typedRecords.find(r => r.employee_id === currentEmployee?.id)

  const handleClockIn = () => {
    if (currentEmployee?.id) {
      clockIn.mutate(currentEmployee.id)
    }
  }

  const handleClockOut = () => {
    if (todayRecord?.id) {
      clockOut.mutate(todayRecord.id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      present: 'success',
      late: 'warning',
      absent: 'danger',
      half_day: 'info',
      on_leave: 'info',
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  const stats = [
    { label: 'Present Today', value: typedRecords.filter((r) => r.status === 'present').length, icon: Clock, color: 'bg-green-50 text-green-600' },
    { label: 'Late', value: typedRecords.filter((r) => r.status === 'late').length, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Absent', value: typedRecords.filter((r) => r.status === 'absent').length, icon: Clock, color: 'bg-red-50 text-red-600' },
    { label: 'On Leave', value: typedRecords.filter((r) => r.status === 'on_leave').length, icon: Clock, color: 'bg-blue-50 text-blue-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'team' ? 'Team Attendance' : 'My Attendance'}
          </h1>
          <p className="text-gray-500 mt-1">
            {viewMode === 'team' ? 'Monitor your team\'s daily attendance' : 'Track your daily attendance'}
          </p>
        </div>
        <div className="flex gap-3">
          {isManagerOrAdmin && (
            <div className="flex gap-2 mr-4">
              <Button
                variant={viewMode === 'my' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('my')}
                size="sm"
              >
                <Clock className="w-4 h-4" />
                My Attendance
              </Button>
              <Button
                variant={viewMode === 'team' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('team')}
                size="sm"
              >
                <Users className="w-4 h-4" />
                Team Attendance
              </Button>
            </div>
          )}
          <Button 
            onClick={handleClockIn} 
            variant="secondary"
            disabled={isLoadingEmployee || !!todayRecord || clockIn.isPending}
          >
            <LogIn className="w-4 h-4" />
            {todayRecord ? 'Clocked In' : 'Clock In'}
          </Button>
          <Button 
            onClick={handleClockOut}
            disabled={isLoadingEmployee || !todayRecord || !!todayRecord?.clock_out || clockOut.isPending}
          >
            <LogOut className="w-4 h-4" />
            {todayRecord?.clock_out ? 'Clocked Out' : 'Clock Out'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Today's Attendance */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {viewMode === 'team' ? 'Team Attendance Records' : 'My Attendance Records'} - {formatDate(today)}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {viewMode === 'team' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading || isLoadingEmployee || isLoadingPermissions ? (
                <tr>
                  <td colSpan={viewMode === 'team' ? 5 : 4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : typedRecords.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'team' ? 5 : 4} className="px-6 py-12 text-center text-gray-500">
                    {viewMode === 'team'
                      ? 'No team attendance records for today yet.'
                      : 'No attendance records yet. Click "Clock In" to start tracking your time.'
                    }
                  </td>
                </tr>
              ) : (
                typedRecords.map((record) => {
                  const employee = record.employee
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      {viewMode === 'team' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={employee?.avatar_url}
                              firstName={employee?.first_name || 'U'}
                              lastName={employee?.last_name || ''}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {employee?.first_name} {employee?.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.clock_in ? formatTime(record.clock_in) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.clock_out ? formatTime(record.clock_out) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status ?? '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
