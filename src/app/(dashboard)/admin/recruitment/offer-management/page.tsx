'use client'

import { useState } from 'react'
import { Plus, Edit2, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useRecruitmentOffers, useCreateRecruitmentOffer, useUpdateRecruitmentOffer, useRecruitmentApplications, useRecruitmentCandidates } from '@/hooks'
import type { RecruitmentOffer, RecruitmentOfferInsert } from '@/services'

const STATUS_OPTS = ['draft', 'sent', 'accepted', 'declined', 'negotiating', 'expired', 'withdrawn']
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700', negotiating: 'bg-yellow-100 text-yellow-700', expired: 'bg-gray-200 text-gray-500', withdrawn: 'bg-gray-100 text-gray-500',
}

export default function OfferManagementPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<RecruitmentOffer | null>(null)
  const [form, setForm] = useState<Partial<RecruitmentOfferInsert>>({ status: 'draft' })

  const { data: offers = [], isLoading } = useRecruitmentOffers(statusFilter ? { status: statusFilter } : undefined)
  const { data: applications = [] } = useRecruitmentApplications()
  const { data: candidates = [] } = useRecruitmentCandidates()
  const createMutation = useCreateRecruitmentOffer()
  const updateMutation = useUpdateRecruitmentOffer()

  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, `${c.first_name} ${c.last_name}`]))
  const appCandidateMap = Object.fromEntries(applications.map(a => [a.id, candidateMap[a.candidate_id ?? ''] ?? '—']))

  function openCreate() { setSelected(null); setForm({ status: 'draft' }); setModalOpen(true) }
  function openEdit(o: RecruitmentOffer) {
    setSelected(o)
    setForm({ application_id: o.application_id, offered_salary: o.offered_salary ?? undefined, offered_position: o.offered_position ?? '', start_date: o.start_date ?? '', expiry_date: o.expiry_date ?? '', status: o.status, notes: o.notes ?? '' })
    setModalOpen(true)
  }
  async function handleSubmit() {
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: form })
    else await createMutation.mutateAsync(form as RecruitmentOfferInsert)
    setModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Offer Management</h1><p className="text-sm text-gray-500 mt-1">Create and track job offers</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Offer</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', ...STATUS_OPTS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${statusFilter === s ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
            {s === '' ? 'All' : s.replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Offers ({offers.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          offers.length === 0 ? (
            <div className="py-16 text-center"><Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No offers yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Candidate</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Position</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Offered Salary</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Start Date</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Expires</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{appCandidateMap[o.application_id] ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{o.offered_position ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{o.offered_salary != null ? `₱${o.offered_salary.toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{o.start_date ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{o.expiry_date ?? '—'}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                    <td className="px-5 py-3.5 text-right"><button onClick={() => openEdit(o)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>{selected ? 'Update Offer' : 'Create Offer'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {!selected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application *</label>
                <select value={form.application_id ?? ''} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select application...</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{candidateMap[a.candidate_id ?? ''] ?? a.id}</option>)}
                </select>
              </div>
            )}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Offered Position</label><Input value={form.offered_position ?? ''} onChange={e => setForm(f => ({ ...f, offered_position: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Offered Salary (₱)</label><Input type="number" value={form.offered_salary ?? ''} onChange={e => setForm(f => ({ ...f, offered_salary: e.target.value ? Number(e.target.value) : undefined }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><Input type="date" value={form.start_date ?? ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label><Input type="date" value={form.expiry_date ?? ''} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Save Changes' : 'Create Offer'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offer Management</h1>
        <p className="text-gray-600 mt-1">
          Manage job offers and negotiations
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Offer Management configuration coming soon...</p>
      </Card>
    </div>
  )
}
