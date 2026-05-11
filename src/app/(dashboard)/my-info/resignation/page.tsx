'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, LogOut, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useCreateTerminationRequest } from '@/hooks/useTerminations'
import { localDateStr } from '@/lib/utils'
import toast from 'react-hot-toast'

const resignationSchema = z.object({
  proposed_last_working_date: z.string().min(1, 'Last working date is required'),
  notice_date: z.string().optional(),
  notes: z.string().min(10, 'Please provide a brief resignation message (at least 10 characters)'),
})

type ResignationForm = z.infer<typeof resignationSchema>

// Minimum 30-day notice from today
function minLastWorkingDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return localDateStr(d)
}

export default function ResignationPage() {
  const router = useRouter()
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateTerminationRequest()
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResignationForm>({
    resolver: zodResolver(resignationSchema),
    defaultValues: {
      notice_date: localDateStr(new Date()),
    },
  })

  const onSubmit = async (data: ResignationForm) => {
    if (!currentEmployee?.id) {
      toast.error('Could not determine your employee record. Please contact HR.')
      return
    }

    const today = localDateStr(new Date())
    const noticeDate = data.notice_date || today
    const lastDay = data.proposed_last_working_date
    const noticeDays = Math.ceil(
      (new Date(lastDay).getTime() - new Date(noticeDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    const requestNumber = `RES-${Date.now().toString().slice(-8)}`

    try {
      await createMutation.mutateAsync({
        employee_id: currentEmployee.id,
        request_number: requestNumber,
        termination_type: 'voluntary_resignation',
        termination_reason: 'Resigned',
        proposed_last_working_date: lastDay,
        notice_date: noticeDate,
        notice_period_days: noticeDays,
        notes: data.notes,
        is_resignation: true,
        requested_by: currentEmployee.id,
        status: 'pending',
      } as any)
      setSubmitted(true)
    } catch {
      toast.error('Failed to submit resignation. Please try again or contact HR.')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <LogOut className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Resignation Submitted</h2>
        <p className="text-gray-600 text-sm">
          Your resignation has been submitted and is pending HR review. You will be notified of the next steps.
          Please coordinate with your immediate supervisor for work handover.
        </p>
        <Button variant="secondary" onClick={() => router.push('/my-info')}>
          Back to My Info
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/my-info')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Resignation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hello{currentEmployee ? `, ${currentEmployee.first_name}` : ''}. This form will submit your resignation to HR for processing.
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1">
          <div className="font-medium">Important: 30-Day Notice Period</div>
          <div>Per IBON policy, employees must provide a minimum of <strong>30 calendar days</strong> notice before their last working day. Your last working date must be at least 30 days from today.</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resignation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Notice *
              </label>
              <input
                type="date"
                {...register('notice_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intended Last Working Date *
              </label>
              <input
                type="date"
                min={minLastWorkingDate()}
                {...register('proposed_last_working_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.proposed_last_working_date && (
                <p className="text-xs text-red-500 mt-1">{errors.proposed_last_working_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resignation Message / Reason *
              </label>
              <textarea
                rows={5}
                {...register('notes')}
                placeholder="Please provide your reason for resigning and any important notes for HR…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.notes && (
                <p className="text-xs text-red-500 mt-1">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="danger"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Submitting…' : 'Submit Resignation'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => router.push('/my-info')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
