'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateDepartment, useUpdateDepartment, useDepartments } from '@/hooks'
import type { Department } from '@/services'

const departmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

interface DepartmentFormModalProps {
  open: boolean
  onClose: () => void
  department?: Department | null
}

export function DepartmentFormModal({ open, onClose, department }: DepartmentFormModalProps) {
  const isEdit = !!department
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const { data: allDepartments = [] } = useDepartments()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department
      ? { name: department.name, description: department.description || '', parent_id: department.parent_id || '' }
      : {},
  })

  useEffect(() => {
    if (open) {
      if (department) {
        reset({
          name: department.name,
          description: department.description || '',
          parent_id: department.parent_id || '',
        })
      } else {
        reset({
          name: '',
          description: '',
          parent_id: '',
        })
      }
    }
  }, [open, department, reset])

  // Filter out the current department and its descendants to prevent circular references
  const availableParents = allDepartments.filter(d => {
    if (!isEdit) return true
    if (d.id === department?.id) return false
    // TODO: Also filter out descendants to prevent circular references
    return true
  })

  const parentOptions = [
    { value: '', label: 'No Parent (Root Level)' },
    ...availableParents.map(d => ({ value: d.id, label: d.name })),
  ]

  async function onSubmit(data: DepartmentFormData) {
    try {
      const cleanedData = {
        ...data,
        parent_id: data.parent_id || null,
      }
      
      if (isEdit && department) {
        await updateDepartment.mutateAsync({ id: department.id, data: cleanedData })
      } else {
        await createDepartment.mutateAsync(cleanedData)
      }
      reset()
      onClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>
        {isEdit ? 'Edit Department' : 'Add Department'}
      </ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-4">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Select
            label="Parent Department"
            options={parentOptions}
            error={errors.parent_id?.message}
            {...register('parent_id')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="Optional description..."
              {...register('description')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Department'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
