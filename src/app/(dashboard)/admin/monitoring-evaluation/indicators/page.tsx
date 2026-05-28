'use client'

import { useState } from 'react'
import { useIndicators, useCreateIndicator, useUpdateIndicator, useDeleteIndicator, usePrograms, useProjects } from '@/hooks'
import type { MEIndicator } from '@/services/monitoring.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

const TYPE_COLORS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  input: 'default',
  output: 'info',
  outcome: 'warning',
  impact: 'success',
  process: 'default',
}

const INDICATOR_TYPES = ['input', 'output', 'outcome', 'impact', 'process']
const FREQUENCIES = ['monthly', 'quarterly', 'semi-annual', 'annual', 'as-needed']

const EMPTY_FORM = {
  program_id: null as string | null,
  project_id: null as string | null,
  name: '',
  description: '',
  indicator_type: 'output' as MEIndicator['indicator_type'],
  unit_of_measure: 'number',
  baseline_value: '',
  target_value: '',
  frequency: 'quarterly' as MEIndicator['frequency'],
  data_source: '',
  responsible_staff_id: null as string | null,
  is_active: true,
}

export default function IndicatorsPage() {
  const { data: indicators = [], isLoading } = useIndicators()
  const { data: programs = [] } = usePrograms()
  const { data: projects = [] } = useProjects()
  const createMutation = useCreateIndicator()
  const updateMutation = useUpdateIndicator()
  const deleteMutation = useDeleteIndicator()

  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<MEIndicator | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MEIndicator | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = indicators.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter ? i.indicator_type === typeFilter : true
    return matchSearch && matchType
  })

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(i: MEIndicator) {
    setSelected(i)
    setForm({
      program_id: i.program_id,
      project_id: i.project_id,
      name: i.name,
      description: i.description ?? '',
      indicator_type: i.indicator_type,
      unit_of_measure: i.unit_of_measure,
      baseline_value: i.baseline_value !== null ? String(i.baseline_value) : '',
      target_value: String(i.target_value),
      frequency: i.frequency,
      data_source: i.data_source ?? '',
      responsible_staff_id: i.responsible_staff_id,
      is_active: i.is_active,
    })
    setShowModal(true)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      baseline_value: form.baseline_value ? Number(form.baseline_value) : null,
      target_value: Number(form.target_value),
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
          <h1 className="text-2xl font-bold text-gray-900">Indicators</h1>
          <p className="text-sm text-gray-500 mt-1">Define measurable indicators for programs and projects</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Indicator</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search indicators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {INDICATOR_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No indicators found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Indicator</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Linked To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Baseline</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className={`border-b last:border-0 hover:bg-gray-50 ${!i.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{i.name}</div>
                    <div className="text-xs text-gray-400">{i.unit_of_measure}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={TYPE_COLORS[i.indicator_type]}>{i.indicator_type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {i.program?.name && <div>Program: {i.program.name}</div>}
                    {i.project?.name && <div>Project: {i.project.name}</div>}
                    {!i.program && !i.project && '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{i.frequency}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{i.baseline_value ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{i.target_value}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(i)} className="text-indigo-600 hover:underline text-xs mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(i)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader>{selected ? 'Edit Indicator' : 'New Indicator'}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.indicator_type}
                onChange={(e) => setForm({ ...form, indicator_type: e.target.value as MEIndicator['indicator_type'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {INDICATOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <Input value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Value</label>
              <Input type="number" value={form.baseline_value} onChange={(e) => setForm({ ...form, baseline_value: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
              <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as MEIndicator['frequency'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
              <Input value={form.data_source} onChange={(e) => setForm({ ...form, data_source: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Program</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Project</label>
              <select
                value={form.project_id ?? ''}
                onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">Active indicator</label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!form.name || !form.target_value || isPending}>
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
        title="Delete Indicator"
        message={`Delete "${deleteTarget?.name}"? All data entries for this indicator will also be removed.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
