'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge, ConfirmModal } from '@/components/ui'
import { useJobPostings, useCreateJobPosting, useUpdateJobPosting, useDeleteJobPosting } from '@/hooks'
import type { JobPosting, JobPostingInsert } from '@/services'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
}

const STATUS_OPTIONS = ['draft', 'open', 'on_hold', 'closed', 'cancelled']

const EMPTY_FORM: Partial<JobPostingInsert> = {
  title: '', status: 'draft', description: '', requirements: '', responsibilities: '',
  salary_min: undefined, salary_max: undefined, headcount: 1,
  posted_date: '', closing_date: '', is_internal: false, is_remote: false,
}

export default function JobPostingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<JobPosting | null>(null)
  const [form, setForm] = useState<Partial<JobPostingInsert>>(EMPTY_FORM)

  const { data: postings = [], isLoading } = useJobPostings(statusFilter ? { status: statusFilter } : undefined)
  const createMutation = useCreateJobPosting()
  const updateMutation = useUpdateJobPosting()
  const deleteMutation = useDeleteJobPosting()

  const filtered = postings.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(posting: JobPosting) {
    setSelected(posting)
    setForm({
      title: posting.title,
      status: posting.status,
      description: posting.description ?? '',
      requirements: posting.requirements ?? '',
      responsibilities: posting.responsibilities ?? '',
      salary_min: posting.salary_min ?? undefined,
      salary_max: posting.salary_max ?? undefined,
      headcount: posting.headcount ?? 1,
      posted_date: posting.posted_date ?? '',
      closing_date: posting.closing_date ?? '',
      is_internal: posting.is_internal ?? false,
      is_remote: posting.is_remote ?? false,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const payload = { ...form } as JobPostingInsert
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
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage open positions and job listings</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Posting
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search job postings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
              }`}
            >
              {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Job Postings ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No job postings found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Title</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Headcount</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Closing Date</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{p.title}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{p.headcount ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.closing_date ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {[p.is_remote && 'Remote', p.is_internal && 'Internal'].filter(Boolean).join(', ') || 'External'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Job Posting' : 'New Job Posting'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status ?? 'draft'}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headcount</label>
                <Input type="number" min={1} value={form.headcount ?? 1} onChange={e => setForm(f => ({ ...f, headcount: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                <Input type="number" value={form.salary_min ?? ''} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value ? Number(e.target.value) : undefined }))} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                <Input type="number" value={form.salary_max ?? ''} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value ? Number(e.target.value) : undefined }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posted Date</label>
                <Input type="date" value={form.posted_date ?? ''} onChange={e => setForm(f => ({ ...f, posted_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                <Input type="date" value={form.closing_date ?? ''} onChange={e => setForm(f => ({ ...f, closing_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Job description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                rows={3}
                value={form.requirements ?? ''}
                onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Job requirements..."
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_remote ?? false} onChange={e => setForm(f => ({ ...f, is_remote: e.target.checked }))} className="accent-green-600" />
                Remote
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_internal ?? false} onChange={e => setForm(f => ({ ...f, is_internal: e.target.checked }))} className="accent-green-600" />
                Internal Only
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending || !form.title}>
            {isPending ? 'Saving...' : selected ? 'Save Changes' : 'Create Posting'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
