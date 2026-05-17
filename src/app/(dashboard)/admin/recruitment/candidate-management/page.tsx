'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useRecruitmentCandidates, useCreateRecruitmentCandidate, useUpdateRecruitmentCandidate, useDeleteRecruitmentCandidate } from '@/hooks'
import type { RecruitmentCandidate, RecruitmentCandidateInsert } from '@/services'

const SOURCE_OPTIONS = ['direct', 'referral', 'job_board', 'linkedin', 'website', 'agency', 'other']

const EMPTY_FORM: Partial<RecruitmentCandidateInsert> = {
  first_name: '', last_name: '', email: '', phone: '',
  current_employer: '', current_position: '', years_experience: undefined,
  highest_education: '', linkedin_url: '', source: 'direct', notes: '', is_talent_pool: false,
}

export default function CandidateManagementPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<RecruitmentCandidate | null>(null)
  const [form, setForm] = useState<Partial<RecruitmentCandidateInsert>>(EMPTY_FORM)

  const { data: candidates = [], isLoading } = useRecruitmentCandidates(
    sourceFilter ? { source: sourceFilter as any } : undefined
  )
  const createMutation = useCreateRecruitmentCandidate()
  const updateMutation = useUpdateRecruitmentCandidate()
  const deleteMutation = useDeleteRecruitmentCandidate()

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return !search || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(q)
  })

  function openCreate() {
    setSelected(null); setForm(EMPTY_FORM); setModalOpen(true)
  }
  function openEdit(c: RecruitmentCandidate) {
    setSelected(c)
    setForm({
      first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone ?? '',
      current_employer: c.current_employer ?? '', current_position: c.current_position ?? '',
      years_experience: c.years_experience ?? undefined, highest_education: c.highest_education ?? '',
      linkedin_url: c.linkedin_url ?? '', source: c.source ?? 'direct',
      notes: c.notes ?? '', is_talent_pool: c.is_talent_pool ?? false,
    })
    setModalOpen(true)
  }
  async function handleSubmit() {
    const payload = { ...form } as RecruitmentCandidateInsert
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModalOpen(false)
  }
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all applicants and candidates</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Candidate</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...SOURCE_OPTIONS].map(s => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sourceFilter === s ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
              {s === '' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Candidates ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center"><Users className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No candidates found</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Current Role</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Source</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Experience</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {c.first_name} {c.last_name}
                      {c.is_talent_pool && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Talent Pool</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.current_position ? `${c.current_position}${c.current_employer ? ` @ ${c.current_employer}` : ''}` : '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{c.source?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.years_experience != null ? `${c.years_experience} yrs` : '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Candidate' : 'Add Candidate'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><Input value={form.first_name ?? ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label><Input value={form.last_name ?? ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><Input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><Input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Employer</label><Input value={form.current_employer ?? ''} onChange={e => setForm(f => ({ ...f, current_employer: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Position</label><Input value={form.current_position ?? ''} onChange={e => setForm(f => ({ ...f, current_position: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label><Input type="number" min={0} value={form.years_experience ?? ''} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value ? Number(e.target.value) : undefined }))} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select value={form.source ?? 'direct'} onChange={e => setForm(f => ({ ...f, source: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label><Input value={form.linkedin_url ?? ''} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_talent_pool ?? false} onChange={e => setForm(f => ({ ...f, is_talent_pool: e.target.checked }))} className="accent-green-600" />
              Add to Talent Pool
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending || !form.first_name || !form.last_name || !form.email}>
            {isPending ? 'Saving...' : selected ? 'Save Changes' : 'Add Candidate'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Remove Candidate" message="Are you sure you want to remove this candidate?" confirmText="Remove" isLoading={deleteMutation.isPending} />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Management</h1>
        <p className="text-gray-600 mt-1">
          Manage candidate database and profiles
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Candidate Management configuration coming soon...</p>
      </Card>
    </div>
  )
}
