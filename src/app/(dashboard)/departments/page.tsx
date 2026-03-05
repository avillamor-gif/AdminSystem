'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useDepartments, useDeleteDepartment } from '@/hooks'
import { Card, Button, Badge } from '@/components/ui'
import { DepartmentFormModal } from './components/DepartmentFormModal'
import type { Department } from '@/services'

export default function DepartmentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editDepartment, setEditDepartment] = useState<Department | null>(null)
  const { data: departments, isLoading } = useDepartments()
  const deleteDepartment = useDeleteDepartment()

  // Typed data
  const typedDepartments = (departments || []) as Department[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Manage organization structure</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : typedDepartments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No departments found
          </div>
        ) : (
          typedDepartments.map((department) => (
            <Card key={department.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {department.description || 'No description'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditDepartment(department)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this department?')) {
                        deleteDepartment.mutate(department.id)
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <DepartmentFormModal
        open={showCreateModal || !!editDepartment}
        onClose={() => {
          setShowCreateModal(false)
          setEditDepartment(null)
        }}
        department={editDepartment}
      />
    </div>
  )
}
