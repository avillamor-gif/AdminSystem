'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCreateEmployee, useUpdateEmployee, useDepartments, useJobTitles, useLocations, useEmploymentTypes } from '@/hooks'
import { generateEmployeeId } from '@/lib/utils'
import { logAction } from '@/services/auditLog.service'
import type { Employee, Department, JobTitle, Location } from '@/services'

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  hire_date: z.string().min(1, 'Hire date is required'),
  department_id: z.string().optional(),
  job_title_id: z.string().optional(),
  location_id: z.string().optional(),
  employment_type_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  employee?: Employee
}

export function EmployeeFormModal({ open, onClose, employee }: EmployeeFormModalProps) {
  const router = useRouter()
  const isEdit = !!employee
  const { data: departments } = useDepartments()
  const { data: jobTitles } = useJobTitles()
  const { data: locations } = useLocations()
  const { data: employmentTypes = [] } = useEmploymentTypes()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  // Typed departments, job titles, and locations
  const typedDepartments = (departments || []) as Department[]
  const typedJobTitles = (jobTitles || []) as JobTitle[]
  const typedLocations = (locations || []) as Location[]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          hire_date: employee.hire_date,
          department_id: employee.department_id || '',
          job_title_id: employee.job_title_id || '',
          location_id: employee.location_id || '',
          employment_type_id: (employee as any).employment_type_id || '',
          status: (employee.status ?? 'active') as 'active' | 'inactive' | 'terminated',
        }
      : {
          status: 'active',
          hire_date: new Date().toISOString().split('T')[0],
        },
  })

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...typedDepartments.map((d) => ({ value: d.id, label: d.name })),
  ]

  const jobTitleOptions = [
    { value: '', label: 'Select Job Title' },
    ...typedJobTitles.map((jt) => ({ value: jt.id, label: jt.title })),
  ]

  const locationOptions = [
    { value: '', label: 'Select Location' },
    ...typedLocations.map((loc) => ({ value: loc.id, label: loc.name })),
  ]

  const employmentTypeOptions = [
    { value: '', label: 'Select Employment Type' },
    ...employmentTypes.map((et) => ({ value: et.id, label: et.name })),
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'terminated', label: 'Terminated' },
  ]

  // Reset form when employee changes or modal opens
  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          hire_date: employee.hire_date,
          department_id: employee.department_id || '',
          job_title_id: employee.job_title_id || '',
          location_id: employee.location_id || '',
          employment_type_id: (employee as any).employment_type_id || '',
          status: (employee.status ?? 'active') as 'active' | 'inactive' | 'terminated',
        })
      } else {
        reset({
          first_name: '',
          last_name: '',
          email: '',
          hire_date: new Date().toISOString().split('T')[0],
          department_id: '',
          job_title_id: '',
          location_id: '',
          employment_type_id: '',
          status: 'active',
        })
      }
    }
  }, [open, employee, reset])

  async function onSubmit(data: EmployeeFormData) {
    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = {
        ...data,
        department_id: data.department_id || null,
        job_title_id: data.job_title_id || null,
        location_id: data.location_id || null,
        employment_type_id: data.employment_type_id || null,
      }
      
      if (isEdit && employee) {
        await updateEmployee.mutateAsync({ id: employee.id, data: cleanedData })
        await logAction({
          employee_id: employee.id,
          action: 'Employee Record Updated',
          details: `Updated employee record for ${cleanedData.first_name} ${cleanedData.last_name}`,
        })
        reset()
        onClose()
      } else {
        // Create new employee and redirect to detail page
        const employeeId = generateEmployeeId(cleanedData.hire_date)
        const newEmployee = await createEmployee.mutateAsync({
          ...cleanedData,
          employee_id: employeeId,
        })
        await logAction({
          employee_id: newEmployee.id,
          action: 'Employee Created',
          details: `New employee created: ${cleanedData.first_name} ${cleanedData.last_name} (${employeeId})`,
        })
        reset()
        onClose()
        // Redirect to employee detail page to fill in complete profile
        router.push(`/employees/${employeeId}`)
      }
    } catch (error) {
      // Error handled by mutation
      console.error('Form submission error:', error)
    }
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>
        {isEdit ? 'Edit Employee' : 'Add New Employee'}
      </ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Hire Date"
            type="date"
            error={errors.hire_date?.message}
            {...register('hire_date')}
          />
          <Select
            label="Department"
            options={departmentOptions}
            error={errors.department_id?.message}
            {...register('department_id')}
          />
          <Select
            label="Job Title"
            options={jobTitleOptions}
            error={errors.job_title_id?.message}
            {...register('job_title_id')}
          />
          <Select
            label="Location"
            options={locationOptions}
            error={errors.location_id?.message}
            {...register('location_id')}
          />
          <Select
            label="Employment Type"
            options={employmentTypeOptions}
            error={errors.employment_type_id?.message}
            {...register('employment_type_id')}
          />
          <Select
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
