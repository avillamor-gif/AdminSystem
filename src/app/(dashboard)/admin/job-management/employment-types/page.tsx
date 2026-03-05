'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Users, X } from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import toast from 'react-hot-toast'
import { useEmploymentTypes, useCreateEmploymentType, useUpdateEmploymentType, useDeleteEmploymentType } from '@/hooks/useEmploymentTypes'
import type { Tables } from '@/lib/supabase/database.types'
type EmploymentType = Tables<'employment_types'>

export default function EmploymentTypesPage() {
  const { data: employmentTypes = [], isLoading } = useEmploymentTypes({})
  const createMutation = useCreateEmploymentType()
  const updateMutation = useUpdateEmploymentType()
  const deleteMutation = useDeleteEmploymentType()

  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EmploymentType | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    code: string
    description: string
    category: 'permanent' | 'contract' | 'temporary' | 'intern' | 'consultant'
    is_active: boolean | null
  }>({
    name: '',
    code: '',
    description: '',
    category: 'permanent',
    is_active: true,
  })

  const filteredTypes = employmentTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const activeTypes = employmentTypes.filter(t => t.is_active).length

  const handleEdit = (type: EmploymentType) => {
    setSelectedType(type)
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      category: (type.category ?? 'permanent') as 'permanent' | 'contract' | 'temporary' | 'intern' | 'consultant',
      is_active: type.is_active,
    })
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedType(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'permanent',
      is_active: true,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedType) {
        await updateMutation.mutateAsync({
          id: selectedType.id,
          data: formData as any,
        })
      } else {
        await createMutation.mutateAsync(formData as any)
      }
      setIsFormOpen(false)
      setSelectedType(null)
    } catch (error) {
      console.error('Error saving employment type:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employment type?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting employment type:', error)
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedType(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employment Types</h1>
          <p className="text-gray-600 mt-1">
            Manage different types of employment contracts and their configurations
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employment Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Types</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{employmentTypes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Types</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeTypes}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search employment types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading employment types...</p>
        </div>
      ) : filteredTypes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No employment types found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((type) => (
            <Card key={type.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    type.category === 'permanent' ? 'bg-blue-100' :
                    type.category === 'contract' ? 'bg-purple-100' :
                    type.category === 'temporary' ? 'bg-green-100' :
                    'bg-orange-100'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      type.category === 'permanent' ? 'text-blue-600' :
                      type.category === 'contract' ? 'text-purple-600' :
                      type.category === 'temporary' ? 'text-green-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.code}</p>
                  </div>
                </div>
                <Badge className={
                  type.is_active
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4">{type.description || 'No description'}</p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedType ? 'Edit Employment Type' : 'Add New Employment Type'}
              </h2>
              <button
                onClick={handleCloseForm}
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
                      Employment Type Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Full-Time Permanent"
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
                      placeholder="e.g., ET-FTP"
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
                    placeholder="Brief description of the employment type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseForm}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (selectedType ? 'Update' : 'Create')} Employment Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

