'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateOvertimeRule, useUpdateOvertimeRule } from '@/hooks'
import type { OvertimeRule } from '@/services/timeAttendance.service'

interface OvertimeRuleFormModalProps {
  isOpen: boolean
  onClose: () => void
  rule?: OvertimeRule | null
}

type FormData = Omit<OvertimeRule, 'id' | 'created_at' | 'updated_at'>

export function OvertimeRuleFormModal({ isOpen, onClose, rule }: OvertimeRuleFormModalProps) {
  const createRule = useCreateOvertimeRule()
  const updateRule = useUpdateOvertimeRule()
  const isEditing = !!rule

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: rule || {
      name: '',
      description: '',
      rule_type: 'daily',
      threshold_hours: 8,
      multiplier: 1.5,
      applies_to: 'all',
      requires_approval: true,
      auto_calculate: true,
      priority: 0,
      is_active: true,
      effective_from: null,
      effective_to: null
    }
  })

  useEffect(() => {
    if (rule) {
      reset(rule)
    }
  }, [rule, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && rule) {
        await updateRule.mutateAsync({ id: rule.id, updates: data })
      } else {
        await createRule.mutateAsync(data)
      }
      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Overtime Rule' : 'Add Overtime Rule'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
        <div>
          <Input
            label="Rule Name"
            {...register('name', { required: 'Rule name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Daily Overtime"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Rule Type"
              {...register('rule_type', { required: true })}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'holiday', label: 'Holiday' },
                { value: 'weekend', label: 'Weekend' }
              ]}
            />
          </div>
          <div>
            <Select
              label="Applies To"
              {...register('applies_to', { required: true })}
              options={[
                { value: 'all', label: 'All Employees' },
                { value: 'non_exempt', label: 'Non-Exempt Only' },
                { value: 'hourly', label: 'Hourly Only' }
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Threshold Hours"
              type="number"
              step="0.5"
              {...register('threshold_hours', {
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or more' }
              })}
            />
          </div>
          <div>
            <Input
              label="Pay Multiplier"
              type="number"
              step="0.1"
              {...register('multiplier', { 
                required: 'Multiplier is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1.0' }
              })}
              error={errors.multiplier?.message}
            />
          </div>
        </div>

        <div>
          <Input
            label="Priority"
            type="number"
            {...register('priority', { valueAsNumber: true })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Higher priority rules are applied first</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_approval"
              {...register('requires_approval')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">Requires manager approval</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_calculate"
              {...register('auto_calculate')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="auto_calculate" className="ml-2 block text-sm text-gray-900">Auto-calculate overtime</label>
          </div>
        </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
