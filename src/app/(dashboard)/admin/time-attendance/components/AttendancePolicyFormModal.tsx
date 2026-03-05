'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateAttendancePolicy, useUpdateAttendancePolicy } from '@/hooks'
import type { AttendancePolicy } from '@/services/timeAttendance.service'

interface AttendancePolicyFormModalProps {
  isOpen: boolean
  onClose: () => void
  policy?: AttendancePolicy | null
}

type FormData = Omit<AttendancePolicy, 'id' | 'created_at' | 'updated_at' | 'effective_from' | 'effective_to'>

export function AttendancePolicyFormModal({ isOpen, onClose, policy }: AttendancePolicyFormModalProps) {
  const createPolicy = useCreateAttendancePolicy()
  const updatePolicy = useUpdateAttendancePolicy()
  const isEditing = !!policy

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: policy || {
      name: '',
      description: '',
      policy_type: 'general',
      late_threshold_minutes: 15,
      late_action: 'warning',
      grace_period_minutes: 5,
      max_consecutive_absences: 3,
      absence_requires_proof: true,
      proof_required_after_days: 1,
      early_departure_threshold_minutes: 30,
      requires_manager_approval: true,
      min_hours_for_full_day: 8.00,
      min_hours_for_half_day: 4.00,
      auto_mark_absent_if_no_punch: true,
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
    <Modal open={isOpen} onClose={onClose} className="max-w-lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Attendance Policy' : 'Add Attendance Policy'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
        <div>
          <Input
            label="Policy Name"
            {...register('name', { required: 'Policy name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Standard Attendance Policy"
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

        <div>
          <Select
            label="Policy Type"
            {...register('policy_type', { required: true })}
            options={[
              { value: 'general', label: 'General' },
              { value: 'punctuality', label: 'Punctuality' },
              { value: 'absence', label: 'Absence' },
              { value: 'tardiness', label: 'Tardiness' },
              { value: 'early_departure', label: 'Early Departure' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Late Threshold (minutes)"
              type="number"
              {...register('late_threshold_minutes', { 
                required: 'Late threshold is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or more' }
              })}
              error={errors.late_threshold_minutes?.message}
            />
          </div>
          <div>
            <Input
              label="Grace Period (minutes)"
              type="number"
              {...register('grace_period_minutes', { 
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or more' }
              })}
            />
          </div>
        </div>

        <div>
          <Select
            label="Late Action"
            {...register('late_action')}
            options={[
              { value: 'nothing', label: 'No Action' },
              { value: 'warning', label: 'Warning' },
              { value: 'deduction', label: 'Deduction' },
              { value: 'half_day', label: 'Mark as Half Day' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Min Hours for Full Day"
              type="number"
              step="0.5"
              {...register('min_hours_for_full_day', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Input
              label="Min Hours for Half Day"
              type="number"
              step="0.5"
              {...register('min_hours_for_half_day', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Max Consecutive Absences"
              type="number"
              {...register('max_consecutive_absences', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Input
              label="Proof Required After (days)"
              type="number"
              {...register('proof_required_after_days', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <Input
            label="Early Departure Threshold (minutes)"
            type="number"
            {...register('early_departure_threshold_minutes', { valueAsNumber: true })}
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
              id="absence_requires_proof"
              {...register('absence_requires_proof')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="absence_requires_proof" className="ml-2 block text-sm text-gray-900">Absences require proof</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_manager_approval"
              {...register('requires_manager_approval')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="requires_manager_approval" className="ml-2 block text-sm text-gray-900">Requires manager approval</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_mark_absent_if_no_punch"
              {...register('auto_mark_absent_if_no_punch')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="auto_mark_absent_if_no_punch" className="ml-2 block text-sm text-gray-900">Auto-mark absent if no punch</label>
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
