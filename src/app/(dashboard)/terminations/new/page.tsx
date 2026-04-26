'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import { useCreateTerminationRequest } from '@/hooks/useTerminations'
import toast from 'react-hot-toast'

const terminationSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  termination_type: z.enum(['voluntary_resignation', 'retirement', 'contract_end', 'termination_with_cause', 'termination_without_cause', 'layoff', 'mutual_agreement']),
  termination_reason: z.enum([
    'Contract Not Renewed',
    'Deceased',
    'Dismissed',
    'Laid-off',
    'Other',
    'Physically Disabled/Compensated',
    'Resigned',
    'Resigned - Company Requested',
    'Resigned - Self Proposed',
    'Retired',
  ], { required_error: 'Termination reason is required' }),
  proposed_last_working_date: z.string().min(1, 'Last working date is required'),
  notice_period_days: z.number().int().min(0).optional(),
  notice_date: z.string().optional(),
  notes: z.string().optional(),
})

type TerminationFormData = z.infer<typeof terminationSchema>

export default function NewTerminationPage() {
  const router = useRouter()
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const createMutation = useCreateTerminationRequest()

  const { register, handleSubmit, formState: { errors } } = useForm<TerminationFormData>({
    resolver: zodResolver(terminationSchema),
  })

  const onSubmit = async (data: TerminationFormData) => {
    try {
      // Generate request number
      const requestNumber = `TERM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      const result = await createMutation.mutateAsync({
        ...data,
        request_number: requestNumber,
        status: 'pending',
      } as any)
      
      toast.success('Termination request created successfully')
      router.push(`/terminations/${result.id}`)
    } catch (error) {
      console.error('Error creating termination:', error)
      toast.error('Failed to create termination request')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Termination Request</h1>
            <p className="text-gray-600 mt-1">Create a new employee termination request</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Employee Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              {...register('employee_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>}
          </div>
        </Card>

        {/* Termination Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Termination Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termination Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('termination_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Type</option>
                <option value="voluntary_resignation">Voluntary Resignation</option>
                <option value="retirement">Retirement</option>
                <option value="contract_end">Contract End</option>
                <option value="termination_with_cause">Termination With Cause</option>
                <option value="termination_without_cause">Termination Without Cause</option>
                <option value="layoff">Layoff</option>
                <option value="mutual_agreement">Mutual Agreement</option>
              </select>
              {errors.termination_type && <p className="mt-1 text-sm text-red-600">{errors.termination_type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termination Reason <span className="text-red-500">*</span>
              </label>
              <select
                {...register('termination_reason')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select reason...</option>
                <option value="Contract Not Renewed">Contract Not Renewed</option>
                <option value="Deceased">Deceased</option>
                <option value="Dismissed">Dismissed</option>
                <option value="Laid-off">Laid-off</option>
                <option value="Other">Other</option>
                <option value="Physically Disabled/Compensated">Physically Disabled/Compensated</option>
                <option value="Resigned">Resigned</option>
                <option value="Resigned - Company Requested">Resigned - Company Requested</option>
                <option value="Resigned - Self Proposed">Resigned - Self Proposed</option>
                <option value="Retired">Retired</option>
              </select>
              {errors.termination_reason && <p className="mt-1 text-sm text-red-600">{errors.termination_reason.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Proposed Last Working Date"
                type="date"
                {...register('proposed_last_working_date')}
                error={errors.proposed_last_working_date?.message}
                required
              />
              <Input
                label="Notice Date"
                type="date"
                {...register('notice_date')}
                error={errors.notice_date?.message}
              />
              <Input
                label="Notice Period (days)"
                type="number"
                {...register('notice_period_days', { valueAsNumber: true })}
                error={errors.notice_period_days?.message}
                placeholder="e.g., 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Any additional information..."
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
