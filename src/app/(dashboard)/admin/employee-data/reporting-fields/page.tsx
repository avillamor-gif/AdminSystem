'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Download, Settings, BarChart } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useCustomFields, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from '@/hooks/useEmployeeData'
import toast from 'react-hot-toast'

export default function ReportingFieldsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    field_key: '',
    field_type: 'text',
    category: 'custom',
    description: '',
    required: false,
    visible: true,
    searchable: true,
    show_in_profile: true,
    show_in_list: false,
  })

  const { data: customFields = [], isLoading } = useCustomFields({ status: 'active' })
  const createMutation = useCreateCustomField()
  const updateMutation = useUpdateCustomField()
  const deleteMutation = useDeleteCustomField()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedField) {
        await updateMutation.mutateAsync({ id: selectedField.id, updates: formData as any })
      } else {
        await createMutation.mutateAsync(formData as any)
      }
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving field:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      field_key: '',
      field_type: 'text',
      category: 'custom',
      description: '',
      required: false,
      visible: true,
      searchable: true,
      show_in_profile: true,
      show_in_list: false,
    })
    setSelectedField(null)
  }

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'url', label: 'URL' },
  ]

  const categories = [
    { value: 'personal', label: 'Personal' },
    { value: 'contact', label: 'Contact' },
    { value: 'job', label: 'Job' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'education', label: 'Education' },
    { value: 'certification', label: 'Certification' },
    { value: 'custom', label: 'Custom' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading reporting fields...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting Fields</h1>
          <p className="text-gray-600 mt-1">
            Configure custom fields for reporting and analytics
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Fields</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{customFields.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">In Reports</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {customFields.filter(f => f.show_in_list).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Required</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {customFields.filter(f => f.required).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Searchable</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {customFields.filter(f => f.searchable).length}
          </div>
        </Card>
      </div>

      {/* Fields Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Field Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Required</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">In Reports</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customFields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{field.name}</div>
                      <div className="text-xs text-gray-500">{field.field_key}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-blue-100 text-blue-700 capitalize">{field.field_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-purple-100 text-purple-700 capitalize">{field.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.required && <Badge className="bg-red-100 text-red-700">Yes</Badge>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.show_in_list && <BarChart className="w-4 h-4 text-green-600 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedField(field)
                        setFormData(field as any)
                        setIsFormOpen(true)
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (confirm(`Delete field "${field.name}"?`)) {
                          await deleteMutation.mutateAsync(field.id)
                        }
                      }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedField ? 'Edit Field' : 'Add New Field'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Passport Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Key *</label>
                    <Input
                      required
                      value={formData.field_key}
                      onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                      placeholder="e.g., passport_number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.field_type}
                      onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.searchable}
                      onChange={(e) => setFormData({ ...formData, searchable: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Searchable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.show_in_profile}
                      onChange={(e) => setFormData({ ...formData, show_in_profile: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Show in Profile</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.show_in_list}
                      onChange={(e) => setFormData({ ...formData, show_in_list: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Show in Reports</span>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsFormOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedField ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
