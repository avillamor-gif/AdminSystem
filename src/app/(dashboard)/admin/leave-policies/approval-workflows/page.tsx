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
  useApprovalWorkflows,
  useLeaveTypes,
  useCreateApprovalWorkflow,
  useUpdateApprovalWorkflow,
  useDeleteApprovalWorkflow,
  useSetDefaultApprovalWorkflow,
  type ApprovalWorkflow,
} from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, GitBranch, Star } from 'lucide-react'

const workflowSchema = z.object({
  leave_type_id: z.string().uuid('Invalid leave type').nullable(),
  workflow_name: z.string().min(1, 'Name is required'),
  workflow_code: z.string().min(1, 'Code is required'),
  workflow_steps: z.array(z.any()),
  is_sequential: z.boolean(),
  escalation_enabled: z.boolean(),
  escalation_days: z.coerce.number().min(0).nullable(),
  priority: z.coerce.number().min(0),
  is_default: z.boolean(),
  is_active: z.boolean(),
})

type WorkflowForm = z.infer<typeof workflowSchema>

export default function ApprovalWorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null)

  const { data: workflows = [], isLoading } = useApprovalWorkflows()
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const createMutation = useCreateApprovalWorkflow()
  const updateMutation = useUpdateApprovalWorkflow()
  const deleteMutation = useDeleteApprovalWorkflow()
  const setDefaultMutation = useSetDefaultApprovalWorkflow()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkflowForm>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      workflow_steps: [],
      is_sequential: true,
      escalation_enabled: false,
      priority: 1,
      is_default: false,
      is_active: true,
    },
  })

  const workflowSteps = watch('workflow_steps')

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        searchTerm === '' ||
        workflow.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.workflow_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLeaveType =
        leaveTypeFilter === '' || workflow.leave_type_id === leaveTypeFilter
      return matchesSearch && matchesLeaveType
    })
  }, [workflows, searchTerm, leaveTypeFilter])

  const statistics = useMemo(() => {
    const total = workflows.length
    const sequential = workflows.filter((w) => w.is_sequential).length
    const parallel = workflows.filter((w) => !w.is_sequential).length
    const withEscalation = workflows.filter((w) => (w as any).has_escalation).length
    const active = workflows.filter((w) => w.is_active).length
    const defaultWorkflow = workflows.find((w) => w.is_default)
    return {
      total,
      sequential,
      parallel,
      withEscalation,
      active,
      defaultWorkflow: defaultWorkflow?.workflow_name || 'None',
    }
  }, [workflows])

  const handleOpenModal = (workflow?: ApprovalWorkflow) => {
    if (workflow) {
      setEditingWorkflow(workflow)
      reset({
        leave_type_id: workflow.leave_type_id,
        workflow_name: workflow.workflow_name,
        workflow_code: workflow.workflow_code,
        workflow_steps: workflow.workflow_steps,
        is_sequential: workflow.is_sequential,
        escalation_enabled: workflow.escalation_enabled,
        escalation_days: workflow.escalation_days,
        priority: workflow.priority,
        is_default: workflow.is_default,
        is_active: workflow.is_active,
      })
    } else {
      setEditingWorkflow(null)
      reset({
        workflow_steps: [],
        is_sequential: true,
        escalation_enabled: false,
        priority: 1,
        is_default: false,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingWorkflow(null)
    reset()
  }

  const onSubmit = async (data: WorkflowForm) => {
    try {
      const submitData = {
        ...data,
        leave_type_id: data.leave_type_id || undefined,
        escalation_days: data.escalation_days || undefined,
      }
      if (editingWorkflow) {
        await updateMutation.mutateAsync({ id: editingWorkflow.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      handleCloseModal()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this approval workflow?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id)
  }

  const addStep = () => {
    const newStep = {
      step_order: (workflowSteps?.length || 0) + 1,
      approver_role: 'Manager',
      approver_level: 1,
      is_optional: false,
    }
    setValue('workflow_steps', [...(workflowSteps || []), newStep])
  }

  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = [...(workflowSteps || [])]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setValue('workflow_steps', updatedSteps)
  }

  const removeStep = (index: number) => {
    const updatedSteps = workflowSteps?.filter((_, i) => i !== index) || []
    setValue('workflow_steps', updatedSteps)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
          <p className="text-gray-600 mt-1">
            Configure approval workflows and routing for leave requests
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Workflows</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Sequential</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.sequential}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">With Escalation</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.withEscalation}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Workflows</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.active}</p>
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
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.leave_type_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Approval Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approval workflows found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name / Code
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Leave Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Steps
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Escalation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Priority
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
                  {filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {workflow.workflow_name}
                              {workflow.is_default && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{workflow.workflow_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {workflow.leave_type?.leave_type_name || 'All Types'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{workflow.workflow_steps.length} steps</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={workflow.is_sequential ? 'warning' : 'success'}>
                          {workflow.is_sequential ? 'Sequential' : 'Parallel'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {workflow.escalation_enabled ? (
                          <Badge variant="warning">
                            {workflow.escalation_days ? `${workflow.escalation_days}d` : 'Yes'}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{workflow.priority}</td>
                      <td className="px-4 py-3">
                        <Badge variant={workflow.is_active ? 'success' : 'danger'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {!workflow.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(workflow.id)}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(workflow)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workflow.id)}
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
            {editingWorkflow ? 'Edit Approval Workflow' : 'Create Approval Workflow'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Leave Type (optional for global workflow)"
                {...register('leave_type_id')}
                error={errors.leave_type_id?.message}
              >
                <option value="">All Leave Types</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.leave_type_name}
                  </option>
                ))}
              </Select>
              <Input
                label="Workflow Name"
                {...register('workflow_name')}
                error={errors.workflow_name?.message}
                required
              />
              <Input
                label="Workflow Code"
                {...register('workflow_code')}
                error={errors.workflow_code?.message}
                required
              />
              <Input
                type="number"
                label="Priority"
                {...register('priority')}
                error={errors.priority?.message}
                required
              />
              <Input
                type="number"
                label="Escalation Days (leave empty if escalation disabled)"
                {...register('escalation_days')}
                error={errors.escalation_days?.message}
              />

              {/* Workflow Steps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Workflow Steps</label>
                  <Button type="button" size="sm" onClick={addStep}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                {workflowSteps && workflowSteps.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                    {workflowSteps.map((step: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium w-16">Step {index + 1}</span>
                          <select
                            value={step.approver_role || 'Manager'}
                            onChange={(e) => updateStep(index, 'approver_role', e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          >
                            <option value="Manager">Manager</option>
                            <option value="HR">HR</option>
                            <option value="Executive Director">Executive Director</option>
                          </select>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={step.is_optional || false}
                              onChange={(e) => updateStep(index, 'is_optional', e.target.checked)}
                              className="rounded"
                            />
                            Optional
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStep(index)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 border rounded p-4 text-center">
                    No steps added yet. Click "Add Step" to create workflow steps.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_sequential')} className="rounded" />
                  <span className="text-sm">Sequential (vs Parallel)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('escalation_enabled')}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Escalation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('is_default')} className="rounded" />
                  <span className="text-sm">Set as Default</span>
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
              {editingWorkflow ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
