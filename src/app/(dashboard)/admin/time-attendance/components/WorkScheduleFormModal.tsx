'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateWorkSchedule, useUpdateWorkSchedule } from '@/hooks'
import type { WorkSchedule } from '@/services/timeAttendance.service'

interface WorkScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  schedule?: WorkSchedule | null
}

type FormData = {
  name: string
  description: string
  schedule_type: 'fixed' | 'flexible' | 'rotating' | 'compressed'
  hours_per_week: number
  days_per_week: number
  is_active: boolean
  is_default: boolean
}

export function WorkScheduleFormModal({ isOpen, onClose, schedule }: WorkScheduleFormModalProps) {
  const createSchedule = useCreateWorkSchedule()
  const updateSchedule = useUpdateWorkSchedule()
  const isEditing = !!schedule

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: schedule ? {
      ...schedule,
      description: schedule.description || ''
    } : {
      name: '',
      description: '',
      schedule_type: 'fixed',
      hours_per_week: 40,
      days_per_week: 5,
      is_active: true,
      is_default: false
    }
  })

  useEffect(() => {
    if (schedule) {
      reset({
        ...schedule,
        description: schedule.description || ''
      })
    } else {
      reset({
        name: '',
        description: '',
        schedule_type: 'fixed',
        hours_per_week: 40,
        days_per_week: 5,
        is_active: true,
        is_default: false
      })
    }
  }, [schedule, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, updates: data })
      } else {
        await createSchedule.mutateAsync(data)
      }
      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} className="max-w-lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Work Schedule' : 'Add Work Schedule'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
          <div>
            <Input
              label="Schedule Name"
              {...register('name', { required: 'Schedule name is required' })}
              error={errors.name?.message}
              placeholder="e.g., Standard 40-Hour Week"
            />
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            placeholder="Brief description of this schedule..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Schedule Type"
              {...register('schedule_type', { required: true })}
              options={[
                { value: 'fixed', label: 'Fixed' },
                { value: 'flexible', label: 'Flexible' },
                { value: 'rotating', label: 'Rotating' },
                { value: 'compressed', label: 'Compressed' }
              ]}
            />
          </div>

          <div>
            <Input
              label="Hours per Week"
              type="number"
              step="0.5"
              {...register('hours_per_week', { 
                required: 'Hours per week is required',
                min: { value: 1, message: 'Must be at least 1 hour' },
                max: { value: 168, message: 'Cannot exceed 168 hours' }
              })}
              error={errors.hours_per_week?.message}
            />
          </div>
        </div>

        <div>
          <Input
            label="Days per Week"
            type="number"
            {...register('days_per_week', { 
              required: 'Days per week is required',
              min: { value: 1, message: 'Must be at least 1 day' },
              max: { value: 7, message: 'Cannot exceed 7 days' }
            })}
            error={errors.days_per_week?.message}
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
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              {...register('is_default')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
              Set as default schedule
            </label>
          </div>
        </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
