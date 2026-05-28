'use client'

import { useState } from 'react'
import { useDataEntries, useCreateDataEntry, useUpdateDataEntry, useDeleteDataEntry, useIndicators } from '@/hooks'
import { useCurrentEmployee } from '@/hooks'
import type { MEDataEntry } from '@/services/monitoring.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  verified: 'success',
  submitted: 'info',
  draft: 'default',
}

const STATUSES = ['draft', 'submitted', 'verified']

const EMPTY_FORM = {
  indicator_id: '',
  period_label: '',
  period_start: '',
  period_end: '',
  actual_value: '',
  narrative: '',
  entered_by: null as string | null,
  verified_by: null as string | null,
  status: 'draft' as MEDataEntry['status'],
  attachments: [] as unknown[],
}

export default function DataEntryPage() {
  const { data: entries = [], isLoading } = useDataEntries()
  const { data: indicators = [] } = useIndicators()
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateDataEntry()
  const updateMutation = useUpdateDataEntry()
  const deleteMutation = useDeleteDataEntry()

  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<MEDataEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MEDataEntry | null>(null)
  const [indicatorFilter, setIndicatorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const activeIndicators = indicators.filter((i) => i.is_active)

  const filtered = entries.filter((e) => {
    const matchIndicator = indicatorFilter ? e.indicator_id === indicatorFilter : true
    const matchStatus = statusFilter ? e.status === statusFilter : true
    return matchIndicator && matchStatus
  })

  function openCreate() {
    setSelected(null)
    setForm({
      ...EMPTY_FORM,
      entered_by: currentEmployee?.id ?? null,
    })
    setShowModal(true)
  }

  function openEdit(e: MEDataEntry) {
    setSelected(e)
    setForm({
      indicator_id: e.indicator_id,
      period_label: e.period_label,
      period_start: e.period_start,
      period_end: e.period_end,
      actual_value: String(e.actual_value),
      narrative: e.narrative ?? '',
      entered_by: e.entered_by,
      verified_by: e.verified_by,
      status: e.status,
      attachments: e.attachments ?? [],
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      actual_value: Number(form.actual_value),
    }
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0])
    }
    setShowModal(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // Progress toward target for selected indicator in modal
  const selectedIndicator = activeIndicators.find((i) => i.id === form.indicator_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Entry</h1>
          <p className="text-sm text-gray-500 mt-1">Enter actual values for indicators by reporting period</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Entry</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={indicatorFilter}
          onChange={(e) => setIndicatorFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72"
        >
          <option value="">All Indicators</option>
          {activeIndicators.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
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
          <div className="p-8 text-center text-gray-400">No data entries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Indicator</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Achievement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entered By</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const pct = e.indicator
                  ? Math.min(100, Math.round((e.actual_value / e.indicator.target_value) * 100))
                  : 0
                return (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{e.indicator?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.period_label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {e.actual_value} <span className="text-xs font-normal text-gray-400">{e.indicator?.unit_of_measure}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{e.indicator?.target_value ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[e.status]}>{e.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {e.entered_by_emp
                        ? `${e.entered_by_emp.first_name} ${e.entered_by_emp.last_name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(e)} className="text-indigo-600 hover:underline text-xs mr-3">Edit</button>
                      <button onClick={() => setDeleteTarget(e)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Data Entry' : 'New Data Entry'}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicator *</label>
              <select
                value={form.indicator_id}
                onChange={(e) => setForm({ ...form, indicator_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Select indicator —</option>
                {activeIndicators.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit_of_measure}) — Target: {i.target_value}
                  </option>
                ))}
              </select>
              {selectedIndicator && (
                <p className="text-xs text-gray-400 mt-1">
                  Baseline: {selectedIndicator.baseline_value ?? 'N/A'} · Target: {selectedIndicator.target_value} {selectedIndicator.unit_of_measure}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Label *</label>
              <Input
                placeholder="e.g. Q1 2025"
                value={form.period_label}
                onChange={(e) => setForm({ ...form, period_label: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Value *</label>
              <Input
                type="number"
                value={form.actual_value}
                onChange={(e) => setForm({ ...form, actual_value: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
              <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
              <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MEDataEntry['status'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Narrative / Notes</label>
              <textarea
                value={form.narrative}
                onChange={(e) => setForm({ ...form, narrative: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe what was achieved, challenges, context..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!form.indicator_id || !form.period_label || !form.actual_value || isPending}
          >
            {isPending ? 'Saving...' : selected ? 'Update' : 'Submit Entry'}
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
        title="Delete Entry"
        message="Delete this data entry?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
