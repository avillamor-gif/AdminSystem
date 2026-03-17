'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, MapPin } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useLocationTypes, useCreateLocationType, useUpdateLocationType, useDeleteLocationType } from '@/hooks/useLocationTypes'
import { useLocations } from '@/hooks/useLocations'
import toast from 'react-hot-toast'

export default function LocationTypesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'building',
    color: 'blue',
    status: 'active' as 'active' | 'inactive',
  })

  const { data: locationTypes = [], isLoading } = useLocationTypes()
  const { data: locations = [] } = useLocations()
  const createMutation = useCreateLocationType()
  const updateMutation = useUpdateLocationType()
  const deleteMutation = useDeleteLocationType()

  const colorOptions = [
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700' },
    { value: 'green', label: 'Green', class: 'bg-green-100 text-green-700' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-700' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-700' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700' },
  ]

  const getLocationCountForType = (code: string) => {
    return locations.filter(loc => loc.location_type === code).length
  }

  const handleAdd = () => {
    setSelectedType(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: 'building',
      color: 'blue',
      status: 'active',
    })
    setIsFormOpen(true)
  }

  const handleEdit = (type: any) => {
    setSelectedType(type)
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      icon: type.icon || 'building',
      color: type.color || 'blue',
      status: type.status,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedType) {
        await updateMutation.mutateAsync({ 
          id: selectedType.id, 
          data: {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            status: formData.status,
          }
        })
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          status: formData.status,
        })
      }
      
      setIsFormOpen(false)
      setSelectedType(null)
    } catch (error) {
      console.error('Error saving location type:', error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting location type:', error)
      }
    }
  }

  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading location types...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Types</h1>
          <p className="text-gray-600 mt-1">
            Configure location types and categories
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Types</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{locationTypes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Types</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {locationTypes.filter(t => t.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Locations</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {locations.length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationTypes.map((type) => (
          <Card key={type.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[type.color as keyof typeof colors]}`}>
                <MapPin className="w-6 h-6" />
              </div>
              <Badge className={type.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                {type.status}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{type.code}</p>
            <p className="text-sm text-gray-600 mb-4">{type.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{getLocationCountForType(type.code)}</span> locations
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id, type.name)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setIsFormOpen(false)}>
            {selectedType ? 'Edit Location Type' : 'Add New Location Type'}
          </ModalHeader>
          
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Branch Office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., BRANCH"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Theme
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedType ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
