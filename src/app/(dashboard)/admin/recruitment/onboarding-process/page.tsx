'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useRecruitmentOnboarding, useCreateRecruitmentOnboarding, useUpdateRecruitmentOnboarding, useDeleteRecruitmentOnboarding, useRecruitmentApplications, useRecruitmentCandidates } from '@/hooks'
import type { RecruitmentOnboarding, RecruitmentOnboardingInsert } from '@/services'

const TASK_TYPES = ['document', 'training', 'account_setup', 'orientation', 'equipment', 'other']
const STATUS_OPTS = ['pending', 'in_progress', 'completed', 'skipped']
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600', in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', skipped: 'bg-gray-200 text-gray-400',
}

export default function OnboardingProcessPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Partial<RecruitmentOnboardingInsert>>({ task_name: '', task_type: 'document', status: 'pending' })

  const { data: tasks = [], isLoading } = useRecruitmentOnboarding(statusFilter ? { status: statusFilter } : undefined)
  const { data: applications = [] } = useRecruitmentApplications({ stage: 'hired' })
  const { data: candidates = [] } = useRecruitmentCandidates()
  const createMutation = useCreateRecruitmentOnboarding()
  const updateMutation = useUpdateRecruitmentOnboarding()
  const deleteMutation = useDeleteRecruitmentOnboarding()

  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, `${c.first_name} ${c.last_name}`]))
  const appCandidateMap = Object.fromEntries(applications.map(a => [a.id, candidateMap[a.candidate_id ?? ''] ?? '—']))

  async function toggleComplete(task: RecruitmentOnboarding) {
    await updateMutation.mutateAsync({
      id: task.id,
      data: { status: task.status === 'completed' ? 'pending' : 'completed', completed_date: task.status === 'completed' ? null : new Date().toISOString().split('T')[0] }
    })
  }

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Onboarding Process</h1><p className="text-sm text-gray-500 mt-1">Track onboarding tasks for newly hired employees</p></div>
        <Button variant="primary" onClick={() => { setForm({ task_name: '', task_type: 'document', status: 'pending' }); setModalOpen(true) }}><Plus className="w-4 h-4 mr-2" />Add Task</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-gray-900">{tasks.length}</div><div className="text-sm text-gray-500">Total Tasks</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{pending.length}</div><div className="text-sm text-gray-500">Pending</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{completed.length}</div><div className="text-sm text-gray-500">Completed</div></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', ...STATUS_OPTS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${statusFilter === s ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Onboarding Tasks ({tasks.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          tasks.length === 0 ? (
            <div className="py-16 text-center"><ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No onboarding tasks yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Done</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Task</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Employee</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Due</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(t => (
                  <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${t.status === 'completed' ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleComplete(t)} className="text-gray-400 hover:text-green-600 transition-colors">
                        {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className={`px-5 py-3.5 font-medium text-gray-900 ${t.status === 'completed' ? 'line-through' : ''}`}>{t.task_name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{appCandidateMap[t.application_id] ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{t.task_type?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{t.due_date ?? '—'}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3.5 text-right"><button onClick={async () => deleteMutation.mutateAsync(t.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>Add Onboarding Task</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Employee (Application)</label>
              <select value={form.application_id ?? ''} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select employee...</option>
                {applications.map(a => <option key={a.id} value={a.id}>{candidateMap[a.candidate_id ?? ''] ?? a.id}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label><Input value={form.task_name ?? ''} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                <select value={form.task_type ?? 'document'} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><Input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={async () => { await createMutation.mutateAsync(form as RecruitmentOnboardingInsert); setModalOpen(false) }} disabled={createMutation.isPending || !form.task_name || !form.application_id}>
            {createMutation.isPending ? 'Adding...' : 'Add Task'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Process</h1>
        <p className="text-gray-600 mt-1">
          Configure employee onboarding process
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Onboarding Process configuration coming soon...</p>
      </Card>
    </div>
  )
}
