'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Clock, Sun, Moon, Sunset } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useShiftPatterns, useDeleteShiftPattern } from '@/hooks/useTimeAttendance'
import { ShiftPatternFormModal } from '../components/ShiftPatternFormModal'
import type { ShiftPattern } from '@/services/timeAttendance.service'

export default function ShiftPatternsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [shiftTypeFilter, setShiftTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<ShiftPattern | null>(null)

  const { data: shifts = [], isLoading } = useShiftPatterns({ 
    search: searchQuery,
    shift_type: shiftTypeFilter || undefined,
    is_active: true,
  })
  const deleteMutation = useDeleteShiftPattern()

  const handleEdit = (shift: ShiftPattern) => {
    setSelectedShift(shift)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift pattern?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedShift(null)
  }

  const stats = {
    total: shifts.length,
    morning: shifts.filter(s => s.shift_type === 'morning').length,
    evening: shifts.filter(s => s.shift_type === 'evening').length,
    night: shifts.filter(s => s.shift_type === 'night').length,
  }

  const getShiftTypeIcon = (type: string) => {
    switch (type) {
      case 'morning': return <Sun className="w-4 h-4 text-yellow-500" />
      case 'evening': return <Sunset className="w-4 h-4 text-orange-500" />
      case 'night': return <Moon className="w-4 h-4 text-indigo-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getShiftTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      morning: 'bg-yellow-100 text-yellow-700',
      afternoon: 'bg-orange-100 text-orange-700',
      evening: 'bg-purple-100 text-purple-700',
      night: 'bg-indigo-100 text-indigo-700',
      rotating: 'bg-blue-100 text-blue-700',
      split: 'bg-pink-100 text-pink-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Patterns</h1>
          <p className="text-gray-600 mt-1">
            Configure shift patterns and schedules for your organization
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Shift Pattern
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Shifts</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <div className="text-sm text-gray-600">Morning Shifts</div>
          </div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.morning}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Sunset className="w-5 h-5 text-orange-500" />
            <div className="text-sm text-gray-600">Evening Shifts</div>
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.evening}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            <div className="text-sm text-gray-600">Night Shifts</div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.night}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search shifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <select
              value={shiftTypeFilter}
              onChange={(e) => setShiftTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Shift Types</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="rotating">Rotating</option>
              <option value="split">Split</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <Card key={shift.id} className="p-6 hover:shadow-lg transition-shadow" style={{ borderLeft: `4px solid ${shift.color_code}` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {getShiftTypeIcon(shift.shift_type)}
                <div>
                  <h3 className="font-semibold text-gray-900">{shift.shift_name}</h3>
                  <p className="text-sm text-gray-500">{shift.shift_code}</p>
                </div>
              </div>
              <Badge className={getShiftTypeColor(shift.shift_type)}>
                {shift.shift_type}
              </Badge>
            </div>

            {shift.description && (
              <p className="text-sm text-gray-600 mb-4">{shift.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">
                  {shift.start_time} - {shift.end_time}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{shift.duration_minutes} min</span>
              </div>
              {shift.break_duration_minutes > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Break:</span>
                  <span className="font-medium text-gray-900">{shift.break_duration_minutes} min</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Premium Rate:</span>
                <span className="font-medium text-gray-900">{Number(shift.premium_rate).toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Staff Required:</span>
                <span className="font-medium text-gray-900">
                  {shift.min_staff_required}{shift.max_staff_allowed ? ` - ${shift.max_staff_allowed}` : '+'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(shift)} className="flex-1">
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(shift.id)}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1 text-red-600" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {shifts.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shift patterns found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first shift pattern</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shift Pattern
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <ShiftPatternFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        shift={selectedShift}
      />
    </div>
  )
}
