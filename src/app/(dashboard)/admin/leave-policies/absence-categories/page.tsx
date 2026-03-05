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
import {
  useAbsenceCategories,
  useCreateAbsenceCategory,
  useUpdateAbsenceCategory,
  useDeleteAbsenceCategory,
  type AbsenceCategory,
} from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react'

const absenceCategorySchema = z.object({
  category_name: z.string().min(1, 'Name is required'),
  category_code: z.string().min(1, 'Code is required'),
  category_type: z.enum(['unauthorized', 'lateness', 'early_departure', 'medical', 'emergency', 'other']),
  severity_level: z.enum(['low', 'medium', 'high', 'critical']),
  affects_pay: z.boolean(),
  requires_approval: z.boolean(),
  max_occurrences_per_month: z.coerce.number().min(0).nullable(),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type AbsenceCategoryForm = z.infer<typeof absenceCategorySchema>

export default function AbsenceCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AbsenceCategory | null>(null)

  const { data: categories = [], isLoading } = useAbsenceCategories()
  const createMutation = useCreateAbsenceCategory()
  const updateMutation = useUpdateAbsenceCategory()
  const deleteMutation = useDeleteAbsenceCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AbsenceCategoryForm>({
    resolver: zodResolver(absenceCategorySchema),
    defaultValues: {
      category_type: 'unauthorized',
      severity_level: 'medium',
      affects_pay: false,
      requires_approval: false,
      is_active: true,
    },
  })

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        searchTerm === '' ||
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.category_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === '' || cat.category_type === typeFilter
      const matchesSeverity = severityFilter === '' || cat.severity_level === severityFilter
      return matchesSearch && matchesType && matchesSeverity
    })
  }, [categories, searchTerm, typeFilter, severityFilter])

  const statistics = useMemo(() => {
    const total = categories.length
    const byType = categories.reduce((acc, c) => {
      acc[c.category_type] = (acc[c.category_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const highSeverity = categories.filter((c) => c.severity_level === 'high' || c.severity_level === 'critical').length
    return { total, byType, highSeverity }
  }, [categories])

  const handleOpenModal = (category?: AbsenceCategory) => {
    if (category) {
      setEditingCategory(category)
      reset({
        category_name: category.category_name,
        category_code: category.category_code,
        category_type: category.category_type as any,
        severity_level: category.severity_level as any,
        affects_pay: category.affects_pay,
        requires_approval: category.requires_approval,
        max_occurrences_per_month: category.max_occurrences_per_month,
        description: category.description || '',
        is_active: category.is_active,
      })
    } else {
      setEditingCategory(null)
      reset({
        category_type: 'unauthorized',
        severity_level: 'medium',
        affects_pay: false,
        requires_approval: false,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    reset()
  }

  const onSubmit = async (data: AbsenceCategoryForm) => {
    try {
      const submitData = {
        ...data,
        max_occurrences_per_month: data.max_occurrences_per_month || undefined,
      }
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      handleCloseModal()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this absence category?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    }
    return variants[severity] || 'default'
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-purple-100 text-purple-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absence Categories</h1>
          <p className="text-gray-600 mt-1">
            Define and manage absence categories and their severity levels
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Unauthorized</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{statistics.byType.unauthorized || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Medical</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.byType.medical || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">High Severity</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.highSeverity}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or code..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="unauthorized">Unauthorized</option>
            <option value="lateness">Lateness</option>
            <option value="early_departure">Early Departure</option>
            <option value="medical">Medical</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </Card>

      {/* Absence Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Absence Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No absence categories found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name / Code
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Affects Pay
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Approval
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Max/Month
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{category.category_name}</div>
                            <div className="text-sm text-gray-500">{category.category_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {category.category_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                            category.severity_level
                          )}`}
                        >
                          {category.severity_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={category.affects_pay ? 'danger' : 'success'}>
                          {category.affects_pay ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {category.requires_approval ? (
                          <Badge variant="warning">Required</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">Not Required</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {category.max_occurrences_per_month || 'Unlimited'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={category.is_active ? 'success' : 'danger'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
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
            {editingCategory ? 'Edit Absence Category' : 'Create Absence Category'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Category Name"
                {...register('category_name')}
                error={errors.category_name?.message}
                required
              />
              <Input
                label="Category Code"
                {...register('category_code')}
                error={errors.category_code?.message}
                required
              />
              <Select
                label="Category Type"
                {...register('category_type')}
                error={errors.category_type?.message}
                required
              >
                <option value="unauthorized">Unauthorized</option>
                <option value="lateness">Lateness</option>
                <option value="early_departure">Early Departure</option>
                <option value="medical">Medical</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </Select>
              <Select
                label="Severity Level"
                {...register('severity_level')}
                error={errors.severity_level?.message}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
              <Input
                type="number"
                label="Max Occurrences Per Month (leave empty for unlimited)"
                {...register('max_occurrences_per_month')}
                error={errors.max_occurrences_per_month?.message}
              />
              <Input
                label="Description"
                {...register('description')}
                error={errors.description?.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('affects_pay')} className="rounded" />
                  <span className="text-sm">Affects Pay</span>
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
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
