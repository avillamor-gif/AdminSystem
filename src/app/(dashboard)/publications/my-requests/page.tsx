'use client'

import { useState } from 'react'
import { FileText, Clock, CheckCircle, XCircle, Package, Undo2, Ban } from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { usePublicationRequests, useUpdatePublicationRequest } from '@/hooks/usePublications'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { publicationService } from '@/services/publication.service'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const statusBadge: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  returned: 'bg-purple-100 text-purple-700',
}

const priorityBadge: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyPublicationRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [returnModal, setReturnModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null })
  const [returnQty, setReturnQty] = useState(1)
  const [isReturning, setIsReturning] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null })
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: allRequests = [], isLoading, refetch } = usePublicationRequests(
    currentEmployee?.id ? { employee_id: currentEmployee.id } : {}
  )
  const updateMutation = useUpdatePublicationRequest()

  const openReturn = (req: any) => {
    setReturnQty(req.quantity ?? 1)
    setReturnModal({ open: true, req })
  }

  const handleReturn = async () => {
    const req = returnModal.req
    if (!req) return
    setIsReturning(true)
    try {
      const supabase = createClient()
      // Find the catalogue entry matching this publication_id
      const { data: catalogue } = await supabase
        .from('publication_requests')
        .select('id, quantity')
        .eq('request_type', 'catalogue')
        .eq('publication_id', req.publication_id)
        .single()

      if (catalogue) {
        // Add returned copies back to the catalogue inventory
        await supabase
          .from('publication_requests')
          .update({ quantity: (catalogue.quantity ?? 0) + returnQty, updated_at: new Date().toISOString() })
          .eq('id', catalogue.id)
      }

      // Mark the copy request as returned
      await updateMutation.mutateAsync({
        id: req.id,
        updates: {
          status: 'returned' as any,
          notes: `${req.notes ? req.notes + '\n' : ''}Returned: ${returnQty} cop${returnQty === 1 ? 'y' : 'ies'} on ${new Date().toLocaleDateString('en-GB')}`,
        },
      })

      toast.success(`${returnQty} cop${returnQty === 1 ? 'y' : 'ies'} returned to library`)
      setReturnModal({ open: false, req: null })
      refetch()
    } catch (err) {
      toast.error('Failed to process return')
    } finally {
      setIsReturning(false)
    }
  }

  const handleWithdraw = async () => {
    const req = withdrawModal.req
    if (!req) return
    setIsWithdrawing(true)
    try {
      await updateMutation.mutateAsync({ id: req.id, updates: { status: 'cancelled' as any } })
      toast.success('Request withdrawn successfully')
      setWithdrawModal({ open: false, req: null })
      refetch()
    } catch (err) {
      toast.error('Failed to withdraw request')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const filtered = statusFilter ? allRequests.filter(r => r.status === statusFilter) : allRequests

  const total = allRequests.length
  const pending = allRequests.filter(r => r.status === 'submitted' || r.status === 'draft').length
  const approved = allRequests.filter(r => r.status === 'approved').length
  const fulfilled = allRequests.filter(r => r.status === 'fulfilled').length
  const rejected = allRequests.filter(r => r.status === 'rejected').length
  const returned = allRequests.filter(r => r.status === 'returned').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Track the status of all your publication requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {[
          { label: 'Total', count: total, icon: FileText, bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Pending', count: pending, icon: Clock, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { label: 'Approved', count: approved, icon: CheckCircle, bg: 'bg-indigo-100', color: 'text-indigo-600' },
          { label: 'Fulfilled', count: fulfilled, icon: Package, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Returned', count: returned, icon: Undo2, bg: 'bg-purple-100', color: 'text-purple-600' },
          { label: 'Rejected', count: rejected, icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
        ].map(({ label, count, icon: Icon, bg, color }) => (
          <Card key={label} className="p-6 flex flex-col items-center text-center">
            <div className={`p-3 rounded-xl mb-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="p-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="returned">Returned</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Request History</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading your requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No requests found</p>
            <p className="text-gray-400 text-xs mt-1">
              {statusFilter ? 'Try clearing the filter.' : 'Submit a request to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request #', 'Title', 'Type', 'Qty', 'Priority', 'Submitted', 'Needed By', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">{req.request_number || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{(req as any).publication_title ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{req.publication_type || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.quantity ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${priorityBadge[req.priority ?? 'normal'] ?? 'bg-gray-100 text-gray-600'}`}>
                        {req.priority ?? 'normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.deadline)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[req.status ?? 'draft'] ?? 'bg-gray-100 text-gray-600'}`}>
                        {req.status ?? 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {req.status === 'fulfilled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 whitespace-nowrap"
                            onClick={() => openReturn(req)}
                          >
                            <Undo2 className="w-3.5 h-3.5 mr-1" />Return
                          </Button>
                        )}
                        {(req.status === 'submitted' || req.status === 'draft') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 whitespace-nowrap"
                            onClick={() => setWithdrawModal({ open: true, req })}
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />Withdraw
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            <span className="font-semibold text-gray-900">{withdrawModal.req?.publication_title}</span>?
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

      {/* Return Modal */}
      <Modal open={returnModal.open} onClose={() => setReturnModal({ open: false, req: null })} size="lg">
        <ModalHeader>
          <h2 className="text-lg font-semibold text-gray-900">Return Publication</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Returning copies of <span className="font-semibold text-gray-900">{returnModal.req?.publication_title}</span> back to the library inventory.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copies to Return <span className="text-gray-400">(max: {returnModal.req?.quantity ?? 1})</span>
              </label>
              <input
                type="number"
                min={1}
                max={returnModal.req?.quantity ?? 1}
                value={returnQty}
                onChange={e => setReturnQty(Math.min(Math.max(1, Number(e.target.value)), returnModal.req?.quantity ?? 1))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              These copies will be added back to the available inventory in the library.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReturnModal({ open: false, req: null })}>Cancel</Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleReturn}
            disabled={isReturning}
          >
            <Undo2 className="w-4 h-4 mr-1.5" />
            {isReturning ? 'Processing...' : 'Confirm Return'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
