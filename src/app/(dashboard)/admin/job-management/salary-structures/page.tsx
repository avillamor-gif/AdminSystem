'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, DollarSign, X } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input, Select, ConfirmModal } from '@/components/ui'
import { useSalaryStructures, useCreateSalaryStructure, useUpdateSalaryStructure, useDeleteSalaryStructure } from '@/hooks/useSalaryStructures'
import { usePayGrades } from '@/hooks/usePayGrades'
import { toast } from 'react-hot-toast'
import type { SalaryStructure, SalaryStructureInsert, SalaryStructureUpdate } from '@/services/salaryStructure.service'

interface SalaryComponent {
  name: string
  amount: number
  percentage: number
  type: 'fixed' | 'variable'
}

interface FormData {
  name: string
  code: string
  pay_grade_id: string
  base_salary: number
  components: SalaryComponent[]
  total_compensation: number
  effective_date: string
  status: string
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  code: '',
  pay_grade_id: '',
  base_salary: 0,
  components: [{ name: 'Base Salary', amount: 0, percentage: 100, type: 'fixed' }],
  total_compensation: 0,
  effective_date: new Date().toISOString().split('T')[0],
  status: 'active'
}

export default function SalaryStructuresPage() {
  const { data: salaryStructures = [], isLoading } = useSalaryStructures()
  const { data: payGrades = [] } = usePayGrades()
  const createMutation = useCreateSalaryStructure()
  const updateMutation = useUpdateSalaryStructure()
  const deleteMutation = useDeleteSalaryStructure()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Auto-calculate total compensation and percentages when components change
  useEffect(() => {
    const total = formData.components.reduce((sum, c) => sum + (c.amount || 0), 0)
    
    const componentsWithPercentages = formData.components.map(c => ({
      ...c,
      percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0
    }))

    setFormData(prev => ({
      ...prev,
      total_compensation: total,
      components: componentsWithPercentages
    }))
  }, [formData.components.map(c => c.amount).join(',')])

  const handleOpenModal = (structure?: SalaryStructure) => {
    if (structure) {
      setEditingId(structure.id)
      setFormData({
        name: structure.name,
        code: structure.code,
        pay_grade_id: structure.pay_grade_id || '',
        base_salary: Number(structure.base_salary),
        components: (structure.components as unknown as SalaryComponent[]) || [{ name: 'Base Salary', amount: Number(structure.base_salary), percentage: 100, type: 'fixed' }],
        total_compensation: Number(structure.total_compensation),
        effective_date: structure.effective_date ? new Date(structure.effective_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: structure.status ?? 'active'
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required'
    }

    if (!formData.pay_grade_id) {
      newErrors.pay_grade_id = 'Pay grade is required'
    }

    if (formData.base_salary <= 0) {
      newErrors.base_salary = 'Base salary must be greater than 0'
    }

    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective date is required'
    }

    if (formData.components.length === 0) {
      toast.error('At least one component is required')
      return false
    }

    // Validate components
    const hasInvalidComponents = formData.components.some(c => 
      !c.name.trim() || c.amount <= 0
    )

    if (hasInvalidComponents) {
      toast.error('All components must have a name and amount greater than 0')
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitData = {
      name: formData.name,
      code: formData.code,
      pay_grade_id: formData.pay_grade_id,
      base_salary: formData.base_salary,
      components: formData.components as any,
      total_compensation: formData.total_compensation,
      effective_date: formData.effective_date,
      status: formData.status
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData as SalaryStructureUpdate })
      } else {
        await createMutation.mutateAsync(submitData as SalaryStructureInsert)
      }
      handleCloseModal()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { name: '', amount: 0, percentage: 0, type: 'fixed' }]
    }))
  }

  const removeComponent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }))
  }

  const updateComponent = (index: number, field: keyof SalaryComponent, value: any) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.map((c, i) => 
        i === index ? { ...c, [field]: value } : c
      )
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalCompensation = salaryStructures.reduce((sum, ss) => sum + Number(ss.total_compensation || 0), 0)
  const avgCompensation = salaryStructures.length > 0 ? totalCompensation / salaryStructures.length : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading salary structures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
          <p className="text-gray-600 mt-1">
            Define comprehensive compensation packages and salary components
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Structure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Structures</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{salaryStructures.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Structures</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {salaryStructures.filter(s => s.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Compensation</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(avgCompensation)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Payroll</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {formatCurrency(totalCompensation)}
          </p>
        </Card>
      </div>

      {salaryStructures.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Structures</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first salary structure</p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Structure
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {salaryStructures.map((structure) => {
            const components = (structure.components as unknown as SalaryComponent[]) || []
            const payGrade = payGrades.find(pg => pg.id === structure.pay_grade_id)
            
            return (
              <Card key={structure.id} className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{structure.name}</h3>
                      <p className="text-sm text-gray-500">
                        {structure.code} {payGrade && `• Pay Grade: ${payGrade.grade}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      structure.status === 'active' ? 'bg-green-100 text-green-800' :
                      structure.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }>
                      {structure.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(structure)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(structure.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Base Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(structure.base_salary))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Compensation</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(Number(structure.total_compensation))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Effective Date</p>
                    <p className="text-lg font-medium text-gray-900">
                      {structure.effective_date ? new Date(structure.effective_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {components.length > 0 && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Compensation Breakdown</p>
                      <div className="space-y-3">
                        {components.map((component, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{component.name}</p>
                                <p className="text-xs text-gray-500">
                                  {component.type === 'fixed' ? 'Fixed Component' : 'Variable Component'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(component.amount)}
                              </p>
                              <p className="text-xs text-gray-500">{component.percentage}% of total</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Compensation Mix</span>
                        <span className="text-xs text-gray-500">
                          {components.filter(c => c.type === 'fixed').reduce((sum, c) => sum + c.percentage, 0)}% Fixed • 
                          {components.filter(c => c.type === 'variable').reduce((sum, c) => sum + c.percentage, 0)}% Variable
                        </span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden flex">
                        {components.map((component, idx) => (
                          <div
                            key={idx}
                            className={`h-full ${component.type === 'fixed' ? 'bg-blue-500' : 'bg-green-500'}`}
                            style={{ width: `${component.percentage}%` }}
                            title={`${component.name}: ${component.percentage}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={handleCloseModal}>
            {editingId ? 'Edit Salary Structure' : 'Create Salary Structure'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Structure Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="e.g., Software Engineer - Level 3"
                  required
                />
                <Input
                  label="Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  error={errors.code}
                  placeholder="e.g., SS-SE-L3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Pay Grade"
                  value={formData.pay_grade_id}
                  onChange={(e) => setFormData({ ...formData, pay_grade_id: e.target.value })}
                  error={errors.pay_grade_id}
                  required
                >
                  <option value="">Select Pay Grade</option>
                  {payGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade} - {grade.title}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Base Salary"
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                  error={errors.base_salary}
                  min="0"
                  step="1000"
                  required
                />
                <Input
                  label="Effective Date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  error={errors.effective_date}
                  required
                />
              </div>

              {/* Compensation Components */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Compensation Components
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={addComponent}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Component
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.components.map((component, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          label="Component Name"
                          value={component.name}
                          onChange={(e) => updateComponent(index, 'name', e.target.value)}
                          placeholder="e.g., Performance Bonus"
                          required
                        />
                        <Input
                          label="Amount"
                          type="number"
                          value={component.amount}
                          onChange={(e) => updateComponent(index, 'amount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="100"
                          required
                        />
                        <Select
                          label="Type"
                          value={component.type}
                          onChange={(e) => updateComponent(index, 'type', e.target.value)}
                          required
                        >
                          <option value="fixed">Fixed</option>
                          <option value="variable">Variable</option>
                        </Select>
                      </div>
                      {formData.components.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComponent(index)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Compensation</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(formData.total_compensation)}
                    </span>
                  </div>
                </div>
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
              {editingId ? 'Update' : 'Create'} Structure
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Salary Structure"
        message="Are you sure you want to delete this salary structure? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

