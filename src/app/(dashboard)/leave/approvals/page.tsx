'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import {
  useTeamPendingRequests,
  useApproveDirectLeaveRequest,
  useRejectDirectLeaveRequest,
} from '@/hooks/useLeaveRequests'
import type { LeaveRequest } from '@/services/leaveRequest.service'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useNotifications } from '@/hooks/useNotifications'
import { CheckCircle, XCircle, Clock, User, Calendar, GitBranch } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const approvalSchema = z.object({
  comments: z.string().optional(),
})

type ApprovalForm = z.infer<typeof approvalSchema>

export default function ApprovalDashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  const { data: currentEmployee } = useCurrentEmployee()
  const { markLeaveNotifReadByRequestId } = useNotifications()
  const { data: pendingRequests = [], isLoading } = useTeamPendingRequests(currentEmployee?.id || '')
  const approveMutation = useApproveDirectLeaveRequest()
  const rejectMutation = useRejectDirectLeaveRequest()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApprovalForm>({
    resolver: zodResolver(approvalSchema),
  })

  const statistics = useMemo(() => ({
    total: pendingRequests.length,
    overdue: 0,
    dueToday: 0,
  }), [pendingRequests])

  const handleOpenModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setApprovalAction(action)
    reset()
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedRequest(null)
    reset()
  }

  const onSubmit = async (data: ApprovalForm) => {
    if (!selectedRequest) return

    let result: any
    if (approvalAction === 'approve') {
      result = await approveMutation.mutateAsync({
        leave_request_id: selectedRequest.id,
        comments: data.comments,
      })
    } else {
      result = await rejectMutation.mutateAsync({
        leave_request_id: selectedRequest.id,
        comments: data.comments || 'Request rejected',
      })
    }
    // Dismiss the bell notification now that action has been taken
    await markLeaveNotifReadByRequestId(selectedRequest.id)
    // If the route indicated more steps are pending, show a specific message
    if ((result as any)?.pending_steps) {
      // toast already shown by mutation; no extra action needed
    }
    handleCloseModal()
  }

  if (!currentEmployee && !isLoading) {
    return <div className="p-6 text-gray-500">Loading employee data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve leave requests from your team</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.dueToday}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Requests List */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p>No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => {
              const employee = (request as any).employee
              const leaveType = (request as any).leave_type

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {employee?.first_name} {employee?.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {employee?.employee_id}</p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: leaveType?.color_code || '#6B7280' }}
                    >
                      {leaveType?.leave_type_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium">{format(new Date(request.start_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <p className="font-medium">{format(new Date(request.end_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">{request.total_days} days</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested:</span>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-3 p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600 font-medium">Reason:</span>
                      <p className="text-sm text-gray-800 mt-1">{request.reason}</p>
                    </div>
                  )}

                  {/* Workflow step progress */}
                  {(request as any).workflow && (request as any).approvals?.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-100">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mb-2">
                        <GitBranch className="w-3 h-3" />
                        Workflow: {(request as any).workflow.workflow_name}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(request as any).approvals.map((step: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1">
                            {idx > 0 && <span className="text-gray-400 text-xs">→</span>}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              step.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : step.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✗' : '…'}
                              {' '}{step.approver_role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(request, 'reject')}
                      className="text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleOpenModal(request, 'approve')}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Approval Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader onClose={handleCloseModal}>
            {approvalAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Employee:</span>
                      <p className="font-medium">
                        {(selectedRequest as any).employee?.first_name}{' '}
                        {(selectedRequest as any).employee?.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Leave Type:</span>
                      <p className="font-medium">
                        {(selectedRequest as any).leave_type?.leave_type_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">{selectedRequest.total_days} days</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dates:</span>
                      <p className="font-medium">
                        {format(new Date(selectedRequest.start_date), 'MMM d')}
                        {' – '}
                        {format(new Date(selectedRequest.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments {approvalAction === 'reject' && '(Required for rejection)'}
                  </label>
                  <textarea
                    {...register('comments')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      approvalAction === 'approve'
                        ? 'Add optional comments...'
                        : 'Provide reason for rejection...'
                    }
                  />
                  {errors.comments && (
                    <p className="text-red-600 text-sm mt-1">{errors.comments.message}</p>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={approvalAction === 'reject' ? 'danger' : 'primary'}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Processing...'
                : approvalAction === 'approve'
                ? 'Approve Request'
                : 'Reject Request'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
