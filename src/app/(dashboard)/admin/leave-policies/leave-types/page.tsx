'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType, type LeaveType } from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react'

const leaveTypeSchema = z.object({
  leave_type_name: z.string().min(1, 'Name is required'),
  leave_type_code: z.string().min(1, 'Code is required'),
  category: z.enum(['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'other']),
  is_paid: z.boolean(),
  requires_approval: z.boolean(),
  color_code: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  display_order: z.coerce.number().min(0),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>

export default function LeaveTypesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)

  const { data: leaveTypes = [], isLoading } = useLeaveTypes()
  const createMutation = useCreateLeaveType()
  const updateMutation = useUpdateLeaveType()
  const deleteMutation = useDeleteLeaveType()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      is_paid: true,
      requires_approval: true,
      is_active: true,
      display_order: 0,
      color_code: '#3b82f6',
    },
  })

  const filteredLeaveTypes = useMemo(() => {
    return leaveTypes.filter((type) => {
      const matchesSearch =
        searchTerm === '' ||
        type.leave_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.leave_type_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === '' || type.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [leaveTypes, searchTerm, categoryFilter])

  const statistics = useMemo(() => {
    const total = leaveTypes.length
    const paid = leaveTypes.filter((t) => t.is_paid).length
    const active = leaveTypes.filter((t) => t.is_active).length
    const categoryBreakdown = leaveTypes.reduce((acc, type) => {
      acc[type.category] = (acc[type.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total, paid, active, categoryBreakdown }
  }, [leaveTypes])

  const handleOpenModal = (leaveType?: LeaveType) => {
    if (leaveType) {
      setEditingLeaveType(leaveType)
      reset({
        leave_type_name: leaveType.leave_type_name,
        leave_type_code: leaveType.leave_type_code,
        category: leaveType.category as any,
        is_paid: leaveType.is_paid,
        requires_approval: leaveType.requires_approval,
        color_code: leaveType.color_code,
        display_order: leaveType.display_order,
        description: leaveType.description || '',
        is_active: leaveType.is_active,
      })
    } else {
      setEditingLeaveType(null)
      reset({
        is_paid: true,
        requires_approval: true,
        is_active: true,
        display_order: 0,
        color_code: '#3b82f6',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingLeaveType(null)
    reset({
      leave_type_name: '',
      leave_type_code: '',
      category: 'vacation' as any,
      is_paid: true,
      requires_approval: true,
      is_active: true,
      display_order: 0,
      color_code: '#3b82f6',
      description: '',
    })
  }

  const onSubmit = async (data: LeaveTypeForm) => {
    try {
      if (editingLeaveType) {
        await updateMutation.mutateAsync({ id: editingLeaveType.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleCloseModal()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave type?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      vacation: 'success',
      sick: 'warning',
      personal: 'default',
      maternity: 'success',
      paternity: 'success',
      bereavement: 'danger',
      other: 'default',
    }
    return variants[category] || 'default'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Types</h1>
          <p className="text-gray-600 mt-1">
            Define and manage different types of leave available to employees
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Leave Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Leave Types</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Paid Leave Types</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.paid}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Types</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{Object.keys(statistics.categoryBreakdown).length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or code..."
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="bereavement">Bereavement</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Leave Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredLeaveTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No leave types found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Color</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name / Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Approval</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Order</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaveTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: type.color_code }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{type.leave_type_name}</div>
                            <div className="text-sm text-gray-500">{type.leave_type_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getCategoryBadgeVariant(type.category)}>
                          {type.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={type.is_paid ? 'success' : 'default'}>
                          {type.is_paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={type.requires_approval ? 'warning' : 'default'}>
                          {type.requires_approval ? 'Required' : 'Not Required'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{type.display_order}</td>
                      <td className="px-4 py-3">
                        <Badge variant={type.is_active ? 'success' : 'danger'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(type)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader onClose={handleCloseModal}>
            {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Leave Type Name"
                {...register('leave_type_name')}
                error={errors.leave_type_name?.message}
                required
              />
              <Input
                label="Leave Type Code"
                {...register('leave_type_code')}
                error={errors.leave_type_code?.message}
                required
              />
              <Select
                label="Category"
                {...register('category')}
                error={errors.category?.message}
                required
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="bereavement">Bereavement</option>
                <option value="other">Other</option>
              </Select>
              <Input
                type="color"
                label="Color Code"
                {...register('color_code')}
                error={errors.color_code?.message}
                required
              />
              <Input
                type="number"
                label="Display Order"
                {...register('display_order')}
                error={errors.display_order?.message}
                required
              />
              <Input
                label="Description"
                {...register('description')}
                error={errors.description?.message}
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_paid')} className="rounded" />
                  <span className="text-sm">Paid Leave</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('requires_approval')}
                    className="rounded"
                  />
                  <span className="text-sm">Requires Approval</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_active')} className="rounded" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingLeaveType ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
