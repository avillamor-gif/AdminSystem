'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateBreakPolicy, useUpdateBreakPolicy } from '@/hooks'
import type { BreakPolicy } from '@/services/timeAttendance.service'

interface BreakPolicyFormModalProps {
  isOpen: boolean
  onClose: () => void
  policy?: BreakPolicy | null
}

type FormData = Omit<BreakPolicy, 'id' | 'created_at' | 'updated_at'>

export function BreakPolicyFormModal({ isOpen, onClose, policy }: BreakPolicyFormModalProps) {
  const createPolicy = useCreateBreakPolicy()
  const updatePolicy = useUpdateBreakPolicy()
  const isEditing = !!policy

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: policy || {
      name: '',
      description: '',
      break_type: 'meal',
      duration_minutes: 60,
      is_paid: false,
      is_mandatory: true,
      minimum_shift_hours: 6,
      applies_after_hours: 4,
      max_breaks_per_day: 1,
      is_active: true
    }
  })

  useEffect(() => {
    if (policy) {
      reset(policy)
    }
  }, [policy, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && policy) {
        await updatePolicy.mutateAsync({ id: policy.id, updates: data })
      } else {
        await createPolicy.mutateAsync(data)
      }
      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Break Policy' : 'Add Break Policy'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
        <div>
          <Input
            label="Policy Name"
            {...register('name', { required: 'Policy name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Lunch Break"
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
              label="Break Type"
              {...register('break_type', { required: true })}
              options={[
                { value: 'meal', label: 'Meal' },
                { value: 'rest', label: 'Rest' },
                { value: 'prayer', label: 'Prayer' },
                { value: 'smoking', label: 'Smoking' },
                { value: 'custom', label: 'Custom' }
              ]}
            />
          </div>
          <div>
            <Input
              label="Duration (minutes)"
              type="number"
              {...register('duration_minutes', { 
                required: 'Duration is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1 minute' }
              })}
              error={errors.duration_minutes?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Min Shift Hours to Qualify"
              type="number"
              step="0.5"
              {...register('minimum_shift_hours', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Input
              label="Applies After Hours"
              type="number"
              step="0.5"
              {...register('applies_after_hours', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <Input
            label="Max Breaks Per Day"
            type="number"
            {...register('max_breaks_per_day', { 
              valueAsNumber: true,
              min: { value: 1, message: 'Must be at least 1' }
            })}
          />
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
              id="is_paid"
              {...register('is_paid')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="is_paid" className="ml-2 block text-sm text-gray-900">Paid break</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_mandatory"
              {...register('is_mandatory')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="is_mandatory" className="ml-2 block text-sm text-gray-900">Mandatory</label>
          </div>
        </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Policy' : 'Create Policy'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
