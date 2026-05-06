'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Building2, Users, X, User } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import toast from 'react-hot-toast'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'

interface DepartmentFormData {
  name: string
  description: string
  parent_id: string | null
  head_id: string | null
}

export default function CompanyStructurePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    parent_id: null,
    head_id: null,
  })

  const { data: departments = [], isLoading } = useDepartments()
  const { data: employees = [] } = useEmployees({})
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const deleteMutation = useDeleteDepartment()

  // Build hierarchy
  const buildHierarchy = () => {
    const deptMap = new Map(departments.map(d => [d.id, { ...d, children: [] as any[] }]))
    const roots: any[] = []
    
    departments.forEach(dept => {
      const node = deptMap.get(dept.id)!
      if (dept.parent_id && deptMap.has(dept.parent_id)) {
        deptMap.get(dept.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }

  const hierarchy = buildHierarchy()
  const totalDepts = departments.length
  const topLevelDepts = departments.filter(d => !d.parent_id).length

  const handleAdd = (parentId: string | null = null) => {
    setSelectedDeptId(null)
    setFormData({
      name: '',
      description: '',
      parent_id: parentId,
      head_id: null,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (dept: any) => {
    setSelectedDeptId(dept.id)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      parent_id: dept.parent_id,
      head_id: dept.head_id || null,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedDeptId) {
        await updateMutation.mutateAsync({
          id: selectedDeptId,
          data: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      
      setIsFormOpen(false)
      setSelectedDeptId(null)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All sub-departments will be orphaned.`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  const renderDepartmentTree = (depts: any[], level = 0) => {
    return depts.map((dept) => (
      <div key={dept.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <Card className="p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                level === 0 ? 'bg-blue-100' : level === 1 ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                <Building2 className={`w-5 h-5 ${
                  level === 0 ? 'text-blue-600' : level === 1 ? 'text-purple-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                {dept.description && (
                  <p className="text-sm text-gray-500">{dept.description}</p>
                )}
                {dept.head_id && (() => {
                  const head = employees.find((e: any) => e.id === dept.head_id)
                  return head ? (
                    <p className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {head.first_name} {head.last_name}
                    </p>
                  ) : null
                })()}
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gray-100 text-gray-700 text-xs">
                    Level {level + 1}
                  </Badge>
                  {dept.children.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {dept.children.length} sub-dept{dept.children.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleAdd(dept.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Sub
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id, dept.name)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </Card>
        {dept.children.length > 0 && renderDepartmentTree(dept.children, level + 1)}
      </div>
    ))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading company structure...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Structure</h1>
          <p className="text-gray-600 mt-1">
            Manage organizational departments and hierarchy
          </p>
        </div>
        <Button onClick={() => handleAdd()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalDepts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Top-Level Departments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{topLevelDepts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Sub-Departments</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalDepts - topLevelDepts}</p>
        </Card>
      </div>

      <div>
        {hierarchy.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first department</p>
            <Button onClick={() => handleAdd()}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Department
            </Button>
          </Card>
        ) : (
          renderDepartmentTree(hierarchy)
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDeptId ? 'Edit Department' : 'Add New Department'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
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
                    placeholder="Brief description of the department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Department
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  >
                    <option value="">None (Top-Level)</option>
                    {departments
                      .filter(d => d.id !== selectedDeptId)
                      .map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department / Unit Head
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.head_id || ''}
                    onChange={(e) => setFormData({ ...formData, head_id: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedDeptId ? 'Update' : 'Create'} Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
