'use client'

import React, { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Search, Edit2, Trash2, X, ChevronRight, ChevronDown, ChevronUp,
  Printer, FileText, Clock, CheckCircle, XCircle, Truck, Package,
  AlertCircle, RotateCcw, Send, ArrowRight,
} from 'lucide-react'
import { Card, Button, Badge, Input, Select, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  usePrintJobs, useCreatePrintJob, useUpdatePrintJob, useDeletePrintJob,
  useAdvancePrintJobStatus, usePrintingPresses,
} from '@/hooks/usePrintJobs'
import { useCurrentEmployee } from '@/hooks'
import toast from 'react-hot-toast'
import type { PrintJobRequest, DistributionPlanRow } from '@/services/printJob.service'

// ── Constants ──────────────────────────────────────────────────────────────────
const PUB_TYPES  = ['book', 'journal', 'magazine', 'newsletter', 'report', 'manual', 'brochure', 'flyer', 'poster', 'banner', 'other']
const REQ_TYPES  = [
  { value: 'new_print',     label: 'New Print Run' },
  { value: 'reprint',       label: 'Reprint' },
  { value: 'rush_reprint',  label: 'Rush Reprint' },
  { value: 'digital_only',  label: 'Digital Only' },
]
const PAPER_SIZES    = ['A4', 'A5', 'A3', 'Letter', 'Legal', 'Tabloid', 'Custom']
const PAPER_TYPES    = ['bond', 'glossy', 'matte', 'newsprint', 'cardstock', 'recycled']
const COLOR_MODES    = [
  { value: 'full_color',   label: 'Full Color' },
  { value: 'black_white',  label: 'Black & White' },
  { value: 'spot_color',   label: 'Spot Color' },
  { value: 'grayscale',    label: 'Grayscale' },
]
const BINDING_TYPES  = ['none', 'saddle_stitch', 'perfect_bound', 'spiral', 'staple', 'hardcover']
const RECIPIENT_TYPES   = ['internal', 'external', 'event', 'online']
const DELIVERY_METHODS  = ['pickup', 'courier', 'mail', 'hand_carry', 'event', 'digital']

// ── Status pipeline ────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'draft',          label: 'Draft',        color: 'gray'   },
  { key: 'submitted',      label: 'Submitted',    color: 'blue'   },
  { key: 'approved',       label: 'Approved',     color: 'indigo' },
  { key: 'press_assigned', label: 'Press Assigned', color: 'violet' },
  { key: 'in_production',  label: 'In Production', color: 'amber'  },
  { key: 'quality_check',  label: 'Quality Check', color: 'orange' },
  { key: 'ready',          label: 'Ready',        color: 'teal'   },
  { key: 'distributing',   label: 'Distributing', color: 'sky'    },
  { key: 'completed',      label: 'Completed',    color: 'green'  },
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-700'   },
  submitted:      { label: 'Submitted',      cls: 'bg-blue-100 text-blue-700'   },
  approved:       { label: 'Approved',       cls: 'bg-indigo-100 text-indigo-700' },
  press_assigned: { label: 'Press Assigned', cls: 'bg-violet-100 text-violet-700' },
  in_production:  { label: 'In Production',  cls: 'bg-amber-100 text-amber-700'  },
  quality_check:  { label: 'Quality Check',  cls: 'bg-orange-100 text-orange-700' },
  ready:          { label: 'Ready',          cls: 'bg-teal-100 text-teal-700'    },
  distributing:   { label: 'Distributing',   cls: 'bg-sky-100 text-sky-700'      },
  completed:      { label: 'Completed',      cls: 'bg-green-100 text-green-700'  },
  rejected:       { label: 'Rejected',       cls: 'bg-red-100 text-red-700'      },
  cancelled:      { label: 'Cancelled',      cls: 'bg-yellow-100 text-yellow-700' },
}

// Next workflow action per status
const NEXT_ACTION: Record<string, { label: string; nextStatus: string; needsPress?: boolean; needsNote?: boolean }> = {
  draft:          { label: 'Submit for Review', nextStatus: 'submitted' },
  submitted:      { label: 'Approve',           nextStatus: 'approved' },
  approved:       { label: 'Assign Press',      nextStatus: 'press_assigned', needsPress: true },
  press_assigned: { label: 'Start Production',  nextStatus: 'in_production' },
  in_production:  { label: 'Quality Check ✓',  nextStatus: 'quality_check' },
  quality_check:  { label: 'Mark Ready',        nextStatus: 'ready' },
  ready:          { label: 'Begin Distribution', nextStatus: 'distributing' },
  distributing:   { label: 'Mark Completed',    nextStatus: 'completed' },
}

// ── Blank form ─────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: '', publication_type: 'other', request_type: 'new_print',
  quantity: 1, purpose: '', event_name: '', target_date: '',
  paper_size: 'A4', paper_type: 'bond', color_mode: 'full_color',
  binding_type: 'none', printing_press_id: '', estimated_cost: '', special_instructions: '',
  notes: '',
}

const BLANK_DIST_ROW = (): DistributionPlanRow => ({
  recipient_group: '', recipient_type: 'internal', quantity: 1,
  delivery_method: 'pickup', delivery_address: null, pic_name: null,
  target_date: null, actual_delivered_date: null, status: 'pending', notes: null, sort_order: 0,
})

// ── Component ──────────────────────────────────────────────────────────────────
export default function PrintJobsPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [showPanel, setShowPanel]     = useState(false)
  const [selectedJob, setSelectedJob] = useState<PrintJobRequest | null>(null)
  const [form, setForm]               = useState({ ...BLANK_FORM })
  const [distPlan, setDistPlan]       = useState<DistributionPlanRow[]>([])
  const [specsOpen, setSpecsOpen]     = useState(true)
  const [distOpen, setDistOpen]       = useState(true)

  // Status action modal
  const [actionModal, setActionModal] = useState<{
    open: boolean
    job: PrintJobRequest | null
    nextStatus: string
    label: string
    needsPress: boolean
    needsNote: boolean
    isReject: boolean
  }>({ open: false, job: null, nextStatus: '', label: '', needsPress: false, needsNote: false, isReject: false })
  const [actionNote, setActionNote]   = useState('')
  const [actionPress, setActionPress] = useState('')

  const { data: jobs = [], isLoading }   = usePrintJobs({ status: statusFilter || undefined, type: typeFilter || undefined, search: search || undefined })
  const { data: presses = [] }           = usePrintingPresses()
  const { data: currentEmployee }        = useCurrentEmployee()
  const createMutation  = useCreatePrintJob()
  const updateMutation  = useUpdatePrintJob()
  const deleteMutation  = useDeletePrintJob()
  const advanceMutation = useAdvancePrintJobStatus()

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = jobs
    return {
      total:       all.length,
      inProgress:  all.filter(j => ['in_production', 'quality_check', 'press_assigned'].includes(j.status)).length,
      ready:       all.filter(j => ['ready', 'distributing'].includes(j.status)).length,
      completed:   all.filter(j => j.status === 'completed').length,
    }
  }, [jobs])

  // ── Dist plan helpers ──────────────────────────────────────────────────────
  const distTotal     = distPlan.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const printQty      = Number(form.quantity) || 0
  const distDiff      = printQty - distTotal
  const distStatus    = distTotal === 0 ? 'empty' : distTotal === printQty ? 'match' : distTotal > printQty ? 'over' : 'under'

  const addDistRow    = () => setDistPlan(p => [...p, BLANK_DIST_ROW()])
  const removeDistRow = (i: number) => setDistPlan(p => p.filter((_, idx) => idx !== i))
  const updateDistRow = (i: number, field: string, value: any) =>
    setDistPlan(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  // ── Panel open/close ───────────────────────────────────────────────────────
  const openCreate = () => {
    setSelectedJob(null)
    setForm({ ...BLANK_FORM })
    setDistPlan([])
    setSpecsOpen(true)
    setDistOpen(true)
    setShowPanel(true)
  }

  const openEdit = (job: PrintJobRequest) => {
    setSelectedJob(job)
    setForm({
      title:             job.title,
      publication_type:  job.publication_type,
      request_type:      job.request_type,
      quantity:          job.quantity,
      purpose:           job.purpose ?? '',
      event_name:        job.event_name ?? '',
      target_date:       job.target_date ?? '',
      paper_size:        job.paper_size ?? 'A4',
      paper_type:        job.paper_type ?? 'bond',
      color_mode:        job.color_mode ?? 'full_color',
      binding_type:      job.binding_type ?? 'none',
      printing_press_id: job.printing_press_id ?? '',
      estimated_cost:    job.estimated_cost?.toString() ?? '',
      special_instructions: job.special_instructions ?? '',
      notes:             job.notes ?? '',
    })
    setDistPlan((job.distribution_plan ?? []).map(r => ({ ...r })))
    setSpecsOpen(true)
    setDistOpen(true)
    setShowPanel(true)
  }

  const closePanel = () => { setShowPanel(false); setSelectedJob(null) }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }

    const jobData: Partial<PrintJobRequest> = {
      title:                form.title,
      publication_type:     form.publication_type,
      request_type:         form.request_type,
      quantity:             Number(form.quantity),
      purpose:              form.purpose || null,
      event_name:           form.event_name || null,
      target_date:          form.target_date || null,
      paper_size:           form.paper_size,
      paper_type:           form.paper_type,
      color_mode:           form.color_mode,
      binding_type:         form.binding_type,
      printing_press_id:    form.printing_press_id || null,
      estimated_cost:       form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      special_instructions: form.special_instructions || null,
      notes:                form.notes || null,
      requested_by:         currentEmployee?.id ?? null,
    }

    if (selectedJob) {
      await updateMutation.mutateAsync({ id: selectedJob.id, jobData, distPlan })
    } else {
      await createMutation.mutateAsync({ jobData, distPlan })
    }
    closePanel()
  }

  // ── Status action ──────────────────────────────────────────────────────────
  const openAction = (job: PrintJobRequest, isReject = false) => {
    if (isReject) {
      setActionModal({ open: true, job, nextStatus: 'rejected', label: 'Reject Request', needsPress: false, needsNote: true, isReject: true })
    } else {
      const action = NEXT_ACTION[job.status]
      if (!action) return
      setActionModal({ open: true, job, nextStatus: action.nextStatus, label: action.label, needsPress: !!action.needsPress, needsNote: false, isReject: false })
    }
    setActionNote('')
    setActionPress('')
  }

  const confirmAction = async () => {
    if (!actionModal.job) return
    if (actionModal.needsPress && !actionPress) { toast.error('Please select a printing press'); return }
    await advanceMutation.mutateAsync({
      id: actionModal.job.id,
      status: actionModal.nextStatus,
      notes: actionNote || undefined,
      pressId: actionPress || undefined,
    })
    setActionModal(s => ({ ...s, open: false }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this print job request?')) return
    await deleteMutation.mutateAsync(id)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Print Job Requests</h1>
          <p className="text-gray-500 mt-1">Manage print production and distribution workflow</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />New Print Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs',     value: stats.total,      icon: FileText,    cls: 'text-gray-600'  },
          { label: 'In Production',  value: stats.inProgress, icon: Printer,     cls: 'text-amber-600' },
          { label: 'Ready / Distributing', value: stats.ready, icon: Truck,      cls: 'text-sky-600'   },
          { label: 'Completed',      value: stats.completed,  icon: CheckCircle, cls: 'text-green-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.cls}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Search by title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_STEPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {PUB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {(search || statusFilter || typeFilter) && (
            <button className="text-sm text-gray-500 hover:text-gray-700 underline" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}>
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Request #', 'Title', 'Type', 'Qty', 'Printing Press', 'Status', 'Distribution', 'Target Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" /></div>
                </td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <Printer className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No print job requests found
                </td></tr>
              ) : jobs.map(job => {
                const badge    = STATUS_BADGE[job.status] ?? STATUS_BADGE.draft
                const next     = NEXT_ACTION[job.status]
                const distRows = job.distribution_plan ?? []
                const distQty  = distRows.reduce((s, r) => s + (r.quantity || 0), 0)
                const distPct  = job.quantity > 0 ? Math.min((distQty / job.quantity) * 100, 100) : 0
                const delivered= distRows.filter(r => r.status === 'delivered').reduce((s, r) => s + r.quantity, 0)
                return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{job.request_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                      {job.requester && (
                        <div className="text-xs text-gray-400">{job.requester.first_name} {job.requester.last_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize whitespace-nowrap">
                      <span className="text-xs">{job.publication_type}</span>
                      <div className="text-xs text-gray-400">{REQ_TYPES.find(r => r.value === job.request_type)?.label}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{job.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{job.printing_press?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      {distRows.length === 0 ? (
                        <span className="text-xs text-gray-300">No plan</span>
                      ) : (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{delivered}/{job.quantity} delivered</span>
                            <span>{Math.round(distPct)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-400 rounded-full"
                              style={{ width: `${(delivered / job.quantity) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{distRows.length} recipient group{distRows.length !== 1 ? 's' : ''}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {job.target_date ? new Date(job.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {next && !['completed', 'rejected', 'cancelled'].includes(job.status) && (
                          <button
                            onClick={() => openAction(job)}
                            className="px-2 py-1 text-xs bg-orange text-white rounded-md hover:bg-orange-600 transition-colors whitespace-nowrap"
                          >
                            {next.label}
                          </button>
                        )}
                        {['submitted', 'approved'].includes(job.status) && (
                          <button
                            onClick={() => openAction(job, true)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(job)}
                          className="p-1.5 text-gray-400 hover:text-orange rounded-lg hover:bg-orange/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {job.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Workflow Legend */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Workflow Pipeline</p>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step.key}>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[step.key]?.cls}`}>
                {step.label}
              </span>
              {i < STATUS_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
            </React.Fragment>
          ))}
          <span className="ml-2 text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">Rejected</span>
          <span className="ml-1 text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">Cancelled</span>
        </div>
      </Card>

      {/* ── Slide-out panel ─────────────────────────────────────────────────── */}
      {showPanel && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 bg-black/40" style={{ zIndex: 9998 }} onClick={closePanel} />
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col"
            style={{ zIndex: 9999 }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedJob ? `Edit — ${selectedJob.request_number ?? selectedJob.title}` : 'New Print Job Request'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedJob ? 'Update print job details and distribution plan' : 'Complete all sections and add a distribution plan'}
                </p>
              </div>
              <button type="button" onClick={closePanel} className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* ── Section 1: Publication Info ───────────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                    Publication & Request Info
                  </h3>

                  <Input
                    label="Title *"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="e.g. IBON Facts & Figures Vol. 22, Campaign Flyer Q3 2026"
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publication Type *</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 capitalize"
                        value={form.publication_type}
                        onChange={e => setForm(f => ({ ...f, publication_type: e.target.value }))}
                        required
                      >
                        {PUB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request Type *</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={form.request_type}
                        onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}
                        required
                      >
                        {REQ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <Input
                      label="Total Quantity *"
                      type="number"
                      min="1"
                      value={String(form.quantity)}
                      onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Target Completion Date"
                      type="date"
                      value={form.target_date}
                      onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                    />
                    <Input
                      label="Event / Campaign Name (optional)"
                      value={form.event_name}
                      onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
                      placeholder="e.g. People's SONA 2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Justification</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={2}
                      value={form.purpose}
                      onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                      placeholder="Describe why this print run is needed…"
                    />
                  </div>
                </div>

                {/* ── Section 2: Print Specifications (collapsible) ─────────── */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setSpecsOpen(o => !o)}
                  >
                    <span className="text-sm font-semibold text-gray-700">Print Specifications</span>
                    {specsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {specsOpen && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.paper_size} onChange={e => setForm(f => ({ ...f, paper_size: e.target.value }))}>
                            {PAPER_SIZES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Paper Type</label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.paper_type} onChange={e => setForm(f => ({ ...f, paper_type: e.target.value }))}>
                            {PAPER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Color Mode</label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.color_mode} onChange={e => setForm(f => ({ ...f, color_mode: e.target.value }))}>
                            {COLOR_MODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Binding Type</label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.binding_type} onChange={e => setForm(f => ({ ...f, binding_type: e.target.value }))}>
                            {BINDING_TYPES.map(b => <option key={b} value={b}>{b.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Printing Press</label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.printing_press_id} onChange={e => setForm(f => ({ ...f, printing_press_id: e.target.value }))}>
                            <option value="">Select press</option>
                            {presses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <Input
                          label="Estimated Cost (₱)"
                          type="number"
                          step="0.01"
                          value={form.estimated_cost}
                          onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          rows={2}
                          value={form.special_instructions}
                          onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))}
                          placeholder="Bleed marks, spot UV, specific Pantone colors, custom trim size, etc."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 3: Distribution Plan (collapsible) ────────────── */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setDistOpen(o => !o)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">Distribution Plan</span>
                      {distPlan.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          distStatus === 'match' ? 'bg-green-100 text-green-700' :
                          distStatus === 'over'  ? 'bg-red-100 text-red-700' :
                          distStatus === 'under' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {distTotal.toLocaleString()} / {printQty.toLocaleString()} copies planned
                          {distStatus === 'match' ? ' ✓' : distStatus === 'over' ? ` (${(distTotal - printQty).toLocaleString()} over)` : distStatus === 'under' ? ` (${distDiff.toLocaleString()} unplanned)` : ''}
                        </span>
                      )}
                    </div>
                    {distOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {distOpen && (
                    <div className="p-4 space-y-3">
                      {distPlan.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No distribution rows yet. Add recipient groups to plan how copies will be delivered.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-500">
                                <th className="text-left py-2 pr-2 font-medium min-w-[130px]">Recipient Group</th>
                                <th className="text-left py-2 pr-2 font-medium">Type</th>
                                <th className="text-left py-2 pr-2 font-medium w-16">Qty</th>
                                <th className="text-left py-2 pr-2 font-medium">Method</th>
                                <th className="text-left py-2 pr-2 font-medium min-w-[120px]">Person in Charge</th>
                                <th className="text-left py-2 pr-2 font-medium">Target Date</th>
                                <th className="text-left py-2 font-medium min-w-[120px]">Notes</th>
                                <th className="w-6"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {distPlan.map((row, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      value={row.recipient_group}
                                      onChange={e => updateDistRow(i, 'recipient_group', e.target.value)}
                                      placeholder="e.g. Staff HQ"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <select
                                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 capitalize"
                                      value={row.recipient_type}
                                      onChange={e => updateDistRow(i, 'recipient_type', e.target.value)}
                                    >
                                      {RECIPIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-16 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      value={row.quantity}
                                      onChange={e => updateDistRow(i, 'quantity', Number(e.target.value))}
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <select
                                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 capitalize"
                                      value={row.delivery_method}
                                      onChange={e => updateDistRow(i, 'delivery_method', e.target.value)}
                                    >
                                      {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      value={row.pic_name ?? ''}
                                      onChange={e => updateDistRow(i, 'pic_name', e.target.value)}
                                      placeholder="Name / unit"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      type="date"
                                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      value={row.target_date ?? ''}
                                      onChange={e => updateDistRow(i, 'target_date', e.target.value || null)}
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      value={row.notes ?? ''}
                                      onChange={e => updateDistRow(i, 'notes', e.target.value || null)}
                                      placeholder="Optional note"
                                    />
                                  </td>
                                  <td className="py-1.5">
                                    <button type="button" onClick={() => removeDistRow(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200">
                                <td colSpan={2} className="pt-2 text-xs font-semibold text-gray-600">Total Planned</td>
                                <td className={`pt-2 text-xs font-bold ${distStatus === 'match' ? 'text-green-600' : distStatus === 'over' ? 'text-red-600' : 'text-amber-600'}`}>
                                  {distTotal.toLocaleString()}
                                </td>
                                <td colSpan={5} className="pt-2 text-xs text-gray-400">of {printQty.toLocaleString()} copies</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={addDistRow}
                        className="flex items-center gap-1.5 text-sm text-orange hover:text-orange-600 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Recipient Group
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any other notes for this request…"
                  />
                </div>
              </div>

              {/* Panel footer */}
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-white">
                <div className="text-xs text-gray-400">
                  {distStatus === 'match' && distPlan.length > 0 && <span className="text-green-600 font-medium">✓ Distribution plan complete</span>}
                  {distStatus === 'under' && distPlan.length > 0 && <span className="text-amber-600">{distDiff.toLocaleString()} copies not yet assigned to a recipient</span>}
                  {distStatus === 'over'  && <span className="text-red-600">Distribution total exceeds print quantity by {(distTotal - printQty).toLocaleString()}</span>}
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={closePanel}>Cancel</Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : selectedJob ? 'Save Changes' : 'Create Print Job'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </>,
        document.body,
      )}

      {/* ── Status Action Modal ─────────────────────────────────────────────── */}
      <Modal open={actionModal.open} onClose={() => setActionModal(s => ({ ...s, open: false }))} size="sm">
        <ModalHeader onClose={() => setActionModal(s => ({ ...s, open: false }))}>
          {actionModal.label}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {actionModal.job && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-900">{actionModal.job.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{actionModal.job.request_number} · {actionModal.job.quantity.toLocaleString()} copies</p>
              </div>
            )}

            {actionModal.needsPress && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Printing Press *</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={actionPress}
                  onChange={e => setActionPress(e.target.value)}
                >
                  <option value="">Select press…</option>
                  {presses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionModal.isReject ? 'Rejection Reason *' : 'Notes (optional)'}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                rows={3}
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder={actionModal.isReject ? 'Explain why this request is being rejected…' : 'Add notes for this status change…'}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setActionModal(s => ({ ...s, open: false }))}>Cancel</Button>
          <Button
            onClick={confirmAction}
            disabled={advanceMutation.isPending || (actionModal.isReject && !actionNote.trim())}
            className={actionModal.isReject ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {advanceMutation.isPending ? 'Updating…' : actionModal.label}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
