'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, DollarSign, Users, Download,
  Edit2, AlertCircle, ChevronDown, ChevronUp, User
} from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '@/components/ui'
import {
  usePayrollRun,
  usePayslipsByRun,
  useUpdatePayrollRunStatus,
  useUpdatePayslip,
} from '@/hooks/usePayroll'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Payslip, PayrollRunStatus } from '@/services/payroll.service'

function formatPHP(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
  }).format(amount)
}

const STATUS_COLORS: Record<PayrollRunStatus, string> = {
  draft:        'bg-gray-100 text-gray-700',
  processing:   'bg-yellow-100 text-yellow-700',
  for_approval: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  paid:         'bg-emerald-100 text-emerald-700',
  cancelled:    'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: 'Draft', processing: 'Processing', for_approval: 'For Approval',
  approved: 'Approved', paid: 'Paid', cancelled: 'Cancelled',
}

// ─── Payslip Row ──────────────────────────────────────────────────────────────

function PayslipRow({ slip, runStatus, onEdit }: {
  slip: Payslip
  runStatus: PayrollRunStatus
  onEdit: (s: Payslip) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const emp     = slip.employee
  const name    = emp ? `${emp.first_name} ${emp.last_name}` : slip.employee_id
  const empCode = emp?.employee_id ?? '—'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500">{empCode} · {slip.department?.name ?? '—'} · {slip.job_title?.title ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-gray-500 text-xs">Gross</p>
            <p className="font-medium">{formatPHP(slip.gross_pay)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-gray-500 text-xs">Deductions</p>
            <p className="font-medium text-red-600">-{formatPHP(slip.total_deductions)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Net Pay</p>
            <p className="font-bold text-green-700">{formatPHP(slip.net_pay)}</p>
          </div>
          <div className="flex items-center gap-2">
            {['draft','for_approval'].includes(runStatus) && (
              <Button
                variant="ghost"
                onClick={e => { e.stopPropagation(); onEdit(slip) }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Earnings</h4>
              <div className="space-y-1.5">
                {(Array.isArray(slip.earnings_breakdown) ? slip.earnings_breakdown : [])
                  .map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">{formatPHP(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
                  <span>Gross Pay</span>
                  <span>{formatPHP(slip.gross_pay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Deductions</h4>
              <div className="space-y-1.5">
                {(Array.isArray(slip.deductions_breakdown) ? slip.deductions_breakdown : [])
                  .map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-red-600">-{formatPHP(item.amount)}</span>
                  </div>
                ))}
                {slip.adjustment_amount !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Adjustment{slip.adjustment_note ? ` (${slip.adjustment_note})` : ''}</span>
                    <span className={slip.adjustment_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {slip.adjustment_amount > 0 ? '+' : ''}{formatPHP(slip.adjustment_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatPHP(slip.total_deductions)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t-2 border-gray-300 pt-1.5 mt-1">
                  <span>Net Pay</span>
                  <span className="text-green-700">{formatPHP(slip.net_pay)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ER contributions note */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Employer shares (cost to company): SSS ER {formatPHP(slip.sss_er)} ·
              PhilHealth ER {formatPHP(slip.philhealth_er)} ·
              Pag-IBIG ER {formatPHP(slip.pagibig_er)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Payslip Modal ────────────────────────────────────────────────────────

function EditPayslipModal({ slip, runId, onClose }: {
  slip: Payslip | null
  runId: string
  onClose: () => void
}) {
  const updatePayslip = useUpdatePayslip()
  const [adj, setAdj]     = useState(String(slip?.adjustment_amount ?? 0))
  const [note, setNote]   = useState(slip?.adjustment_note ?? '')
  const [remarks, setRemarks] = useState(slip?.remarks ?? '')

  if (!slip) return null

  const handleSave = async () => {
    await updatePayslip.mutateAsync({
      id: slip.id,
      runId,
      patch: {
        adjustment_amount: parseFloat(adj) || 0,
        adjustment_note:   note || null,
        remarks:           remarks || null,
        net_pay: Math.max(0, slip.gross_pay - slip.total_deductions + (parseFloat(adj) || 0)),
      },
    })
    onClose()
  }

  return (
    <Modal open={!!slip} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        Adjust Payslip — {slip.employee?.first_name} {slip.employee?.last_name}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span>Gross Pay</span><span className="font-medium">{formatPHP(slip.gross_pay)}</span></div>
            <div className="flex justify-between"><span>Total Deductions</span><span className="font-medium text-red-600">-{formatPHP(slip.total_deductions)}</span></div>
            <div className="flex justify-between font-bold border-t border-gray-200 mt-1 pt-1"><span>Net Pay</span><span className="text-green-700">{formatPHP(slip.net_pay)}</span></div>
          </div>
          <Input
            label="Adjustment Amount (positive = bonus, negative = extra deduction)"
            type="number"
            value={adj}
            onChange={e => setAdj(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Adjustment Note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Retroactive adjustment"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={updatePayslip.isPending}>
          {updatePayslip.isPending ? 'Saving…' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollRunDetailPage({ params }: { params: { id: string } }) {
  const router  = useRouter()
  const { data: run,     isLoading: runLoading }    = usePayrollRun(params.id)
  const { data: payslips = [], isLoading: slipsLoading } = usePayslipsByRun(params.id)
  const updateStatus = useUpdatePayrollRunStatus()

  const [editSlip, setEditSlip] = useState<Payslip | null>(null)
  const [search,   setSearch]   = useState('')

  const isLoading = runLoading || slipsLoading

  const filtered = payslips.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    const emp = s.employee
    return (
      emp?.first_name?.toLowerCase().includes(q) ||
      emp?.last_name?.toLowerCase().includes(q) ||
      emp?.employee_id?.toLowerCase().includes(q) ||
      s.department?.name?.toLowerCase().includes(q)
    )
  })

  // Totals
  const totalGross       = payslips.reduce((s, p) => s + p.gross_pay, 0)
  const totalDeductions  = payslips.reduce((s, p) => s + p.total_deductions, 0)
  const totalNet         = payslips.reduce((s, p) => s + p.net_pay, 0)
  const totalEmployerSSS = payslips.reduce((s, p) => s + p.sss_er, 0)
  const totalERCost      = payslips.reduce((s, p) => s + p.sss_er + p.philhealth_er + p.pagibig_er, 0)

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-600">Loading payroll run…</div>
    </div>
  )

  if (!run) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-600">Payroll run not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{run.name}</h1>
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[run.status])}>
                {STATUS_LABELS[run.status]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {formatDate(run.period_start)} – {formatDate(run.period_end)} · Pay date: {formatDate(run.pay_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {run.status === 'for_approval' && (
            <Button
              onClick={() => updateStatus.mutate({ id: run.id, status: 'approved' })}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />Approve
            </Button>
          )}
          {run.status === 'approved' && (
            <Button
              onClick={() => updateStatus.mutate({ id: run.id, status: 'paid' })}
              disabled={updateStatus.isPending}
            >
              <DollarSign className="w-4 h-4 mr-1.5" />Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Employees',    value: payslips.length,         color: 'text-gray-900',   fmt: false },
          { label: 'Total Gross',  value: totalGross,              color: 'text-blue-700',   fmt: true  },
          { label: 'Deductions',   value: totalDeductions,         color: 'text-red-600',    fmt: true  },
          { label: 'Total Net Pay',value: totalNet,                color: 'text-green-700',  fmt: true  },
          { label: 'ER Cost',      value: totalERCost,             color: 'text-orange-600', fmt: true  },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={cn('text-lg font-bold mt-0.5', s.color)}>
              {s.fmt ? formatPHP(s.value as number) : s.value}
            </p>
          </Card>
        ))}
      </div>

      {payslips.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-1">No payslips generated yet</h3>
          <p className="text-sm text-gray-500">Go back to the payroll runs list and click <strong>Generate</strong> to compute payslips.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search employee name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500">{filtered.length} of {payslips.length} employees</p>
          </div>

          <div className="space-y-2">
            {filtered.map(slip => (
              <PayslipRow
                key={slip.id}
                slip={slip}
                runStatus={run.status}
                onEdit={setEditSlip}
              />
            ))}
          </div>
        </div>
      )}

      <EditPayslipModal slip={editSlip} runId={params.id} onClose={() => setEditSlip(null)} />
    </div>
  )
}
