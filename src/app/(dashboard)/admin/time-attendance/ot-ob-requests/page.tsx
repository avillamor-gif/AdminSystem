'use client'

import { useState, useMemo } from 'react'
import { Clock, Search, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, Button, Avatar, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useOvertimeRequests, useApproveOvertimeRequest, useRejectOvertimeRequest } from '@/hooks'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { REQUEST_TYPE_LABELS, DAY_TYPE_LABELS } from '@/services'
import type { OvertimeRequestWithRelations, OvertimeRequestStatus } from '@/services'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<OvertimeRequestStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function RejectModal({ request, approverId, onClose }: {
  request: OvertimeRequestWithRelations
  approverId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const rejectMutation = useRejectOvertimeRequest()

  const handleReject = async () => {
    await rejectMutation.mutateAsync({ id: request.id, approverId, reason })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="sm">
      <ModalHeader>Reject Request</ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 mb-3">
          Rejecting OT/OB request for{' '}
          <strong>{request.employee?.first_name} {request.employee?.last_name}</strong>{' '}
          on {formatDate(request.request_date)}.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleReject} disabled={!reason || rejectMutation.isPending}>
          {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default function OtObRequestsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [rejectTarget, setRejectTarget] = useState<OvertimeRequestWithRelations | null>(null)

  const { data: requests = [], isLoading } = useOvertimeRequests()
  const { data: currentEmployee } = useCurrentEmployee()
  const approveMutation = useApproveOvertimeRequest()

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchType = typeFilter === 'all' || r.request_type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [requests, search, statusFilter, typeFilter])

  const stats = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    totalHours: requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.total_hours ?? 0), 0),
  }), [requests])

  const handleApprove = async (r: OvertimeRequestWithRelations) => {
    await approveMutation.mutateAsync({ id: r.id, approverId: currentEmployee?.id ?? '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OT / OB Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve overtime, stay-on, and official business requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-gray-500 mt-1">Pending Approval</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-gray-500 mt-1">Approved</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.totalHours.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Approved OT Hours</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Types</option>
          <option value="overtime">Overtime</option>
          <option value="stay_on">Stay-On</option>
          <option value="official_business">Official Business</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Day Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={r.employee?.avatar_url}
                            firstName={r.employee?.first_name ?? '?'}
                            lastName={r.employee?.last_name ?? ''}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—'}
                            </div>
                            <div className="text-xs text-gray-400">{r.request_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{REQUEST_TYPE_LABELS[r.request_type]}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(r.request_date)}</td>
                      <td className="px-4 py-3 text-gray-700">{r.start_time} – {r.end_time}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.total_hours?.toFixed(2) ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{DAY_TYPE_LABELS[r.day_type]}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(r)}
                              disabled={approveMutation.isPending}
                              className="text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(r)}
                              className="text-red-400 hover:text-red-600"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          approverId={currentEmployee?.id ?? ''}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
