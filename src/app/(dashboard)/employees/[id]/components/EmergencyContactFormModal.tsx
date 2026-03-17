'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateEmergencyContact, useUpdateEmergencyContact } from '@/hooks/useEmergencyContacts'
import type { EmergencyContact } from '@/services/emergencyContact.service'

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  mobile_phone: z.string().min(1, 'Mobile phone is required'),
  home_phone: z.string().optional(),
  work_phone: z.string().optional(),
})

type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>

interface EmergencyContactFormModalProps {
  open: boolean
  onClose: () => void
  employeeId: string
  contact?: EmergencyContact
}

export function EmergencyContactFormModal({ 
  open, 
  onClose, 
  employeeId,
  contact 
}: EmergencyContactFormModalProps) {
  const isEdit = !!contact
  const createContact = useCreateEmergencyContact()
  const updateContact = useUpdateEmergencyContact()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          relationship: contact.relationship,
          mobile_phone: contact.mobile_phone,
          home_phone: contact.home_phone || '',
          work_phone: contact.work_phone || '',
        }
      : {
          name: '',
          relationship: '',
          mobile_phone: '',
          home_phone: '',
          work_phone: '',
        }
  })

  useEffect(() => {
    if (open) {
      if (contact) {
        reset({
          name: contact.name,
          relationship: contact.relationship,
          mobile_phone: contact.mobile_phone,
          home_phone: contact.home_phone || '',
          work_phone: contact.work_phone || '',
        })
      } else {
        reset({
          name: '',
          relationship: '',
          mobile_phone: '',
          home_phone: '',
          work_phone: '',
        })
      }
    }
  }, [open, contact, reset])

  const relationshipOptions = [
    { value: '', label: 'Select Relationship' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Child', label: 'Child' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Friend', label: 'Friend' },
    { value: 'Other', label: 'Other' },
  ]

  async function onSubmit(data: EmergencyContactFormData) {
    try {
      console.log('Form data submitted:', data)
      
      const cleanedData = {
        ...data,
        home_phone: data.home_phone || null,
        work_phone: data.work_phone || null,
      }
      
      if (isEdit && contact) {
        console.log('Updating emergency contact:', contact.id)
        await updateContact.mutateAsync({ id: contact.id, data: cleanedData })
      } else {
        console.log('Creating new emergency contact')
        await createContact.mutateAsync({ ...cleanedData, employee_id: employeeId })
      }
      reset()
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>
          {isEdit ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter contact name"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship *
            </label>
            <Select
              id="relationship"
              {...register('relationship')}
              options={relationshipOptions}
              error={errors.relationship?.message}
            />
          </div>

          <div>
            <label htmlFor="mobile_phone" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Phone *
            </label>
            <Input
              id="mobile_phone"
              type="tel"
              {...register('mobile_phone')}
              placeholder="Enter mobile phone"
              error={errors.mobile_phone?.message}
            />
          </div>

          <div>
            <label htmlFor="home_phone" className="block text-sm font-medium text-gray-700 mb-1">
              Home Phone
            </label>
            <Input
              id="home_phone"
              type="tel"
              {...register('home_phone')}
              placeholder="Enter home phone"
              error={errors.home_phone?.message}
            />
          </div>

          <div>
            <label htmlFor="work_phone" className="block text-sm font-medium text-gray-700 mb-1">
              Work Phone
            </label>
            <Input
              id="work_phone"
              type="tel"
              {...register('work_phone')}
              placeholder="Enter work phone"
              error={errors.work_phone?.message}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting || createContact.isPending || updateContact.isPending}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
