'use client'

import { useState } from 'react'
import { useMEReports, useCreateMEReport, useUpdateMEReport, useDeleteMEReport, usePrograms, useProjects } from '@/hooks'
import { useCurrentEmployee } from '@/hooks'
import type { MEReport } from '@/services/monitoring.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { formatDate } from '@/lib/utils'

const REPORT_TYPES = ['progress', 'quarterly', 'annual', 'evaluation', 'baseline', 'endline']

const EMPTY_FORM = {
  title: '',
  program_id: null as string | null,
  project_id: null as string | null,
  report_type: 'progress' as MEReport['report_type'],
  period_label: '',
  period_start: '',
  period_end: '',
  content: '',
  status: 'draft' as MEReport['status'],
  prepared_by: null as string | null,
}

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useMEReports()
  const { data: programs = [] } = usePrograms()
  const { data: projects = [] } = useProjects()
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateMEReport()
  const updateMutation = useUpdateMEReport()
  const deleteMutation = useDeleteMEReport()

  const [showModal, setShowModal] = useState(false)
  const [viewReport, setViewReport] = useState<MEReport | null>(null)
  const [selected, setSelected] = useState<MEReport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MEReport | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  function openCreate() {
    setSelected(null)
    setForm({ ...EMPTY_FORM, prepared_by: currentEmployee?.id ?? null })
    setShowModal(true)
  }

  function openEdit(r: MEReport) {
    setSelected(r)
    setForm({
      title: r.title,
      program_id: r.program_id,
      project_id: r.project_id,
      report_type: r.report_type,
      period_label: r.period_label ?? '',
      period_start: r.period_start ?? '',
      period_end: r.period_end ?? '',
      content: r.content ?? '',
      status: r.status,
      prepared_by: r.prepared_by,
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage periodic M&E reports</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 p-8 text-center text-gray-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-gray-400">No reports yet.</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {r.status}
                </span>
                <span className="text-xs text-gray-400 capitalize">{r.report_type}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
              {r.period_label && <p className="text-xs text-gray-500 mb-1">Period: {r.period_label}</p>}
              {r.program && <p className="text-xs text-gray-500">Program: {r.program.name}</p>}
              {r.project && <p className="text-xs text-gray-500">Project: {r.project.name}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Prepared by: {r.prepared_by_emp ? `${r.prepared_by_emp.first_name} ${r.prepared_by_emp.last_name}` : '—'}
              </p>
              <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setViewReport(r)} className="text-xs text-indigo-600 hover:underline">View</button>
                <button onClick={() => openEdit(r)} className="text-xs text-gray-600 hover:underline">Edit</button>
                <button onClick={() => setDeleteTarget(r)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Report' : 'New Report'}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={form.report_type}
                onChange={(e) => setForm({ ...form, report_type: e.target.value as MEReport['report_type'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MEReport['status'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={form.program_id ?? ''}
                onChange={(e) => setForm({ ...form, program_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={form.project_id ?? ''}
                onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Label</label>
              <Input placeholder="e.g. Q1 2025" value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
              <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
              <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="Write report content here..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!form.title || isPending}>
            {isPending ? 'Saving...' : selected ? 'Update' : 'Create Report'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Report Modal */}
      {viewReport && (
        <Modal open={!!viewReport} onClose={() => setViewReport(null)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-3">
              <span>{viewReport.title}</span>
              <Badge variant={viewReport.status === 'final' ? 'success' : 'default'}>{viewReport.status}</Badge>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <div><span className="font-medium">Type:</span> {viewReport.report_type}</div>
                <div><span className="font-medium">Period:</span> {viewReport.period_label ?? '—'}</div>
                {viewReport.program && <div><span className="font-medium">Program:</span> {viewReport.program.name}</div>}
                {viewReport.project && <div><span className="font-medium">Project:</span> {viewReport.project.name}</div>}
                <div>
                  <span className="font-medium">Prepared by:</span>{' '}
                  {viewReport.prepared_by_emp
                    ? `${viewReport.prepared_by_emp.first_name} ${viewReport.prepared_by_emp.last_name}`
                    : '—'}
                </div>
                <div><span className="font-medium">Date:</span> {formatDate(viewReport.created_at)}</div>
              </div>
              <div className="whitespace-pre-wrap font-mono text-sm bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {viewReport.content || <span className="text-gray-400 italic">No content yet.</span>}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewReport(null)}>Close</Button>
            <Button variant="primary" onClick={() => { setViewReport(null); openEdit(viewReport) }}>Edit</Button>
          </ModalFooter>
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="Delete Report"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
