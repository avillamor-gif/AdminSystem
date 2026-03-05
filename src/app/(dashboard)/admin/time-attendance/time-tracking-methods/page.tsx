'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Fingerprint, Smartphone, MapPin, Star } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useTimeTrackingMethods, useDeleteTimeTrackingMethod, useSetDefaultTimeTrackingMethod } from '@/hooks/useTimeAttendance'
import { TimeTrackingMethodFormModal } from '../components/TimeTrackingMethodFormModal'
import type { TimeTrackingMethod } from '@/services/timeAttendance.service'

export default function TimeTrackingMethodsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [trackingTypeFilter, setTrackingTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<TimeTrackingMethod | null>(null)

  const { data: methods = [], isLoading } = useTimeTrackingMethods()
  const deleteMutation = useDeleteTimeTrackingMethod()
  const setDefaultMutation = useSetDefaultTimeTrackingMethod()

  const filteredMethods = methods.filter(method => {
    const matchesSearch = !searchQuery || 
      method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (method.description && method.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = !trackingTypeFilter || method.method_type === trackingTypeFilter
    return matchesSearch && matchesType
  })

  const handleEdit = (method: TimeTrackingMethod) => {
    setSelectedMethod(method)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time tracking method?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedMethod(null)
  }

  const stats = {
    total: filteredMethods.length,
    remoteEnabled: filteredMethods.filter(m => m.requires_location).length,
    defaultMethod: [...filteredMethods].sort((a, b) => a.priority - b.priority)[0]?.name || 'None',
  }

  const getTrackingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      biometric: 'bg-blue-100 text-blue-700',
      web_clock: 'bg-green-100 text-green-700',
      mobile_app: 'bg-purple-100 text-purple-700',
      rfid_card: 'bg-yellow-100 text-yellow-700',
      manual: 'bg-gray-100 text-gray-700',
      geofence: 'bg-indigo-100 text-indigo-700',
      kiosk: 'bg-red-100 text-red-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getTrackingTypeIcon = (type: string) => {
    switch (type) {
      case 'biometric':
        return <Fingerprint className="w-4 h-4" />
      case 'mobile_app':
      case 'web_clock':
        return <Smartphone className="w-4 h-4" />
      case 'geofence':
        return <MapPin className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking Methods</h1>
          <p className="text-gray-600 mt-1">
            Configure how employees clock in and out
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Tracking Method
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Methods</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Remote Enabled</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.remoteEnabled}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Default Method</div>
          <div className="text-lg font-semibold text-orange-600 mt-1 truncate">{stats.defaultMethod}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              value={trackingTypeFilter}
              onChange={(e) => setTrackingTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Tracking Types</option>
              <option value="biometric">Biometric</option>
              <option value="web_clock">Web Clock</option>
              <option value="mobile_app">Mobile App</option>
              <option value="rfid_card">RFID Card</option>
              <option value="manual">Manual</option>
              <option value="geofence">Geofence</option>
              <option value="kiosk">Kiosk</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMethods.map((method) => (
          <Card key={method.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTrackingTypeIcon(method.method_type)}
                <h3 className="font-semibold text-gray-900">{method.name}</h3>
              </div>
              {method.priority === 1 && (
                <Badge className="bg-orange-100 text-orange-700">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>

            {method.description && (
              <p className="text-sm text-gray-600 mb-3">{method.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type</span>
                <Badge className={getTrackingTypeColor(method.method_type)}>
                  {method.method_type.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Remote Access</span>
                <Badge className={method.requires_location ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {method.requires_location ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {method.geofence_radius_meters != null && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <MapPin className="w-3 h-3" />
                  <span>Geofence: {method.geofence_radius_meters}m radius</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t">
              {method.priority !== 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetDefault(method.id)}
                  disabled={setDefaultMutation.isPending}
                  className="flex-1"
                >
                  Set Default
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(method)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(method.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredMethods.length === 0 && (
        <Card className="p-12 text-center">
          <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tracking methods found</h3>
          <p className="text-gray-600 mb-4">Create your first time tracking method to get started</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tracking Method
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <TimeTrackingMethodFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        method={selectedMethod}
      />
    </div>
  )
}
