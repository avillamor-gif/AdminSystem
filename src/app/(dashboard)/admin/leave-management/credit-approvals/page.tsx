'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import {
  useLeaveCreditRequests,
  useApproveLeaveCreditRequest,
  useRejectLeaveCreditRequest,
  useDeleteLeaveCreditRequest,
} from '@/hooks/useLeaveCredit'
import { type LeaveCreditRequest } from '@/services/leaveCredit.service'
import { CheckCircle, XCircle, Search, Award, Clock, Users, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

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

export default function LeaveCreditApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [reviewModal, setReviewModal] = useState<{ request: LeaveCreditRequest; action: 'approve' | 'reject' } | null>(null)
  const [daysApproved, setDaysApproved] = useState('')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: allRequests = [], isLoading } = useLeaveCreditRequests()
  const approveMutation = useApproveLeaveCreditRequest()
  const rejectMutation = useRejectLeaveCreditRequest()
  const deleteMutation = useDeleteLeaveCreditRequest()

  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      const matchesSearch =
        searchTerm === '' ||
        r.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allRequests, searchTerm, statusFilter])

  const stats = useMemo(() => ({
    pending: allRequests.filter((r) => r.status === 'pending').length,
    approved: allRequests.filter((r) => r.status === 'approved').length,
    total: allRequests.length,
    totalDaysCredited: allRequests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.days_approved ?? 0), 0),
  }), [allRequests])

  const openReview = (request: LeaveCreditRequest, action: 'approve' | 'reject') => {
    setReviewModal({ request, action })
    setDaysApproved(String(request.days_requested))
    setReviewerNotes('')
  }

  const handleSubmitReview = async () => {
    if (!reviewModal || !currentEmployee) return

    if (reviewModal.action === 'approve') {
      const days = parseFloat(daysApproved)
      if (isNaN(days) || days <= 0) return
      await approveMutation.mutateAsync({
        id: reviewModal.request.id,
        days_approved: days,
        reviewed_by: currentEmployee.id,
        reviewer_notes: reviewerNotes || undefined,
      })
    } else {
      if (!reviewerNotes.trim()) return
      await rejectMutation.mutateAsync({
        id: reviewModal.request.id,
        reviewed_by: currentEmployee.id,
        reviewer_notes: reviewerNotes,
      })
    }
    setReviewModal(null)
  }

  const isPending = approveMutation.isPending || rejectMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Credit Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve employee leave credit requests. Approved credits are automatically added to the employee's leave balance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Credited</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalDaysCredited}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No leave credit requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left font-medium text-gray-600">Employee</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Type</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Dates</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Days Req.</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Days Appr.</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Leave Type</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Reason</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Status</th>
                    <th className="pb-3 text-left font-medium text-gray-600">Submitted</th>
                    <th className="pb-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">
                          {req.employee?.first_name} {req.employee?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{req.employee?.employee_id}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-800">
                          {CREDIT_TYPE_LABELS[req.credit_type] ?? req.credit_type}
                        </span>
                        {req.destination && (
                          <p className="text-xs text-gray-500">{req.destination}</p>
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
                      <td className="py-3 pr-4 text-gray-600 max-w-[180px]">
                        <p className="truncate">{req.reason}</p>
                        {req.reviewer_notes && (
                          <p className="text-xs text-red-500 mt-0.5 italic truncate">
                            Note: {req.reviewer_notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(req.status)}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {format(new Date(req.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openReview(req, 'approve')}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openReview(req, 'reject')}
                                className="text-red-500 hover:text-red-700"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteId(req.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      {reviewModal && (
        <Modal open onClose={() => setReviewModal(null)}>
          <ModalHeader>
            {reviewModal.action === 'approve' ? '✅ Approve Leave Credit' : '❌ Reject Leave Credit'}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p>
                <span className="font-medium">Employee:</span>{' '}
                {reviewModal.request.employee?.first_name} {reviewModal.request.employee?.last_name}
              </p>
              <p>
                <span className="font-medium">Type:</span>{' '}
                {CREDIT_TYPE_LABELS[reviewModal.request.credit_type]}
              </p>
              <p>
                <span className="font-medium">Dates:</span>{' '}
                {format(new Date(reviewModal.request.work_date_from), 'MMM d')} –{' '}
                {format(new Date(reviewModal.request.work_date_to), 'MMM d, yyyy')}
              </p>
              <p>
                <span className="font-medium">Days Requested:</span>{' '}
                {reviewModal.request.days_requested}
              </p>
              <p>
                <span className="font-medium">Leave Type:</span>{' '}
                {reviewModal.request.leave_type?.leave_type_name ?? '—'}
              </p>
              <p>
                <span className="font-medium">Reason:</span> {reviewModal.request.reason}
              </p>
            </div>

            {reviewModal.action === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days to Approve <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={daysApproved}
                  onChange={(e) => setDaysApproved(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You may adjust the days before approving. These will be automatically credited to the employee's leave balance.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {reviewModal.action === 'reject' ? (
                  <>Reason for Rejection <span className="text-red-500">*</span></>
                ) : (
                  'Notes (optional)'
                )}
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder={
                  reviewModal.action === 'reject'
                    ? 'Required: explain why this request is rejected'
                    : 'Optional remarks'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setReviewModal(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewModal.action === 'approve' ? 'primary' : 'danger'}
              onClick={handleSubmitReview}
              disabled={
                isPending ||
                (reviewModal.action === 'reject' && !reviewerNotes.trim()) ||
                (reviewModal.action === 'approve' && (!daysApproved || parseFloat(daysApproved) <= 0))
              }
            >
              {isPending
                ? 'Processing...'
                : reviewModal.action === 'approve'
                ? 'Approve & Credit Balance'
                : 'Reject Request'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

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
        title="Delete Request"
        message="Are you sure you want to permanently delete this leave credit request?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
