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
  useLeavePolicyConfigs,
  useLeaveTypes,
  useCreateLeavePolicyConfig,
  useUpdateLeavePolicyConfig,
  useDeleteLeavePolicyConfig,
  useSetDefaultLeavePolicyConfig,
  type LeavePolicyConfig,
} from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, FileText, Star } from 'lucide-react'

const policySchema = z.object({
  leave_type_id: z.string().uuid('Invalid leave type').nullable(),
  policy_name: z.string().min(1, 'Name is required'),
  policy_code: z.string().min(1, 'Code is required'),
  eligibility_criteria: z.string(),
  min_service_months: z.coerce.number().min(0),
  requires_approval: z.boolean(),
  max_consecutive_days: z.coerce.number().min(0).nullable(),
  min_notice_days: z.coerce.number().min(0),
  blackout_period_enabled: z.boolean(),
  can_split_leave: z.boolean(),
  is_default: z.boolean(),
  is_active: z.boolean(),
})

type PolicyForm = z.infer<typeof policySchema>

export default function LeavePoliciesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicyConfig | null>(null)

  const { data: policies = [], isLoading } = useLeavePolicyConfigs()
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const createMutation = useCreateLeavePolicyConfig()
  const updateMutation = useUpdateLeavePolicyConfig()
  const deleteMutation = useDeleteLeavePolicyConfig()
  const setDefaultMutation = useSetDefaultLeavePolicyConfig()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      requires_approval: true,
      min_service_months: 0,
      min_notice_days: 0,
      blackout_period_enabled: false,
      can_split_leave: true,
      is_default: false,
      is_active: true,
    },
  })

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        searchTerm === '' ||
        policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.policy_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLeaveType =
        leaveTypeFilter === '' || policy.leave_type_id === leaveTypeFilter
      return matchesSearch && matchesLeaveType
    })
  }, [policies, searchTerm, leaveTypeFilter])

  const statistics = useMemo(() => {
    const total = policies.length
    const defaultPolicy = policies.find((p) => p.is_default)
    const active = policies.filter((p) => p.is_active).length
    return { total, defaultPolicy: defaultPolicy?.policy_name || 'None', active }
  }, [policies])

  const handleOpenModal = (policy?: LeavePolicyConfig) => {
    if (policy) {
      setEditingPolicy(policy)
      reset({
        leave_type_id: policy.leave_type_id,
        policy_name: policy.policy_name,
        policy_code: policy.policy_code,
        eligibility_criteria: policy.eligibility_criteria,
        min_service_months: policy.min_service_months,
        requires_approval: policy.requires_approval,
        max_consecutive_days: policy.max_consecutive_days,
        min_notice_days: policy.min_notice_days,
        blackout_period_enabled: policy.blackout_period_enabled,
        can_split_leave: policy.can_split_leave,
        is_default: policy.is_default,
        is_active: policy.is_active,
      })
    } else {
      setEditingPolicy(null)
      reset({
        requires_approval: true,
        min_service_months: 0,
        min_notice_days: 0,
        blackout_period_enabled: false,
        can_split_leave: true,
        is_default: false,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPolicy(null)
    reset()
  }

  const onSubmit = async (data: PolicyForm) => {
    try {
      const submitData = {
        ...data,
        leave_type_id: data.leave_type_id || undefined,
        max_consecutive_days: data.max_consecutive_days || undefined,
      }
      if (editingPolicy) {
        await updateMutation.mutateAsync({ id: editingPolicy.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      handleCloseModal()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave policy?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Policies</h1>
          <p className="text-gray-600 mt-1">
            Configure leave policy settings and eligibility criteria
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Leave Policy
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Policies</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Default Policy</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.defaultPolicy}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Policies</p>
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

      {/* Leave Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No leave policies found</div>
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
                      Eligibility
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Approval
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Notice
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
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {policy.policy_name}
                              {policy.is_default && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{policy.policy_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {policy.leave_type?.leave_type_name || 'All Types'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {policy.min_service_months > 0
                          ? `${policy.min_service_months} months`
                          : 'Immediate'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={policy.requires_approval ? 'warning' : 'success'}>
                          {policy.requires_approval ? 'Required' : 'Auto-Approve'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{policy.min_notice_days} days</td>
                      <td className="px-4 py-3">
                        <Badge variant={policy.is_active ? 'success' : 'danger'}>
                          {policy.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {!policy.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(policy.id)}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(policy)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(policy.id)}
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
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader onClose={handleCloseModal}>
            {editingPolicy ? 'Edit Leave Policy' : 'Create Leave Policy'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Leave Type (optional for global policy)"
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
                label="Policy Name"
                {...register('policy_name')}
                error={errors.policy_name?.message}
                required
              />
              <Input
                label="Policy Code"
                {...register('policy_code')}
                error={errors.policy_code?.message}
                required
              />
              <Input
                label="Eligibility Criteria"
                {...register('eligibility_criteria')}
                error={errors.eligibility_criteria?.message}
              />
              <Input
                type="number"
                label="Minimum Service (months)"
                {...register('min_service_months')}
                error={errors.min_service_months?.message}
                required
              />
              <Input
                type="number"
                label="Max Consecutive Days (leave empty for unlimited)"
                {...register('max_consecutive_days')}
                error={errors.max_consecutive_days?.message}
              />
              <Input
                type="number"
                label="Minimum Notice (days)"
                {...register('min_notice_days')}
                error={errors.min_notice_days?.message}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('requires_approval')}
                    className="rounded"
                  />
                  <span className="text-sm">Requires Approval</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('blackout_period_enabled')}
                    className="rounded"
                  />
                  <span className="text-sm">Blackout Period</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('can_split_leave')}
                    className="rounded"
                  />
                  <span className="text-sm">Can Split Leave</span>
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
              {editingPolicy ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
