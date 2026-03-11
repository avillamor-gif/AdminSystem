'use client'

import React, { useState } from 'react'
import { Plane, MapPin, Calendar, DollarSign, Clock, Eye, X, CheckCircle, XCircle, AlertTriangle, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useTravelRequests, useCancelTravelRequest } from '@/hooks/useTravel'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:            { label: 'Draft',            color: 'bg-gray-100 text-gray-700',   icon: Clock },
  submitted:        { label: 'Submitted',        color: 'bg-blue-100 text-blue-700',   icon: Clock },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved:         { label: 'Approved',         color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected:         { label: 'Rejected',         color: 'bg-red-100 text-red-700',     icon: XCircle },
  cancelled:        { label: 'Cancelled',        color: 'bg-gray-100 text-gray-500',   icon: XCircle },
}

export default function MyTravelRequestsPage() {
  const router = useRouter()
  const { data: currentEmployee } = useCurrentEmployee()
  const employeeId = currentEmployee?.id
  const { data: myRequests = [], isLoading } = useTravelRequests(
    employeeId ? { employee_id: employeeId } : {},
    !!employeeId  // don't fetch until we know who the current employee is
  )
  const cancelMutation = useCancelTravelRequest()

  const [viewRequest, setViewRequest] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = statusFilter
    ? myRequests.filter(r => r.status === statusFilter)
    : myRequests

  // Stats
  const pending  = myRequests.filter(r => r.status === 'submitted' || r.status === 'pending_approval').length
  const approved = myRequests.filter(r => r.status === 'approved').length
  const rejected = myRequests.filter(r => r.status === 'rejected').length
  const totalCost = myRequests
    .filter(r => r.status === 'approved')
    .reduce((s, r) => s + (r.estimated_cost ?? 0), 0)

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this travel request?')) return
    await cancelMutation.mutateAsync(id)
  }

  const cfg = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG['draft']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Travel Requests</h1>
          <p className="text-gray-600 mt-1">Track and manage your business travel requests</p>
        </div>
        <Button onClick={() => router.push('/travel/new-request')}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center text-center">
          <Plane className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myRequests.length}</p>
          <p className="text-xs text-gray-500">Total Requests</p>
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <Clock className="w-6 h-6 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-600">{approved}</p>
          <p className="text-xs text-gray-500">Approved</p>
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-600">₱{totalCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Approved Cost</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          {['', 'draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading your requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Plane className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No travel requests found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter ? 'Try a different filter' : 'Click "New Request" to submit your first travel request'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Request #', 'Destination', 'Travel Dates', 'Duration', 'Est. Cost', 'Purpose', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(req => {
                  const s = cfg(req.status ?? 'draft')
                  const Icon = s.icon
                  const canCancel = req.status === 'draft' || req.status === 'submitted'
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{req.request_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900">{req.destination}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{req.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{formatDate(req.start_date)}</div>
                        <div className="text-xs text-gray-400">to {formatDate(req.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{req.duration} day{req.duration !== 1 ? 's' : ''}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">₱{(req.estimated_cost ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[160px] truncate">{req.purpose}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewRequest(req)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Cancel request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Detail Modal */}
      {viewRequest && (
        <Modal open={!!viewRequest} onClose={() => setViewRequest(null)} size="lg">
          <ModalHeader onClose={() => setViewRequest(null)}>
            Travel Request — {viewRequest.request_number}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* Status banner */}
              {(() => {
                const s = cfg(viewRequest.status ?? 'draft')
                const Icon = s.icon
                return (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${s.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{s.label}</span>
                    {viewRequest.rejection_reason && (
                      <span className="text-sm ml-2">— {viewRequest.rejection_reason}</span>
                    )}
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Destination</p>
                  <p className="font-medium text-gray-900">{viewRequest.destination}, {viewRequest.country}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Purpose</p>
                  <p className="font-medium text-gray-900">{viewRequest.purpose}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Travel Dates</p>
                  <p className="font-medium text-gray-900">{formatDate(viewRequest.start_date)} → {formatDate(viewRequest.end_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Duration</p>
                  <p className="font-medium text-gray-900">{viewRequest.duration} day{viewRequest.duration !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Estimated Cost</p>
                  <p className="font-medium text-gray-900">₱{(viewRequest.estimated_cost ?? 0).toLocaleString()} {viewRequest.currency ?? ''}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Transport Mode</p>
                  <p className="font-medium text-gray-900 capitalize">{viewRequest.transport_mode ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Urgency</p>
                  <p className="font-medium text-gray-900 capitalize">{viewRequest.urgency ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Accommodation</p>
                  <p className="font-medium text-gray-900">{viewRequest.accommodation_required ? 'Required' : 'Not required'}</p>
                </div>
                {viewRequest.budget_code && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Budget Code</p>
                    <p className="font-medium text-gray-900">{viewRequest.budget_code}</p>
                  </div>
                )}
                {viewRequest.cost_center && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Cost Center</p>
                    <p className="font-medium text-gray-900">{viewRequest.cost_center}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-xs font-medium uppercase mb-1">Business Justification</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{viewRequest.business_justification}</p>
              </div>

              {viewRequest.approved_date && (
                <div className="text-xs text-gray-400">
                  {viewRequest.status === 'approved' ? 'Approved' : 'Actioned'} on {formatDate(viewRequest.approved_date)}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewRequest(null)}>Close</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
