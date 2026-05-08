'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, Send, BookOpen, CheckCircle, Clock, XCircle, Inbox, Undo2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  usePublicationRequests,
  usePublicationStats,
  useCreatePublicationRequest,
  useUpdatePublicationRequest,
  useDeletePublicationRequest,
  useSubmitPublicationRequest,
} from '@/hooks/usePublications'
import { notifyRequesterOfDecision } from '@/services/requestNotification.helper'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const PUBLICATION_TYPES = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'other']

export default function PublicationManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publicationIdParam = searchParams.get('publication_id') ?? undefined
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [returnModal, setReturnModal] = useState<{ open: boolean; req: any | null }>({ open: false, req: null })
  const [returnQty, setReturnQty] = useState(1)
  const [isReturning, setIsReturning] = useState(false)
  const [formData, setFormData] = useState({
    publication_title: '', publication_type: 'book', request_type: 'new',
    publisher: '', isbn: '', purpose: '', notes: '',
    quantity: 1, priority: 'normal', delivery_method: 'pickup',
    estimated_cost: '', deadline: '',
  })

  const { data: requests = [], isLoading } = usePublicationRequests({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    publication_id: publicationIdParam,
  })
  const { data: stats } = usePublicationStats()
  const createMutation = useCreatePublicationRequest()
  const updateMutation = useUpdatePublicationRequest()
  const deleteMutation = useDeletePublicationRequest()
  const submitMutation = useSubmitPublicationRequest()

  const filtered = requests.filter(r =>
    !search || r.publication_title?.toLowerCase().includes(search.toLowerCase())
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

  const openCreate = () => {
    setSelectedItem(null)
    setFormData({ publication_title: '', publication_type: 'book', request_type: 'new', publisher: '', isbn: '', purpose: '', notes: '', quantity: 1, priority: 'normal', delivery_method: 'pickup', estimated_cost: '', deadline: '' })
    setIsModalOpen(true)
  }

  const openEdit = (item: any) => {
    setSelectedItem(item)
    setFormData({
      publication_title: item.publication_title || '', publication_type: item.publication_type || 'book',
      request_type: item.request_type || 'new', publisher: item.publisher || '',
      isbn: item.isbn || '', purpose: item.purpose || '', notes: item.notes || '',
      quantity: item.quantity || 1, priority: item.priority || 'normal',
      delivery_method: item.delivery_method || 'pickup',
      estimated_cost: item.estimated_cost?.toString() || '', deadline: item.deadline || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...formData }
    if (payload.estimated_cost) payload.estimated_cost = parseFloat(payload.estimated_cost)
    else delete payload.estimated_cost
    if (!payload.deadline) delete payload.deadline
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, updates: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setIsModalOpen(false)
    } catch {}
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
    if (reason === null) return // cancelled
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
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications Request</h1>
          <p className="text-gray-600 mt-1">View and manage publication requests</p>
        </div>
        <div className="flex items-center gap-3">
          {publicationIdParam && (
            <Button variant="secondary" onClick={() => router.push('/admin/publications/publication-management')}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {publicationIdParam && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <Inbox className="w-4 h-4 shrink-0" />
          Showing copy requests for publication <span className="font-semibold">{publicationIdParam}</span>
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
            <Input placeholder="Search requests..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Publications Request</h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No publication requests found</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create First Request</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.publication_title}</div>
                      {item.request_number && <div className="text-xs text-gray-500">{item.request_number}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{item.publication_type}</td>
                    <td className="px-6 py-4">
                      <Badge className={item.priority === 'urgent' ? 'bg-red-100 text-red-700' : item.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}>
                        {item.priority || 'normal'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.quantity ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusColor[item.status ?? 'draft'] ?? 'bg-gray-100 text-gray-700'}>
                        {item.status ?? 'draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
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
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader><h2 className="text-lg font-semibold">{selectedItem ? 'Edit Request' : 'New Publication Request'}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <Input required value={formData.publication_title} onChange={e => setFormData(p => ({ ...p, publication_title: e.target.value }))} placeholder="Publication title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.publication_type} onChange={e => setFormData(p => ({ ...p, publication_type: e.target.value }))}>
                    {PUBLICATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.request_type} onChange={e => setFormData(p => ({ ...p, request_type: e.target.value }))}>
                    <option value="new">New</option>
                    <option value="reprint">Reprint</option>
                    <option value="revision">Revision</option>
                    <option value="translation">Translation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <Input value={formData.publisher} onChange={e => setFormData(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <Input value={formData.isbn} onChange={e => setFormData(p => ({ ...p, isbn: e.target.value }))} placeholder="ISBN (optional)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <Input type="number" min={1} value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.delivery_method} onChange={e => setFormData(p => ({ ...p, delivery_method: e.target.value }))}>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                    <option value="courier">Courier</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                  <Input type="number" min={0} step="0.01" value={formData.estimated_cost} onChange={e => setFormData(p => ({ ...p, estimated_cost: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <Input type="date" value={formData.deadline} onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <Input value={formData.purpose} onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))} placeholder="Purpose of this publication request" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none" rows={2} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : selectedItem ? 'Save Changes' : 'Create Request'}
            </Button>
          </ModalFooter>
        </form>
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
