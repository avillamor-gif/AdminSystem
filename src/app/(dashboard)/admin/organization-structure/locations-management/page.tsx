'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, MapPin, Building, X, Globe } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import toast from 'react-hot-toast'
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/useLocations'

export default function LocationsManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location_type: 'branch_office',
    country: '',
    city: '',
    state_province: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    phone: '',
    email: '',
    status: 'active',
    is_headquarters: false,
  })

  const { data: locations = [], isLoading } = useLocations({ search: searchQuery })
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()

  const filteredLocations = locations

  const handleAdd = () => {
    setSelectedLocationId(null)
    setFormData({
      name: '',
      code: '',
      location_type: 'branch_office',
      country: '',
      city: '',
      state_province: '',
      address_line1: '',
      address_line2: '',
      postal_code: '',
      phone: '',
      email: '',
      status: 'active',
      is_headquarters: false,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (location: any) => {
    setSelectedLocationId(location.id)
    setFormData({
      name: location.name,
      code: location.code || '',
      location_type: location.location_type,
      country: location.country,
      city: location.city || '',
      state_province: location.state_province || '',
      address_line1: location.address_line1 || '',
      address_line2: location.address_line2 || '',
      postal_code: location.postal_code || '',
      phone: location.phone || '',
      email: location.email || '',
      status: location.status,
      is_headquarters: location.is_headquarters || false,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedLocationId) {
        await updateMutation.mutateAsync({
          id: selectedLocationId,
          data: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      
      setIsFormOpen(false)
      setSelectedLocationId(null)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading locations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations Management</h1>
          <p className="text-gray-600 mt-1">
            Manage office locations and branches
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Locations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{locations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {locations.filter(l => l.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Countries</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {new Set(locations.map(l => l.country)).size}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Headquarters</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {locations.filter(l => l.is_headquarters).length}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLocations.map((location) => (
          <Card key={location.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  location.is_headquarters ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {location.is_headquarters ? (
                    <Building className="w-6 h-6 text-purple-600" />
                  ) : (
                    <MapPin className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-500">{location.code}</p>
                </div>
              </div>
              <Badge className={
                location.status === 'active' ? 'bg-green-100 text-green-800' :
                location.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }>
                {location.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>{location.city}, {location.country}</span>
              </div>
              {location.address_line1 && (
                <p className="text-sm text-gray-600">{location.address_line1}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 text-xs capitalize">
                  {location.location_type.replace('_', ' ')}
                </Badge>
                {location.is_headquarters && (
                  <Badge className="bg-purple-50 text-purple-700 text-xs">
                    Headquarters
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(location.id, location.name)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedLocationId ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., New York Office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <Input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., NY-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Type *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.location_type}
                      onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    >
                      <option value="headquarters">Headquarters</option>
                      <option value="branch_office">Branch Office</option>
                      <option value="regional_office">Regional Office</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="retail_store">Retail Store</option>
                      <option value="remote">Remote</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <Input
                      type="text"
                      value={formData.state_province}
                      onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                      placeholder="e.g., New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <Input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="e.g., 10001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <Input
                    type="text"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <Input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    placeholder="e.g., Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g., +1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g., office@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_headquarters}
                      onChange={(e) => setFormData({ ...formData, is_headquarters: e.target.checked })}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Headquarters</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFormOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedLocationId ? 'Update' : 'Create'} Location
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
