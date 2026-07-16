'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MissingPunchRequest {
  id: string
  enrollment_id: string
  date: string
  time_in: string
  time_out: string | null
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  requested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  reviewed_notes: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
}

function formatTime(time: string): string {
  if (!time) return '—'
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const m = parseInt(minutes)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${minutes} ${ampm}`
}

function calculateHours(timeIn: string, timeOut: string | null): string {
  if (!timeIn || !timeOut) return '—'
  const [inH, inM] = timeIn.split(':').map(Number)
  const [outH, outM] = timeOut.split(':').map(Number)
  const inMins = inH * 60 + inM
  const outMins = outH * 60 + outM
  const diffMins = Math.max(0, outMins - inMins)
  const hours = (diffMins / 60).toFixed(2)
  return `${hours}h`
}

export default function MissingPunchRequestsPage() {
  const [requests, setRequests] = useState<MissingPunchRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<MissingPunchRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  async function fetchRequests() {
    setIsLoading(true)
    try {
      const url = statusFilter === 'all'
        ? '/api/internship/missing-punch-requests'
        : `/api/internship/missing-punch-requests?status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        setRequests(await res.json())
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReview(status: 'approved' | 'rejected') {
    if (!selectedRequest) return
    setIsReviewing(true)
    try {
      const res = await fetch('/api/internship/missing-punch-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status,
          reviewed_notes: reviewNotes || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to review request')
      }
      toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'}. Hours will be ${status === 'approved' ? 'added to' : 'not added to'} the participant's total.`)
      setSelectedRequest(null)
      setReviewNotes('')
      await fetchRequests()
    } catch (e: any) {
      toast.error(e.message || 'Failed to review request')
    } finally {
      setIsReviewing(false)
    }
  }

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Missing Punch Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve missing punch requests from interns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Time In', 'Time Out', 'Hours', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No requests found.</td>
                </tr>
              ) : filtered.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatDate(req.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatTime(req.time_in)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{req.time_out ? formatTime(req.time_out) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-cyan-700">{calculateHours(req.time_in, req.time_out)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[req.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcons[req.status]}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setSelectedRequest(req); setReviewNotes('') }}
                      >
                        Review
                      </Button>
                    )}
                    {req.status !== 'pending' && (
                      <button
                        onClick={() => { setSelectedRequest(req); setReviewNotes(req.reviewed_notes || '') }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        View notes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {selectedRequest && (
        <Modal open={!!selectedRequest} onClose={() => { setSelectedRequest(null); setReviewNotes('') }} size="lg">
          <ModalHeader onClose={() => { setSelectedRequest(null); setReviewNotes('') }}>
            {selectedRequest.status === 'pending' ? 'Review Missing Punch Request' : 'View Request Details'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Date</p>
                  <p className="text-gray-900 font-medium">{formatDate(selectedRequest.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Time In</p>
                  <p className="text-gray-900 font-medium">{formatTime(selectedRequest.time_in)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Time Out</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.time_out ? formatTime(selectedRequest.time_out) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Hours</p>
                  <p className="text-gray-900 font-medium">{calculateHours(selectedRequest.time_in, selectedRequest.time_out)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Reason</p>
                <p className="text-gray-900 font-medium">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status === 'pending' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Add any notes for the intern (e.g., 'Verified with supervisor')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-500 uppercase tracking-wide font-medium mb-1">Status</p>
                    <p className="text-blue-800">
                      {selectedRequest.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      {selectedRequest.reviewed_at && (
                        <span className="text-xs text-blue-600 ml-2">on {formatDate(selectedRequest.reviewed_at)}</span>
                      )}
                    </p>
                  </div>
                  {selectedRequest.reviewed_notes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Notes</p>
                      <p className="text-gray-900">{selectedRequest.reviewed_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ModalBody>
          {selectedRequest.status === 'pending' && (
            <ModalFooter>
              <Button variant="secondary" onClick={() => { setSelectedRequest(null); setReviewNotes('') }} disabled={isReviewing}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReview('rejected')}
                disabled={isReviewing}
              >
                {isReviewing ? 'Processing…' : 'Reject'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReview('approved')}
                disabled={isReviewing}
              >
                {isReviewing ? 'Processing…' : 'Approve & Add Hours'}
              </Button>
            </ModalFooter>
          )}
        </Modal>
      )}
    </div>
  )
}
