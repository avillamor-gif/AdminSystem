'use client'

import { useState } from 'react'
import { Search, FileText, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useRecruitmentApplications, useCreateRecruitmentApplication, useUpdateRecruitmentApplication, useDeleteRecruitmentApplication, useJobPostings, useRecruitmentCandidates } from '@/hooks'
import type { RecruitmentApplication, RecruitmentApplicationInsert } from '@/services'

const STAGES = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn']
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  interview: 'bg-yellow-100 text-yellow-700',
  assessment: 'bg-orange-100 text-orange-700',
  offer: 'bg-teal-100 text-teal-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
}

export default function ApplicationTrackingPage() {
  const [stageFilter, setStageFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<RecruitmentApplication | null>(null)
  const [form, setForm] = useState<Partial<RecruitmentApplicationInsert>>({ stage: 'applied', status: 'active', applied_date: '' })

  const { data: applications = [], isLoading } = useRecruitmentApplications(stageFilter ? { stage: stageFilter } : undefined)
  const { data: postings = [] } = useJobPostings()
  const { data: candidates = [] } = useRecruitmentCandidates()
  const createMutation = useCreateRecruitmentApplication()
  const updateMutation = useUpdateRecruitmentApplication()
  const deleteMutation = useDeleteRecruitmentApplication()

  const postingMap = Object.fromEntries(postings.map(p => [p.id, p.title]))
  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, `${c.first_name} ${c.last_name}`]))

  const filtered = applications.filter(a => {
    const q = search.toLowerCase()
    return !search || [postingMap[a.job_posting_id ?? ''], candidateMap[a.candidate_id ?? '']].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  function openCreate() { setSelected(null); setForm({ stage: 'applied', status: 'active', applied_date: '' }); setModalOpen(true) }
  function openEdit(a: RecruitmentApplication) {
    setSelected(a)
    setForm({ job_posting_id: a.job_posting_id ?? '', candidate_id: a.candidate_id ?? '', stage: a.stage, status: a.status, applied_date: a.applied_date ?? '', notes: a.notes ?? '' })
    setModalOpen(true)
  }
  async function handleSubmit() {
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: form })
    else await createMutation.mutateAsync(form as RecruitmentApplicationInsert)
    setModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Application Tracking</h1><p className="text-sm text-gray-500 mt-1">Track all job applications across stages</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Application</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="flex gap-2 flex-wrap">
          {['', ...STAGES].map(s => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${stageFilter === s ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
              {s === '' ? 'All' : s.replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Applications ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          filtered.length === 0 ? (
            <div className="py-16 text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No applications found</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Candidate</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Job Posting</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Stage</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Applied</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{candidateMap[a.candidate_id ?? ''] ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{postingMap[a.job_posting_id ?? ''] ?? '—'}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[a.stage]}`}>{a.stage}</span></td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{a.status.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-gray-600">{a.applied_date ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(a)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded transition-colors">Update Stage</button>
                        <button onClick={async () => { await deleteMutation.mutateAsync(a.id) }} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded transition-colors">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>{selected ? 'Update Application' : 'Add Application'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {!selected && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
                  <select value={form.candidate_id ?? ''} onChange={e => setForm(f => ({ ...f, candidate_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select candidate...</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Posting</label>
                  <select value={form.job_posting_id ?? ''} onChange={e => setForm(f => ({ ...f, job_posting_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select job posting...</option>
                    {postings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label><Input type="date" value={form.applied_date ?? ''} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} /></div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={form.stage ?? 'applied'} onChange={e => setForm(f => ({ ...f, stage: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status ?? 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {['active', 'on_hold', 'rejected', 'withdrawn', 'hired'].map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={3} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Update' : 'Add'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Tracking</h1>
        <p className="text-gray-600 mt-1">
          Track job applications and status
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Application Tracking configuration coming soon...</p>
      </Card>
    </div>
  )
}
