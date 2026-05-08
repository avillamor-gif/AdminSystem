'use client'

import React, { useState } from 'react'
import { Search, Send, BookOpen, CheckCircle, Clock, XCircle, Inbox, Undo2, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  usePublicationRequests,
  usePublicationStats,
  useUpdatePublicationRequest,
  useDeletePublicationRequest,
  useSubmitPublicationRequest,
} from '@/hooks/usePublications'
import { notifyRequesterOfDecision } from '@/services/requestNotification.helper'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function PublicationManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publicationIdParam = searchParams.get('publication_id') ?? undefined
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [returnModal, setReturnModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null })
  const [returnQty, setReturnQty] = useState(1)
  const [isReturning, setIsReturning] = useState(false)

  // Fetch only actual requests — exclude catalogue entries
  const { data: allRequests = [], isLoading } = usePublicationRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    publication_id: publicationIdParam,
  })
  const { data: stats } = usePublicationStats()
  const updateMutation = useUpdatePublicationRequest()
  const deleteMutation = useDeletePublicationRequest()
  const submitMutation = useSubmitPublicationRequest()

  // Exclude catalogue entries — those belong to the Publication Library
  const requests = allRequests.filter((r: any) => r.request_type !== 'catalogue')

  const filtered = requests.filter((r: any) =>
    !search ||
    r.publication_title?.toLowerCase().includes(search.toLowerCase()) ||
    r.request_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.last_name?.toLowerCase().includes(search.toLowerCase())
  )

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
      const { data: catalogue } = await supabase
        .from('publication_requests')
        .select('id, quantity')
        .eq('request_type', 'catalogue')
        .eq('publication_id', req.publication_id)
        .single()

      if (catalogue) {
        await supabase
          .from('publication_requests')
          .update({ quantity: (catalogue.quantity ?? 0) + returnQty, updated_at: new Date().toISOString() })
          .eq('id', catalogue.id)
      }

      await updateMutation.mutateAsync({
        id: req.id,
        updates: {
          status: 'returned' as any,
          notes: `${req.notes ? req.notes + '\n' : ''}Returned: ${returnQty} cop${returnQty === 1 ? 'y' : 'ies'} on ${new Date().toLocaleDateString('en-GB')}`,
        },
      })

      toast.success(`${returnQty} cop${returnQty === 1 ? 'y' : 'ies'} returned to library`)
      setReturnModal({ open: false, req: null })
    } catch {
      toast.error('Failed to process return')
    } finally {
      setIsReturning(false)
    }
  }

  const handleSendForApproval = async (item: any) => {
    try {
      await submitMutation.mutateAsync({ id: item.id, employeeId: 'admin', employeeName: 'Admin' })
    } catch {}
  }

  const handleApprove = async (item: any) => {
    if (!confirm(`Approve request for "${item.publication_title}"?`)) return
    try {
      await updateMutation.mutateAsync({ id: item.id, updates: { status: 'approved' } })
      notifyRequesterOfDecision(
        'publication_request_notifications',
        'publication_requests',
        item.id,
        'approved',
        'Publication Request Approved',
        `Your publication request for "${item.publication_title}" has been approved.`,
        item.request_number
      ).catch(() => {})
      toast.success('Request approved')
    } catch {}
  }

  const handleReject = async (item: any) => {
    const reason = prompt(`Reason for rejecting "${item.publication_title}":`)
    if (reason === null) return
    try {
      await updateMutation.mutateAsync({ id: item.id, updates: { status: 'rejected', notes: reason ? `Rejected: ${reason}` : 'Rejected by admin' } })
      notifyRequesterOfDecision(
        'publication_request_notifications',
        'publication_requests',
        item.id,
        'rejected',
        'Publication Request Rejected',
        `Your publication request for "${item.publication_title}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        item.request_number
      ).catch(() => {})
      toast.success('Request rejected')
    } catch {}
  }

  const handleFulfill = async (item: any) => {
    if (!confirm(`Mark "${item.publication_title}" as fulfilled?`)) return
    try {
      await updateMutation.mutateAsync({ id: item.id, updates: { status: 'fulfilled' } })
      notifyRequesterOfDecision(
        'publication_request_notifications',
        'publication_requests',
        item.id,
        'fulfilled',
        'Publication Request Fulfilled',
        `Your publication request for "${item.publication_title}" has been fulfilled and is ready for pickup.`,
        item.request_number
      ).catch(() => {})
      toast.success('Request marked as fulfilled')
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this publication request?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {}
    }
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    fulfilled: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-yellow-100 text-yellow-700',
    returned: 'bg-teal-100 text-teal-700',
  }

  const priorityColor: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-gray-100 text-gray-600',
    low: 'bg-gray-100 text-gray-400',
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications Request</h1>
          <p className="text-gray-600 mt-1">View and manage publication requests</p>
        </div>
        {publicationIdParam && (
          <Button variant="secondary" onClick={() => router.push('/admin/publications/publication-management')}>
            Clear Filter
          </Button>
        )}
      </div>

      {publicationIdParam && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <Inbox className="w-4 h-4 shrink-0" />
          Showing requests for publication <span className="font-semibold">{publicationIdParam}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-blue-100 rounded-lg mb-2"><BookOpen className="w-6 h-6 text-blue-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-yellow-100 rounded-lg mb-2"><Clock className="w-6 h-6 text-yellow-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{stats?.pending ?? 0}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-lg mb-2"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{stats?.approved ?? 0}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-red-100 rounded-lg mb-2"><XCircle className="w-6 h-6 text-red-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{stats?.rejected ?? 0}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input placeholder="Search by title, request # or requester..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">All Requests</h3>
          <span className="text-sm text-gray-400">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No publication requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Request #</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[260px]">Publication Title</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Requested By</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Request Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Submitted</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {item.request_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 min-w-[260px]">
                      <div className="text-sm font-medium text-gray-900">{item.publication_title}</div>
                      {item.publisher && <div className="text-xs text-gray-400">{item.publisher}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.employee ? (
                        <div className="text-sm text-gray-900">
                          {item.employee.first_name} {item.employee.last_name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600 whitespace-nowrap">
                      {item.request_type ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={priorityColor[item.priority ?? 'normal'] ?? 'bg-gray-100 text-gray-600'}>
                        {item.priority ?? 'normal'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.quantity ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {item.created_at ? fmt(item.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={statusColor[item.status ?? 'draft'] ?? 'bg-gray-100 text-gray-700'}>
                        {item.status ?? 'draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-1">
                        {(item.status === 'submitted' || item.status === 'draft') && (
                          <Button variant="ghost" size="sm" title="Approve" onClick={() => handleApprove(item)}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {(item.status === 'submitted' || item.status === 'draft') && (
                          <Button variant="ghost" size="sm" title="Reject" onClick={() => handleReject(item)}>
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        {item.status === 'approved' && (
                          <Button variant="ghost" size="sm" title="Mark Fulfilled" onClick={() => handleFulfill(item)}>
                            <Send className="w-4 h-4 text-purple-500" />
                          </Button>
                        )}
                        {item.status === 'fulfilled' && (
                          <Button variant="ghost" size="sm" title="Return to Library" onClick={() => openReturn(item)}>
                            <Undo2 className="w-4 h-4 text-purple-500" />
                          </Button>
                        )}
                        {item.status === 'draft' && (
                          <Button variant="ghost" size="sm" title="Send for Approval" onClick={() => handleSendForApproval(item)}>
                            <Send className="w-4 h-4 text-blue-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
            <p className="text-xs text-gray-400">These copies will be added back to the available inventory in the library.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReturnModal({ open: false, req: null })}>Cancel</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleReturn} disabled={isReturning}>
            <Undo2 className="w-4 h-4 mr-1.5" />
            {isReturning ? 'Processing...' : 'Confirm Return'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
