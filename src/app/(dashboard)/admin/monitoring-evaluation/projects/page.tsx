'use client'

import { useState } from 'react'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, usePrograms } from '@/hooks'
import type { MEProject } from '@/services/monitoring.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  active: 'success',
  planning: 'warning',
  completed: 'info',
  suspended: 'danger',
}

const PROJECT_TYPES = ['implementation', 'pilot', 'research', 'training', 'advocacy', 'other']
const STATUSES = ['planning', 'active', 'completed', 'suspended']

const EMPTY_FORM = {
  program_id: null as string | null,
  name: '',
  description: '',
  project_type: 'implementation' as MEProject['project_type'],
  status: 'planning' as MEProject['status'],
  start_date: '',
  end_date: '',
  budget: '',
  currency: 'PHP',
  lead_staff_id: null as string | null,
  location: '',
  notes: '',
  created_by: null as string | null,
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects()
  const { data: programs = [] } = usePrograms()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<MEProject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MEProject | null>(null)
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchProgram = programFilter ? p.program_id === programFilter : true
    const matchStatus = statusFilter ? p.status === statusFilter : true
    return matchSearch && matchProgram && matchStatus
  })

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(p: MEProject) {
    setSelected(p)
    setForm({
      program_id: p.program_id,
      name: p.name,
      description: p.description ?? '',
      project_type: p.project_type,
      status: p.status,
      start_date: p.start_date ?? '',
      end_date: p.end_date ?? '',
      budget: p.budget !== null ? String(p.budget) : '',
      currency: p.currency,
      lead_staff_id: p.lead_staff_id,
      location: p.location ?? '',
      notes: p.notes ?? '',
      created_by: p.created_by,
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      budget: form.budget ? Number(form.budget) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0])
    }
    setShowModal(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage projects linked to programs</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Project</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No projects found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.location && <div className="text-xs text-gray-400">{p.location}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.program?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.project_type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {p.start_date ?? '—'} → {p.end_date ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:underline text-xs mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(p)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Project' : 'New Project'}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={form.program_id ?? ''}
                onChange={(e) => setForm({ ...form, program_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Standalone —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.project_type}
                onChange={(e) => setForm({ ...form, project_type: e.target.value as MEProject['project_type'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MEProject['status'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!form.name || isPending}>
            {isPending ? 'Saving...' : selected ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="Delete Project"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
