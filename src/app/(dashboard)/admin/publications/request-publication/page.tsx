'use client'

import React, { useState } from 'react'
import { ArrowLeft, CheckCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  useCreatePublicationRequest,
  useSubmitPublicationRequest,
  usePublicationRequests,
} from '@/hooks/usePublications'

const PUBLICATION_TYPES = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'other']

export default function RequestPublicationPage() {
  const router = useRouter()
  const createMutation = useCreatePublicationRequest()
  const submitMutation = useSubmitPublicationRequest()
  const { data: recentRequests = [] } = usePublicationRequests({})
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    publication_title: '', publication_type: 'book', request_type: 'new',
    publisher: '', purpose: '', notes: '',
    quantity: 1, priority: 'normal', delivery_method: 'pickup', deadline: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...formData }
    if (!payload.deadline) delete payload.deadline
    try {
      const created = await createMutation.mutateAsync(payload)
      if (created?.id) {
        await submitMutation.mutateAsync({ id: created.id, employeeId: 'employee', employeeName: 'Employee' })
      }
      setSubmitted(true)
    } catch {}
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    fulfilled: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-yellow-100 text-yellow-700',
  }

  const isPending = createMutation.isPending || submitMutation.isPending

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">Your publication request has been submitted for approval.</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => { setSubmitted(false); setFormData({ publication_title: '', publication_type: 'book', request_type: 'new', publisher: '', purpose: '', notes: '', quantity: 1, priority: 'normal', delivery_method: 'pickup', deadline: '' }) }}>
              Submit Another
            </Button>
            <Button variant="secondary" onClick={() => router.push('/admin/publications/publication-library')}>
              View Library
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Publication</h1>
          <p className="text-gray-600 mt-1">Submit a publication request for approval</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Request Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Title *</label>
                  <Input required value={formData.publication_title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Enter publication title" />
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
                    <Input value={formData.publisher} onChange={e => setFormData(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher name (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input type="number" min={1} value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Needed By</label>
                    <Input type="date" value={formData.deadline} onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <Input required value={formData.purpose} onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))} placeholder="Why is this publication needed?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none" rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional information..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Requests Sidebar */}
          <div>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Requests</h2>
              {recentRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No recent requests</p>
              ) : (
                <div className="space-y-3">
                  {recentRequests.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.publication_title}</p>
                        <p className="text-xs text-gray-500 capitalize">{r.publication_type}</p>
                      </div>
                      <Badge className={`shrink-0 text-xs ${statusColor[r.status ?? 'draft'] ?? 'bg-gray-100 text-gray-700'}`}>
                        {r.status ?? 'draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
