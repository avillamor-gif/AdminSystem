'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateTimeTrackingMethod, useUpdateTimeTrackingMethod } from '@/hooks'
import type { TimeTrackingMethod } from '@/services/timeAttendance.service'

interface TimeTrackingMethodFormModalProps {
  isOpen: boolean
  onClose: () => void
  method?: TimeTrackingMethod | null
}

type FormData = Omit<TimeTrackingMethod, 'id' | 'created_at' | 'updated_at' | 'allowed_ip_addresses'> & {
  allowed_ip_addresses?: string
}

export function TimeTrackingMethodFormModal({ isOpen, onClose, method }: TimeTrackingMethodFormModalProps) {
  const createMethod = useCreateTimeTrackingMethod()
  const updateMethod = useUpdateTimeTrackingMethod()
  const isEditing = !!method

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: method ? {
      ...method,
      allowed_ip_addresses: method.allowed_ip_addresses?.join(', ') || ''
    } : {
      name: '',
      description: '',
      method_type: 'mobile_app',
      requires_photo: false,
      requires_location: false,
      geofence_radius_meters: null,
      geofence_latitude: null,
      geofence_longitude: null,
      allowed_ip_addresses: '',
      is_active: true,
      priority: 0
    }
  })

  useEffect(() => {
    if (method) {
      reset({
        ...method,
        allowed_ip_addresses: method.allowed_ip_addresses?.join(', ') || ''
      })
    }
  }, [method, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = {
        ...data,
        allowed_ip_addresses: data.allowed_ip_addresses 
          ? data.allowed_ip_addresses.split(',').map(ip => ip.trim()).filter(Boolean)
          : []
      }
      
      if (isEditing && method) {
        await updateMethod.mutateAsync({ id: method.id, updates: submitData })
      } else {
        await createMethod.mutateAsync(submitData)
      }
      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>{isEditing ? 'Edit Time Tracking Method' : 'Add Time Tracking Method'}</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
        <div>
          <Input
            label="Method Name"
            {...register('name', { required: 'Method name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Mobile App Check-In"
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
            label="Method Type"
            {...register('method_type', { required: true })}
            options={[
              { value: 'biometric', label: 'Biometric' },
              { value: 'rfid', label: 'RFID' },
              { value: 'mobile_app', label: 'Mobile App' },
              { value: 'web_portal', label: 'Web Portal' },
              { value: 'manual', label: 'Manual' },
              { value: 'geofence', label: 'Geofence' },
              { value: 'qr_code', label: 'QR Code' }
            ]}
          />
        </div>

        <div>
          <Input
            label="Priority"
            type="number"
            {...register('priority', { valueAsNumber: true })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Higher priority methods are preferred</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Allowed IP Addresses</label>
          <Input
            {...register('allowed_ip_addresses')}
            placeholder="192.168.1.1, 10.0.0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list of allowed IPs (optional)</p>
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
              id="requires_photo"
              {...register('requires_photo')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="requires_photo" className="ml-2 block text-sm text-gray-900">Requires photo verification</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requires_location"
              {...register('requires_location')}
              className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
            />
            <label htmlFor="requires_location" className="ml-2 block text-sm text-gray-900">Requires location tracking</label>
          </div>
        </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Method' : 'Create Method'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
