'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useRecruitmentInterviews, useCreateRecruitmentInterview, useUpdateRecruitmentInterview, useDeleteRecruitmentInterview, useRecruitmentApplications, useRecruitmentCandidates } from '@/hooks'
import type { RecruitmentInterview, RecruitmentInterviewInsert } from '@/services'

const TYPES = ['initial', 'technical', 'hr', 'panel', 'final', 'culture_fit']
const STATUS_OPTS = ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled']
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', no_show: 'bg-orange-100 text-orange-700', rescheduled: 'bg-yellow-100 text-yellow-700',
}

export default function InterviewSchedulingPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<RecruitmentInterview | null>(null)
  const [form, setForm] = useState<Partial<RecruitmentInterviewInsert>>({ interview_type: 'initial', status: 'scheduled', scheduled_date: '' })

  const { data: interviews = [], isLoading } = useRecruitmentInterviews(statusFilter ? { status: statusFilter } : undefined)
  const { data: applications = [] } = useRecruitmentApplications()
  const { data: candidates = [] } = useRecruitmentCandidates()
  const createMutation = useCreateRecruitmentInterview()
  const updateMutation = useUpdateRecruitmentInterview()
  const deleteMutation = useDeleteRecruitmentInterview()

  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, `${c.first_name} ${c.last_name}`]))
  const appCandidateMap = Object.fromEntries(applications.map(a => [a.id, candidateMap[a.candidate_id ?? ''] ?? '—']))

  function openCreate() { setSelected(null); setForm({ interview_type: 'initial', status: 'scheduled', scheduled_date: '' }); setModalOpen(true) }
  function openEdit(i: RecruitmentInterview) {
    setSelected(i)
    setForm({ application_id: i.application_id, interview_type: i.interview_type, scheduled_date: i.scheduled_date, start_time: i.start_time ?? '', end_time: i.end_time ?? '', location: i.location ?? '', meeting_link: i.meeting_link ?? '', status: i.status, feedback: i.feedback ?? '', rating: i.rating ?? undefined, recommendation: i.recommendation ?? undefined })
    setModalOpen(true)
  }
  async function handleSubmit() {
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: form })
    else await createMutation.mutateAsync(form as RecruitmentInterviewInsert)
    setModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Interview Scheduling</h1><p className="text-sm text-gray-500 mt-1">Schedule and manage candidate interviews</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Schedule Interview</Button>
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
        <CardHeader><CardTitle>Interviews ({interviews.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          interviews.length === 0 ? (
            <div className="py-16 text-center"><Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No interviews scheduled</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Candidate</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Time</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Rating</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interviews.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{appCandidateMap[i.application_id] ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{i.interview_type.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-gray-600">{i.scheduled_date}</td>
                    <td className="px-5 py-3.5 text-gray-600">{i.start_time ? `${i.start_time}${i.end_time ? ` – ${i.end_time}` : ''}` : '—'}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[i.status]}`}>{i.status}</span></td>
                    <td className="px-5 py-3.5 text-gray-600">{i.rating ? `${i.rating}/5` : '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(i)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(i.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
        <ModalHeader>{selected ? 'Update Interview' : 'Schedule Interview'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {!selected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application</label>
                <select value={form.application_id ?? ''} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select application...</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{candidateMap[a.candidate_id ?? ''] ?? a.id}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.interview_type ?? 'initial'} onChange={e => setForm(f => ({ ...f, interview_type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status ?? 'scheduled'} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><Input type="date" value={form.scheduled_date ?? ''} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><Input type="time" value={form.start_time ?? ''} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label><Input type="time" value={form.end_time ?? ''} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location / Meeting Link</label><Input value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room 101 or https://meet.google.com/..." /></div>
            {selected && (
              <>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label><textarea rows={3} value={form.feedback ?? ''} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5)</label><Input type="number" min={1} max={5} value={form.rating ?? ''} onChange={e => setForm(f => ({ ...f, rating: e.target.value ? Number(e.target.value) : undefined }))} /></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                    <select value={form.recommendation ?? ''} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value as any || undefined }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">— None —</option>
                      {['strong_hire', 'hire', 'neutral', 'no_hire', 'strong_no_hire'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Save Changes' : 'Schedule'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Remove Interview" message="Remove this interview record?" confirmText="Remove" isLoading={deleteMutation.isPending} />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Scheduling</h1>
        <p className="text-gray-600 mt-1">
          Schedule and manage interviews
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Interview Scheduling configuration coming soon...</p>
      </Card>
    </div>
  )
}
