'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Clock, CheckCircle, Calendar } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useWorkSchedules, useDeleteWorkSchedule, useSetDefaultWorkSchedule } from '@/hooks/useTimeAttendance'
import { WorkScheduleFormModal } from '../components/WorkScheduleFormModal'
import type { WorkSchedule } from '@/services/timeAttendance.service'

export default function WorkSchedulesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null)

  const { data: schedules = [], isLoading } = useWorkSchedules({ 
    search: searchQuery,
    schedule_type: scheduleTypeFilter || undefined,
    is_active: true,
  })
  const deleteMutation = useDeleteWorkSchedule()
  const setDefaultMutation = useSetDefaultWorkSchedule()

  const handleEdit = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work schedule?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedSchedule(null)
  }

  const stats = {
    total: schedules.length,
    fixed: schedules.filter(s => s.schedule_type === 'fixed').length,
    flexible: schedules.filter(s => s.schedule_type === 'flexible').length,
    default: schedules.find(s => s.is_default)?.schedule_name || 'None',
  }

  const getScheduleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fixed: 'bg-blue-100 text-blue-700',
      flexible: 'bg-green-100 text-green-700',
      rotating: 'bg-purple-100 text-purple-700',
      compressed: 'bg-orange-100 text-orange-700',
      custom: 'bg-gray-100 text-gray-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Schedules</h1>
          <p className="text-gray-600 mt-1">
            Define and manage employee work schedules and working hours
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Schedules</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Fixed Schedules</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.fixed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Flexible Schedules</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.flexible}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Default Schedule</div>
          <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{stats.default}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <select
              value={scheduleTypeFilter}
              onChange={(e) => setScheduleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Types</option>
              <option value="fixed">Fixed</option>
              <option value="flexible">Flexible</option>
              <option value="rotating">Rotating</option>
              <option value="compressed">Compressed</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Schedules Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weekly Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules.map((schedule) => {
                const workDays = Array.isArray(schedule.work_days) ? schedule.work_days : []
                return (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{schedule.schedule_name}</div>
                        <div className="text-sm text-gray-500">{schedule.schedule_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getScheduleTypeColor(schedule.schedule_type)}>
                        {schedule.schedule_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{Number(schedule.weekly_hours).toFixed(1)} hrs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{workDays.length} days</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {schedule.is_default && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {schedule.is_active && (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!schedule.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(schedule.id)}
                            disabled={setDefaultMutation.isPending}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deleteMutation.isPending || schedule.is_default}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <WorkScheduleFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        schedule={selectedSchedule}
      />
    </div>
  )
}
