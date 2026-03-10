'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Play, CheckCircle, XCircle, Trash2, Eye,
  Calendar, Users, DollarSign, FileText, ChevronRight
} from 'lucide-react'
import {
  Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter,
  Input, Select, ConfirmModal,
} from '@/components/ui'
import {
  usePayrollRuns,
  useCreatePayrollRun,
  useUpdatePayrollRunStatus,
  useDeletePayrollRun,
  useGeneratePayslips,
} from '@/hooks/usePayroll'
import { cn } from '@/lib/utils'
import { formatDate, localDateStr } from '@/lib/utils'
import type { PayrollRunStatus, PeriodType, PayrollRun, PayrollRunInsert } from '@/services/payroll.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 'semi_monthly', label: 'Semi-Monthly (1st & 15th)' },
  { value: 'monthly',      label: 'Monthly' },
  { value: 'weekly',       label: 'Weekly' },
]

const STATUS_COLORS: Record<PayrollRunStatus, string> = {
  draft:        'bg-gray-100 text-gray-700',
  processing:   'bg-yellow-100 text-yellow-700',
  for_approval: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  paid:         'bg-emerald-100 text-emerald-700',
  cancelled:    'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft:        'Draft',
  processing:   'Processing',
  for_approval: 'For Approval',
  approved:     'Approved',
  paid:         'Paid',
  cancelled:    'Cancelled',
}

interface FormData {
  name: string
  period_type: PeriodType
  period_start: string
  period_end: string
  pay_date: string
  notes: string
}

const EMPTY_FORM: FormData = {
  name:         '',
  period_type:  'semi_monthly',
  period_start: '',
  period_end:   '',
  pay_date:     '',
  notes:        '',
}

function formatPHP(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollRunsPage() {
  const router = useRouter()
  const { data: runs = [], isLoading } = usePayrollRuns()
  const createRun    = useCreatePayrollRun()
  const updateStatus = useUpdatePayrollRunStatus()
  const deleteRun    = useDeletePayrollRun()
  const generateSlips = useGeneratePayslips()

  const [showModal,   setShowModal]   = useState(false)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [generateRun, setGenerateRun] = useState<PayrollRun | null>(null)
  const [formData,    setFormData]    = useState<FormData>(EMPTY_FORM)
  const [errors,      setErrors]      = useState<Partial<Record<keyof FormData, string>>>({})

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!formData.name.trim())        e.name         = 'Name is required'
    if (!formData.period_start)       e.period_start = 'Period start is required'
    if (!formData.period_end)         e.period_end   = 'Period end is required'
    if (!formData.pay_date)           e.pay_date     = 'Pay date is required'
    if (formData.period_start && formData.period_end &&
        formData.period_start > formData.period_end)
      e.period_end = 'End must be after start'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Auto-fill name ──────────────────────────────────────────────────────────
  const handlePeriodChange = (field: keyof FormData, value: string) => {
    const next = { ...formData, [field]: value }
    if ((field === 'period_start' || field === 'period_type') && next.period_start) {
      const d = new Date(next.period_start)
      const month = d.toLocaleString('default', { month: 'long' })
      const year  = d.getFullYear()
      const label = next.period_type === 'semi_monthly'
        ? (d.getDate() <= 15 ? `${month} ${year} – 1st Half` : `${month} ${year} – 2nd Half`)
        : next.period_type === 'weekly'
        ? `Week of ${next.period_start}`
        : `${month} ${year} Payroll`
      next.name = label
    }
    setFormData(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: PayrollRunInsert = {
      name:         formData.name,
      period_type:  formData.period_type,
      period_start: formData.period_start,
      period_end:   formData.period_end,
      pay_date:     formData.pay_date,
      notes:        formData.notes || null,
    }
    await createRun.mutateAsync(payload)
    setShowModal(false)
    setFormData(EMPTY_FORM)
  }

  const handleGenerate = async () => {
    if (!generateRun) return
    await generateSlips.mutateAsync(generateRun)
    setGenerateRun(null)
    router.push(`/admin/payroll-benefits/payroll-runs/${generateRun.id}`)
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalRuns    = runs.length
  const activeRuns   = runs.filter(r => ['draft','for_approval','approved'].includes(r.status)).length
  const paidRuns     = runs.filter(r => r.status === 'paid').length
  const totalPaid    = runs.filter(r => r.status === 'paid').reduce((s, r) => s + (r.total_net_pay ?? 0), 0)

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600">Loading payroll runs...</div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
          <p className="text-gray-600 mt-1">
            Process payroll, generate payslips and track pay periods for IBON International
          </p>
        </div>
        <Button onClick={() => { setFormData(EMPTY_FORM); setErrors({}); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs',   value: totalRuns,            color: 'text-gray-900',    icon: FileText },
          { label: 'Active',       value: activeRuns,           color: 'text-blue-600',    icon: Play },
          { label: 'Paid Runs',    value: paidRuns,             color: 'text-green-600',   icon: CheckCircle },
          { label: 'Total Paid',   value: formatPHP(totalPaid), color: 'text-purple-600',  icon: DollarSign },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <s.icon className="w-8 h-8 text-gray-300" />
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Runs list */}
      {runs.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Runs Yet</h3>
          <p className="text-gray-500 mb-6">Create your first payroll run to start processing employee salaries.</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />New Payroll Run
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map(run => (
            <Card key={run.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{run.name}</h3>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[run.status])}>
                      {STATUS_LABELS[run.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(run.period_start)} – {formatDate(run.period_end)}
                    </span>
                    <span>Pay date: <strong className="text-gray-700">{formatDate(run.pay_date)}</strong></span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {run.payslip_count ?? 0} employees
                    </span>
                    {(run.total_net_pay ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Net: <strong className="text-green-700">{formatPHP(run.total_net_pay ?? 0)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {run.status === 'draft' && (
                    <Button
                      variant="secondary"
                      onClick={() => setGenerateRun(run)}
                      disabled={generateSlips.isPending}
                    >
                      <Play className="w-4 h-4 mr-1.5" />
                      Generate
                    </Button>
                  )}
                  {run.status === 'for_approval' && (
                    <Button
                      variant="primary"
                      onClick={() => updateStatus.mutate({ id: run.id, status: 'approved' })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Approve
                    </Button>
                  )}
                  {run.status === 'approved' && (
                    <Button
                      variant="primary"
                      onClick={() => updateStatus.mutate({ id: run.id, status: 'paid' })}
                      disabled={updateStatus.isPending}
                    >
                      <DollarSign className="w-4 h-4 mr-1.5" />
                      Mark Paid
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/admin/payroll-benefits/payroll-runs/${run.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  {['draft', 'cancelled'].includes(run.status) && (
                    <Button
                      variant="danger"
                      onClick={() => setDeleteId(run.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} size="md">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setShowModal(false)}>
            New Payroll Run
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Period Type"
                value={formData.period_type}
                onChange={e => handlePeriodChange('period_type', (e.target as HTMLSelectElement).value)}
                options={PERIOD_OPTIONS}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Period Start"
                  type="date"
                  value={formData.period_start}
                  onChange={e => handlePeriodChange('period_start', e.target.value)}
                  error={errors.period_start}
                />
                <Input
                  label="Period End"
                  type="date"
                  value={formData.period_end}
                  onChange={e => setFormData(p => ({ ...p, period_end: e.target.value }))}
                  error={errors.period_end}
                />
              </div>
              <Input
                label="Pay Date"
                type="date"
                value={formData.pay_date}
                onChange={e => setFormData(p => ({ ...p, pay_date: e.target.value }))}
                error={errors.pay_date}
              />
              <Input
                label="Run Name"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                error={errors.name}
                placeholder="e.g. March 2026 – 1st Half"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any notes for this pay run..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>How it works:</strong> After creating the run, click <strong>Generate</strong> to
                auto-compute payslips for all active employees using their assigned salary structures and
                Philippine government contribution rates (SSS, PhilHealth, Pag-IBIG, BIR withholding tax).
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createRun.isPending}>
              {createRun.isPending ? 'Creating…' : 'Create Run'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Generate Confirmation */}
      <ConfirmModal
        isOpen={!!generateRun}
        onClose={() => setGenerateRun(null)}
        onConfirm={handleGenerate}
        title="Generate Payslips"
        message={`This will compute payslips for all active employees in "${generateRun?.name}" using their assigned salary structures and PH contribution rates. Existing payslips for this run will be overwritten. Continue?`}
        confirmText={generateSlips.isPending ? 'Generating…' : 'Generate'}
        variant="warning"
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await deleteRun.mutateAsync(deleteId)
          setDeleteId(null)
        }}
        title="Delete Payroll Run"
        message="This will permanently delete the payroll run and all its payslips. This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
