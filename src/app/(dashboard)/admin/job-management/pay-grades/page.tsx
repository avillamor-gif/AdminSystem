'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input, Select, ConfirmModal } from '@/components/ui'
import { usePayGrades, useCreatePayGrade, useUpdatePayGrade, useDeletePayGrade } from '@/hooks/usePayGrades'
import { toast } from 'react-hot-toast'
import type { PayGrade, PayGradeInsert, PayGradeUpdate } from '@/services/payGrade.service'

interface FormData {
  grade: string
  level: number
  title: string
  description: string
  category: string
  minimum_salary: number
  midpoint_salary: number
  maximum_salary: number
  currency: string
  status: string
}

const INITIAL_FORM_DATA: FormData = {
  grade: '',
  level: 1,
  title: '',
  description: '',
  category: 'professional',
  minimum_salary: 0,
  midpoint_salary: 0,
  maximum_salary: 0,
  currency: 'USD',
  status: 'active'
}

export default function PayGradesPage() {
  const { data: payGrades = [], isLoading } = usePayGrades()
  const createMutation = useCreatePayGrade()
  const updateMutation = useUpdatePayGrade()
  const deleteMutation = useDeletePayGrade()
  
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Auto-calculate midpoint when min or max changes
  useEffect(() => {
    if (formData.minimum_salary && formData.maximum_salary) {
      setFormData(prev => ({
        ...prev,
        midpoint_salary: (prev.minimum_salary + prev.maximum_salary) / 2
      }))
    }
  }, [formData.minimum_salary, formData.maximum_salary])

  // Auto-calculate midpoint when min or max changes
  useEffect(() => {
    if (formData.minimum_salary && formData.maximum_salary) {
      setFormData(prev => ({
        ...prev,
        midpoint_salary: (prev.minimum_salary + prev.maximum_salary) / 2
      }))
    }
  }, [formData.minimum_salary, formData.maximum_salary])

  const handleOpenModal = (grade?: PayGrade) => {
    if (grade) {
      setEditingId(grade.id)
      setFormData({
        grade: grade.grade,
        level: grade.level,
        title: grade.title,
        description: grade.description || '',
        category: grade.category,
        minimum_salary: Number(grade.minimum_salary),
        midpoint_salary: Number(grade.midpoint_salary),
        maximum_salary: Number(grade.maximum_salary),
        currency: grade.currency || 'USD',
        status: grade.status ?? 'active'
      })
    } else {
      setEditingId(null)
      setFormData(INITIAL_FORM_DATA)
    }
    setErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData(INITIAL_FORM_DATA)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.grade.trim()) newErrors.grade = 'Grade code is required'
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.category.trim()) newErrors.category = 'Category is required'
    if (formData.level < 1) newErrors.level = 'Level must be at least 1'
    if (formData.minimum_salary <= 0) newErrors.minimum_salary = 'Minimum salary must be greater than 0'
    if (formData.maximum_salary <= 0) newErrors.maximum_salary = 'Maximum salary must be greater than 0'
    if (formData.maximum_salary <= formData.minimum_salary) {
      newErrors.maximum_salary = 'Maximum salary must be greater than minimum salary'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: formData as PayGradeUpdate
        })
      } else {
        await createMutation.mutateAsync(formData as PayGradeInsert)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving pay grade:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      await deleteMutation.mutateAsync(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting pay grade:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCurrency = (amount: number | string, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading pay grades...</div>
      </div>
    )
  }

  const totalEmployees = 0 // This would come from a separate query
  const avgMidPoint = payGrades.length > 0 
    ? payGrades.reduce((sum, pg) => sum + Number(pg.midpoint_salary), 0) / payGrades.length 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Grades</h1>
          <p className="text-gray-600 mt-1">
            Define salary bands and pay grade structures
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pay Grade
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Pay Grades</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payGrades.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalEmployees}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Mid-Point</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {payGrades.length > 0 ? formatCurrency(avgMidPoint, 'USD') : '$0'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Salary Range</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {payGrades.length > 0 
              ? `${formatCurrency(Math.min(...payGrades.map(pg => Number(pg.minimum_salary))), 'USD')} - ${formatCurrency(Math.max(...payGrades.map(pg => Number(pg.maximum_salary))), 'USD')}`
              : 'N/A'
            }
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mid-Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range Spread</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payGrades.map((grade) => {
                const rangeSpread = ((Number(grade.maximum_salary) - Number(grade.minimum_salary)) / Number(grade.minimum_salary) * 100).toFixed(0)
                return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{grade.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{grade.title}</div>
                        <div className="text-sm text-gray-500">{grade.grade}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(grade.minimum_salary, grade.currency || 'USD')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(grade.midpoint_salary, grade.currency || 'USD')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(grade.maximum_salary, grade.currency || 'USD')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rangeSpread}%</td>
                    <td className="px-6 py-4 text-sm text-gray-900">0</td>
                    <td className="px-6 py-4">
                      <Badge className={grade.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {grade.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(grade)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setDeleteId(grade.id)
                            setShowDeleteModal(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Salary Band Visualization</h3>
        <div className="space-y-4">
          {payGrades.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pay grades available</p>
          ) : (
            payGrades.map((grade) => {
              const maxSalaryInRange = Math.max(...payGrades.map(pg => Number(pg.maximum_salary)))
              return (
                <div key={grade.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{grade.title}</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(grade.minimum_salary, grade.currency || 'USD')} - {formatCurrency(grade.maximum_salary, grade.currency || 'USD')}
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg"
                      style={{ width: `${(Number(grade.maximum_salary) / maxSalaryInRange) * 100}%` }}
                    >
                      <div className="flex items-center justify-center h-full text-white text-xs font-medium">
                        {grade.category}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={handleCloseModal}>
            {editingId ? 'Edit Pay Grade' : 'Add Pay Grade'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Grade Code"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  error={errors.grade}
                  placeholder="e.g., PG1"
                  required
                />
                <Input
                  label="Level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                  error={errors.level}
                  min="1"
                  required
                />
              </div>

              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                placeholder="e.g., Senior Developer"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  error={errors.category}
                  required
                >
                  <option value="executive">Executive</option>
                  <option value="management">Management</option>
                  <option value="professional">Professional</option>
                  <option value="support">Support</option>
                  <option value="technical">Technical</option>
                  <option value="administrative">Administrative</option>
                </Select>

                <Select
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Minimum Salary"
                  type="number"
                  value={formData.minimum_salary}
                  onChange={(e) => handleInputChange('minimum_salary', parseFloat(e.target.value))}
                  error={errors.minimum_salary}
                  min="0"
                  step="1000"
                  required
                />
                <Input
                  label="Midpoint Salary"
                  type="number"
                  value={formData.midpoint_salary}
                  readOnly
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Maximum Salary"
                  type="number"
                  value={formData.maximum_salary}
                  onChange={(e) => handleInputChange('maximum_salary', parseFloat(e.target.value))}
                  error={errors.maximum_salary}
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description..."
                />
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
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Pay Grade"
        message="Are you sure you want to delete this pay grade? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

