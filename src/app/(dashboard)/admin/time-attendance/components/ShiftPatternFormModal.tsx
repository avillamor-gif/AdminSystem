'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateShiftPattern, useUpdateShiftPattern } from '@/hooks'
import type { ShiftPattern } from '@/services/timeAttendance.service'

interface ShiftPatternFormModalProps {
  isOpen: boolean
  onClose: () => void
  shift?: ShiftPattern | null
}

type FormData = Omit<ShiftPattern, 'id' | 'created_at' | 'updated_at' | 'duration_hours'>

export function ShiftPatternFormModal({ isOpen, onClose, shift }: ShiftPatternFormModalProps) {
  const createShift = useCreateShiftPattern()
  const updateShift = useUpdateShiftPattern()
  const isEditing = !!shift

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: shift || {
      name: '',
      description: '',
      shift_code: '',
      shift_type: 'morning',
      start_time: '09:00:00',
      end_time: '17:00:00',
      break_minutes: 60,
      color_code: '#3B82F6',
      is_active: true,
      overnight: false
    }
  })

  useEffect(() => {
    if (shift) {
      reset(shift)
    } else {
      reset({
        name: '',
        description: '',
        shift_code: '',
        shift_type: 'morning',
        start_time: '09:00:00',
        end_time: '17:00:00',
        break_minutes: 60,
        color_code: '#3B82F6',
        is_active: true,
        overnight: false
      })
    }
  }, [shift, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && shift) {
        await updateShift.mutateAsync({ id: shift.id, updates: data })
      } else {
        await createShift.mutateAsync(data)
      }
      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Shift Pattern' : 'Add Shift Pattern'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Shift Name"
              {...register('name', { required: 'Shift name is required' })}
              error={errors.name?.message}
              placeholder="e.g., Morning Shift"
            />
          </div>
          <div>
            <Input
              label="Shift Code"
              {...register('shift_code', { required: 'Shift code is required' })}
              error={errors.shift_code?.message}
              placeholder="e.g., MOR"
              className="uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={2}
            placeholder="Brief description..."
          />
        </div>

        <div>
          <Select
            label="Shift Type"
            {...register('shift_type', { required: true })}
            options={[
              { value: 'morning', label: 'Morning' },
              { value: 'afternoon', label: 'Afternoon' },
              { value: 'evening', label: 'Evening' },
              { value: 'night', label: 'Night' },
              { value: 'rotating', label: 'Rotating' },
              { value: 'split', label: 'Split' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Start Time"
              type="time"
              {...register('start_time', { required: 'Start time is required' })}
              error={errors.start_time?.message}
            />
          </div>
          <div>
            <Input
              label="End Time"
              type="time"
              {...register('end_time', { required: 'End time is required' })}
              error={errors.end_time?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Break Minutes"
              type="number"
              {...register('break_minutes', { 
                required: 'Break minutes is required',
                min: { value: 0, message: 'Must be 0 or more' }
              })}
              error={errors.break_minutes?.message}
            />
          </div>
          <div>
            <Input
              label="Color Code"
              type="color"
              {...register('color_code')}
              className="h-10"
            />
          </div>
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
              id="overnight"
              {...register('overnight')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="overnight" className="ml-2 block text-sm text-gray-900">
              Overnight shift (crosses midnight)
            </label>
          </div>
        </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Shift' : 'Create Shift'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
