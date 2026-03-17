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
  useAccrualRules,
  useLeaveTypes,
  useCreateAccrualRule,
  useUpdateAccrualRule,
  useDeleteAccrualRule,
  type AccrualRule,
} from '@/hooks/useLeaveAbsence'
import { Plus, Edit, Trash2, Search, TrendingUp } from 'lucide-react'

const accrualRuleSchema = z.object({
  leave_type_id: z.string().uuid('Invalid leave type'),
  rule_name: z.string().min(1, 'Name is required'),
  rule_code: z.string().min(1, 'Code is required'),
  accrual_frequency: z.enum(['monthly', 'annually', 'per_pay_period', 'on_hire']),
  accrual_rate: z.coerce.number().min(0, 'Must be positive'),
  max_balance: z.coerce.number().min(0, 'Must be positive').nullable(),
  carry_over_enabled: z.boolean(),
  max_carry_over: z.coerce.number().min(0).nullable(),
  waiting_period_days: z.coerce.number().min(0, 'Must be 0 or more'),
  is_active: z.boolean(),
})

type AccrualRuleForm = z.infer<typeof accrualRuleSchema>

export default function AccrualRulesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AccrualRule | null>(null)

  const { data: accrualRules = [], isLoading } = useAccrualRules()
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const createMutation = useCreateAccrualRule()
  const updateMutation = useUpdateAccrualRule()
  const deleteMutation = useDeleteAccrualRule()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccrualRuleForm>({
    resolver: zodResolver(accrualRuleSchema),
    defaultValues: {
      accrual_frequency: 'monthly',
      carry_over_enabled: false,
      waiting_period_days: 0,
      is_active: true,
    },
  })

  const filteredRules = useMemo(() => {
    return accrualRules.filter((rule) => {
      const matchesSearch =
        searchTerm === '' ||
        rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.rule_code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLeaveType =
        leaveTypeFilter === '' || rule.leave_type_id === leaveTypeFilter
      return matchesSearch && matchesLeaveType
    })
  }, [accrualRules, searchTerm, leaveTypeFilter])

  const statistics = useMemo(() => {
    const total = accrualRules.length
    const monthly = accrualRules.filter((r) => r.accrual_frequency === 'monthly').length
    const annually = accrualRules.filter((r) => r.accrual_frequency === 'annually').length
    const active = accrualRules.filter((r) => r.is_active).length
    return { total, monthly, annually, active }
  }, [accrualRules])

  const handleOpenModal = (rule?: AccrualRule) => {
    if (rule) {
      setEditingRule(rule)
      reset({
        leave_type_id: rule.leave_type_id,
        rule_name: rule.rule_name,
        rule_code: rule.rule_code,
        accrual_frequency: rule.accrual_frequency as any,
        accrual_rate: rule.accrual_rate,
        max_balance: rule.max_balance,
        carry_over_enabled: rule.carry_over_enabled,
        max_carry_over: rule.max_carry_over,
        waiting_period_days: rule.waiting_period_days,
        is_active: rule.is_active,
      })
    } else {
      setEditingRule(null)
      reset({
        accrual_frequency: 'monthly',
        carry_over_enabled: false,
        waiting_period_days: 0,
        is_active: true,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRule(null)
    reset()
  }

  const onSubmit = async (data: AccrualRuleForm) => {
    try {
      const submitData = {
        ...data,
        max_balance: data.max_balance || undefined,
        max_carry_over: data.max_carry_over || undefined,
      }
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      handleCloseModal()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this accrual rule?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accrual Rules</h1>
          <p className="text-gray-600 mt-1">
            Manage leave accrual rules and rates for different leave types
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Accrual Rule
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Rules</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Monthly Accrual</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.monthly}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Annual Accrual</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.annually}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Rules</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.active}</p>
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

      {/* Accrual Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accrual Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No accrual rules found</div>
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
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Accrual Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Max Balance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Carry Over
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
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{rule.rule_name}</div>
                            <div className="text-sm text-gray-500">{rule.rule_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{rule.leave_type?.leave_type_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {rule.accrual_frequency.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{rule.accrual_rate} days</td>
                      <td className="px-4 py-3 text-sm">
                        {rule.max_balance ? `${rule.max_balance} days` : 'Unlimited'}
                      </td>
                      <td className="px-4 py-3">
                        {rule.carry_over_enabled ? (
                          <Badge variant="success">
                            {rule.max_carry_over ? `Max ${rule.max_carry_over}` : 'Yes'}
                          </Badge>
                        ) : (
                          <Badge variant="default">No</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rule.is_active ? 'success' : 'danger'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
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
            {editingRule ? 'Edit Accrual Rule' : 'Create Accrual Rule'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Leave Type"
                {...register('leave_type_id')}
                error={errors.leave_type_id?.message}
                required
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.leave_type_name}
                  </option>
                ))}
              </Select>
              <Input
                label="Rule Name"
                {...register('rule_name')}
                error={errors.rule_name?.message}
                required
              />
              <Input
                label="Rule Code"
                {...register('rule_code')}
                error={errors.rule_code?.message}
                required
              />
              <Select
                label="Accrual Frequency"
                {...register('accrual_frequency')}
                error={errors.accrual_frequency?.message}
                required
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
                <option value="per_pay_period">Per Pay Period</option>
                <option value="on_hire">On Hire</option>
              </Select>
              <Input
                type="number"
                step="0.01"
                label="Accrual Rate (days)"
                {...register('accrual_rate')}
                error={errors.accrual_rate?.message}
                required
              />
              <Input
                type="number"
                step="0.01"
                label="Max Balance (days, leave empty for unlimited)"
                {...register('max_balance')}
                error={errors.max_balance?.message}
              />
              <Input
                type="number"
                label="Waiting Period (days)"
                {...register('waiting_period_days')}
                error={errors.waiting_period_days?.message}
                required
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('carry_over_enabled')}
                  className="rounded"
                />
                <span className="text-sm">Enable Carry Over</span>
              </label>
              <Input
                type="number"
                step="0.01"
                label="Max Carry Over (days, leave empty for unlimited)"
                {...register('max_carry_over')}
                error={errors.max_carry_over?.message}
              />
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('is_active')} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
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
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
