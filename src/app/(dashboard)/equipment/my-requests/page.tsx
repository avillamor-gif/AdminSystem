'use client'

import { useState } from 'react'
import { FileText, Clock, CheckCircle, Package, XCircle, Ban } from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useAssetRequests, useUpdateAssetRequest } from '@/hooks/useAssets'
import { useCurrentEmployee } from '@/hooks/useEmployees'

export default function MyEquipmentRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null })
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: requests = [], isLoading } = useAssetRequests(
    currentEmployee?.id ? { employee_id: currentEmployee.id } : undefined
  )
  const updateMutation = useUpdateAssetRequest()

  const filtered = statusFilter
    ? requests.filter((r) => r.status === statusFilter)
    : requests

  const handleWithdraw = async () => {
    const req = withdrawModal.req
    if (!req) return
    setIsWithdrawing(true)
    try {
      await updateMutation.mutateAsync({ id: req.id, data: { status: 'cancelled' as any } })
      setWithdrawModal({ open: false, req: null })
    } catch {
      // error toast handled by hook
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Stats
  const total = requests.length
  const pending = requests.filter((r) => r.status === 'pending').length
  const approved = requests.filter((r) => r.status === 'approved').length
  const fulfilled = requests.filter((r) => r.status === 'fulfilled').length
  const rejected = requests.filter((r) => r.status === 'rejected').length

  const statusBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    fulfilled: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  const priorityBadge: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Equipment Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track the status of all your equipment requests.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500 mt-1">Total</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-yellow-100 rounded-xl mb-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pending}</p>
          <p className="text-sm text-gray-500 mt-1">Pending</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-100 rounded-xl mb-3">
            <CheckCircle className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{approved}</p>
          <p className="text-sm text-gray-500 mt-1">Approved</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fulfilled}</p>
          <p className="text-sm text-gray-500 mt-1">Fulfilled</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-xl mb-3">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{rejected}</p>
          <p className="text-sm text-gray-500 mt-1">Rejected</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Request History</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading your requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No requests found.</p>
            <p className="text-gray-400 text-xs mt-1">
              {statusFilter
                ? 'Try clearing the filter.'
                : 'Browse equipment and submit a request to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Item Description', 'Category', 'Priority', 'Requested Date', 'Status', 'Notes', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((req) => {
                  const r = req as any
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {req.item_description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {r.category?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${priorityBadge[req.priority ?? 'low'] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(req.requested_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[req.status ?? 'pending'] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {req.rejection_reason || req.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(req.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 whitespace-nowrap"
                            onClick={() => setWithdrawModal({ open: true, req })}
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />Withdraw
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* Withdraw Modal */}
      <Modal open={withdrawModal.open} onClose={() => setWithdrawModal({ open: false, req: null })} size="lg">
        <ModalHeader>
          <h2 className="text-lg font-semibold text-gray-900">Withdraw Request</h2>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">
            Are you sure you want to withdraw your request for{' '}
            <span className="font-semibold text-gray-900">{withdrawModal.req?.item_description}</span>?
            This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setWithdrawModal({ open: false, req: null })}>Cancel</Button>
          <Button variant="danger" onClick={handleWithdraw} disabled={isWithdrawing}>
            <Ban className="w-4 h-4 mr-1.5" />
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw Request'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
