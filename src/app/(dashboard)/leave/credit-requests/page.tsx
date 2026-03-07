'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useLeaveTypes } from '@/hooks/useLeaveAbsence'
import {
  useMyLeaveCreditRequests,
  useCreateLeaveCreditRequest,
  useDeleteLeaveCreditRequest,
} from '@/hooks/useLeaveCredit'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Plus, Calendar, Trash2, Award } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'

const schema = z.object({
  credit_type: z.enum(['travel', 'weekend_work', 'holiday_work', 'other']),
  work_date_from: z.string().min(1, 'Start date is required'),
  work_date_to: z.string().min(1, 'End date is required'),
  days_requested: z.coerce.number().min(0.5, 'Must be at least 0.5 days').max(30),
  reason: z.string().min(5, 'Please describe the work done'),
  leave_type_id: z.string().min(1, 'Select the leave type to credit'),
  destination: z.string().optional(),
  is_international: z.boolean().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CREDIT_TYPE_LABELS: Record<string, string> = {
  travel: 'Business Travel',
  weekend_work: 'Weekend Work',
  holiday_work: 'Holiday Work',
  other: 'Other',
}

function statusBadge(status: string) {
  if (status === 'approved') return <Badge variant="success">Approved</Badge>
  if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>
  return <Badge variant="warning">Pending</Badge>
}

export default function MyCreditRequestsPage() {
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const { data: requests = [], isLoading } = useMyLeaveCreditRequests(currentEmployee?.id ?? '')
  const createMutation = useCreateLeaveCreditRequest()
  const deleteMutation = useDeleteLeaveCreditRequest()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      credit_type: 'weekend_work',
      is_international: false,
    },
  })

  const creditType = watch('credit_type')
  const fromDate = watch('work_date_from')
  const toDate = watch('work_date_to')

  // Auto-calculate days when dates change
  const autoCalcDays = () => {
    if (fromDate && toDate && toDate >= fromDate) {
      const diff = differenceInCalendarDays(new Date(toDate), new Date(fromDate)) + 1
      setValue('days_requested', diff, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!currentEmployee) return
    const employeeName = `${currentEmployee.first_name} ${currentEmployee.last_name}`
    await createMutation.mutateAsync({
      payload: {
        employee_id: currentEmployee.id,
        credit_type: data.credit_type,
        work_date_from: data.work_date_from,
        work_date_to: data.work_date_to,
        days_requested: data.days_requested,
        reason: data.reason,
        leave_type_id: data.leave_type_id,
        destination: data.destination || null,
        is_international: data.is_international ?? false,
        notes: data.notes || null,
      },
      employeeName,
    })
    reset()
    setShowModal(false)
  }

  const pending = requests.filter((r) => r.status === 'pending').length
  const approved = requests.filter((r) => r.status === 'approved').length
  const totalCredited = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + (r.days_approved ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Credit Requests</h1>
          <p className="text-gray-600 mt-1">
            Apply for additional leave credits earned by working on weekends, holidays, or during business travel.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Apply for Leave Credit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Days Credited</p>
              <p className="text-2xl font-bold text-blue-600">{totalCredited}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Requests</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No leave credit requests yet</p>
              <p className="text-sm mt-1">Click "Apply for Leave Credit" to submit your first request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left font-medium text-gray-600">Type</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Dates</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Days Requested</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Days Approved</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Leave Type</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Reason</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Status</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Submitted</th>
                    <th className="pb-3 text-right font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-800">
                          {CREDIT_TYPE_LABELS[req.credit_type] ?? req.credit_type}
                        </span>
                        {req.destination && (
                          <p className="text-xs text-gray-500 mt-0.5">{req.destination}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {format(new Date(req.work_date_from), 'MMM d')} –{' '}
                        {format(new Date(req.work_date_to), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{req.days_requested}</td>
                      <td className="py-3 pr-4 font-semibold text-green-700">
                        {req.days_approved ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {req.leave_type?.leave_type_name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-[200px] truncate">{req.reason}</td>
                      <td className="py-3 pr-4">{statusBadge(req.status)}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {format(new Date(req.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 text-right">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => setDeleteId(req.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Withdraw request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'rejected' && req.reviewer_notes && (
                          <span className="text-xs text-red-500 italic">{req.reviewer_notes}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Apply Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} size="lg">
        <ModalHeader>Apply for Leave Credit</ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-4">
            {/* Credit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('credit_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekend_work">Weekend Work (Saturday / Sunday)</option>
                <option value="holiday_work">Holiday Work (Public Holiday)</option>
                <option value="travel">Business Travel (on weekends/holidays)</option>
                <option value="other">Other</option>
              </select>
              {errors.credit_type && (
                <p className="text-red-500 text-xs mt-1">{errors.credit_type.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  {...register('work_date_from')}
                  onBlur={autoCalcDays}
                  error={errors.work_date_from?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  {...register('work_date_to')}
                  onBlur={autoCalcDays}
                  error={errors.work_date_to?.message}
                />
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Requested <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                {...register('days_requested')}
                error={errors.days_requested?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated from the date range. You may adjust (e.g. half-days).
              </p>
            </div>

            {/* Leave Type to Credit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit to Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('leave_type_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.leave_type_name}
                  </option>
                ))}
              </select>
              {errors.leave_type_id && (
                <p className="text-red-500 text-xs mt-1">{errors.leave_type_id.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description of Work Done <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder="Briefly describe the work or activity performed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.reason && (
                <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
              )}
            </div>

            {/* Travel-specific fields */}
            {creditType === 'travel' && (
              <div className="space-y-3 border border-blue-100 bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800">Travel Details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <Input
                    {...register('destination')}
                    placeholder="e.g. Cebu City, Davao"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" {...register('is_international')} className="rounded" />
                  International travel (outside the Philippines)
                </label>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes / Reference (optional)
              </label>
              <Input
                {...register('notes')}
                placeholder="e.g. Appendix 19 reference, memo number"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId)
            setDeleteId(null)
          }
        }}
        title="Withdraw Request"
        message="Are you sure you want to withdraw this leave credit request?"
        confirmText="Withdraw"
        variant="danger"
      />
    </div>
  )
}
