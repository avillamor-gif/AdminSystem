'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { usePublicationRequests } from '@/hooks/usePublications'
import { usePrintJobs } from '@/hooks/usePrintJobs'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  BookOpen, DollarSign, Clock, CheckCircle, XCircle, BarChart3,
  PieChart, Download, Printer, CheckSquare, Square, TrendingUp,
  Truck, Package, Users, AlertCircle,
} from 'lucide-react'

type ReportTab = 'requests' | 'distribution'

// ── Field definitions ──────────────────────────────────────────────────────────
const ALL_FIELDS = [
  { key: 'request_number',    label: 'Request #' },
  { key: 'publication_title', label: 'Title' },
  { key: 'publication_type',  label: 'Type' },
  { key: 'request_type',      label: 'Request Type' },
  { key: 'publisher',         label: 'Publisher' },
  { key: 'isbn',              label: 'ISBN' },
  { key: 'quantity',          label: 'Quantity' },
  { key: 'estimated_cost',    label: 'Est. Cost (₱)' },
  { key: 'total_cost',        label: 'Total Cost (₱)' },
  { key: 'status',            label: 'Status' },
  { key: 'priority',          label: 'Priority' },
  { key: 'delivery_method',   label: 'Delivery Method' },
  { key: 'deadline',          label: 'Deadline' },
  { key: 'purpose',           label: 'Purpose / Description' },
  { key: 'notes',             label: 'Notes (incl. system entries)' },
  { key: 'created_at',        label: 'Date Requested' },
  { key: 'cover_url',         label: 'Cover Image' },
]

type Row = {
  id: string
  request_number: string
  publication_title: string
  publication_type: string
  request_type: string
  publisher: string | null
  isbn: string | null
  quantity: number | null
  estimated_cost: number | null
  status: string | null
  priority: string | null
  delivery_method: string | null
  deadline: string | null
  purpose: string
  notes: string | null
  created_at: string | null
  cover_url: string | null
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function capitalize(s: string | null) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

function getFieldValue(row: Row, key: string): string {
  switch (key) {
    case 'request_number':    return row.request_number ?? ''
    case 'publication_title': return row.publication_title ?? ''
    case 'publication_type':  return capitalize(row.publication_type)
    case 'request_type':      return capitalize(row.request_type)
    case 'publisher':         return row.publisher ?? '—'
    case 'isbn':              return row.isbn ?? '—'
    case 'quantity':          return String(row.quantity ?? 0)
    case 'estimated_cost':    return row.estimated_cost != null ? `₱${Number(row.estimated_cost).toLocaleString()}` : '—'
    case 'total_cost':        return `₱${((row.estimated_cost ?? 0) * (row.quantity ?? 1)).toLocaleString()}`
    case 'status':            return capitalize(row.status)
    case 'priority':          return capitalize(row.priority)
    case 'delivery_method':   return capitalize(row.delivery_method)
    case 'deadline':          return fmtDate(row.deadline)
    case 'purpose':           return row.purpose ?? ''
    case 'notes':             return row.notes ?? ''
    case 'created_at':        return fmtDate(row.created_at)
    case 'cover_url':         return row.cover_url ? 'View Cover' : '—'
    default:                  return ''
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PublicationReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('requests')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publication Reports</h1>
        <p className="text-gray-600">Analytics and exports for publications and distribution</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {([
            { id: 'requests',     label: 'Publication Requests', icon: BookOpen },
            { id: 'distribution', label: 'Distribution Report',  icon: Truck },
          ] as { id: ReportTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'requests'     && <PublicationRequestsReport />}
      {activeTab === 'distribution' && <DistributionReport />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Distribution Report
// ─────────────────────────────────────────────────────────────────────────────
function DistributionReport() {
  const { data: jobs = [], isLoading } = usePrintJobs({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Flatten all distribution plan rows across all jobs
  const allDistRows = useMemo(() =>
    jobs.flatMap(j =>
      (j.distribution_plan ?? []).map(r => ({ ...r, job: j }))
    ), [jobs])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCopies    = jobs.reduce((s, j) => s + j.quantity, 0)
    const plannedCopies  = allDistRows.reduce((s, r) => s + (r.quantity ?? 0), 0)
    const deliveredCopies = allDistRows.filter(r => r.status === 'delivered').reduce((s, r) => s + (r.quantity ?? 0), 0)
    const inTransit      = allDistRows.filter(r => r.status === 'in_transit').reduce((s, r) => s + (r.quantity ?? 0), 0)
    const pending        = allDistRows.filter(r => r.status === 'pending').reduce((s, r) => s + (r.quantity ?? 0), 0)
    const onTimeRows     = allDistRows.filter(r => r.status === 'delivered' && r.target_date && r.actual_delivered_date && r.actual_delivered_date <= r.target_date).length
    const deliveredRows  = allDistRows.filter(r => r.status === 'delivered').length
    const onTimePct      = deliveredRows > 0 ? Math.round((onTimeRows / deliveredRows) * 100) : null
    return { totalCopies, plannedCopies, deliveredCopies, inTransit, pending, onTimePct, totalJobs: jobs.length }
  }, [jobs, allDistRows])

  // ── By delivery method ─────────────────────────────────────────────────────
  const byMethod = useMemo(() => {
    const map = new Map<string, number>()
    allDistRows.forEach(r => {
      const m = r.delivery_method ?? 'unknown'
      map.set(m, (map.get(m) ?? 0) + (r.quantity ?? 0))
    })
    return Array.from(map.entries()).map(([method, qty]) => ({ method, qty })).sort((a, b) => b.qty - a.qty)
  }, [allDistRows])

  // ── By recipient type ──────────────────────────────────────────────────────
  const byRecipientType = useMemo(() => {
    const map = new Map<string, number>()
    allDistRows.forEach(r => {
      const t = r.recipient_type ?? 'unknown'
      map.set(t, (map.get(t) ?? 0) + (r.quantity ?? 0))
    })
    return Array.from(map.entries()).map(([type, qty]) => ({ type, qty })).sort((a, b) => b.qty - a.qty)
  }, [allDistRows])

  // ── Per-job table ──────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() =>
    jobs.filter(j => {
      const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || (j.request_number ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || j.status === statusFilter
      return matchSearch && matchStatus
    }), [jobs, search, statusFilter])

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = allDistRows.map(r => ({
      'Job #':           r.job.request_number ?? '',
      'Job Title':       r.job.title,
      'Job Status':      r.job.status,
      'Recipient Group': r.recipient_group,
      'Recipient Type':  r.recipient_type ?? '',
      'Qty Planned':     r.quantity,
      'Delivery Method': r.delivery_method ?? '',
      'Person in Charge': r.pic_name ?? '',
      'Target Date':     r.target_date ?? '',
      'Delivered Date':  r.actual_delivered_date ?? '',
      'Status':          r.status ?? '',
      'Notes':           r.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Distribution Report')
    XLSX.writeFile(wb, `distribution-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const fmt = (n: number) => n.toLocaleString()
  const cap = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const DIST_STATUS_CLS: Record<string, string> = {
    pending:    'bg-gray-100 text-gray-600',
    in_transit: 'bg-sky-100 text-sky-700',
    delivered:  'bg-green-100 text-green-700',
    partial:    'bg-amber-100 text-amber-700',
    returned:   'bg-red-100 text-red-700',
  }

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={allDistRows.length === 0}>
          <Download className="h-4 w-4 mr-2" />Export Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center text-center">
          <div className="p-2 bg-orange-100 rounded-lg mb-2"><Package className="w-5 h-5 text-orange-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalCopies)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Copies Printed</p>
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-lg mb-2"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <p className="text-2xl font-bold text-green-700">{fmt(stats.deliveredCopies)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Copies Delivered</p>
          {stats.plannedCopies > 0 && (
            <p className="text-xs text-green-600 font-medium mt-1">{Math.round((stats.deliveredCopies / stats.plannedCopies) * 100)}% of planned</p>
          )}
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <div className="p-2 bg-sky-100 rounded-lg mb-2"><Truck className="w-5 h-5 text-sky-600" /></div>
          <p className="text-2xl font-bold text-sky-700">{fmt(stats.inTransit)}</p>
          <p className="text-xs text-gray-500 mt-0.5">In Transit</p>
          <p className="text-xs text-amber-600 font-medium mt-1">{fmt(stats.pending)} pending</p>
        </Card>
        <Card className="p-5 flex flex-col items-center text-center">
          <div className="p-2 bg-purple-100 rounded-lg mb-2"><AlertCircle className="w-5 h-5 text-purple-600" /></div>
          {stats.onTimePct !== null ? (
            <>
              <p className={`text-2xl font-bold ${stats.onTimePct >= 80 ? 'text-green-700' : stats.onTimePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {stats.onTimePct}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">On-Time Delivery</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-400">—</p>
              <p className="text-xs text-gray-500 mt-0.5">On-Time Delivery</p>
              <p className="text-xs text-gray-400 mt-1">No deliveries yet</p>
            </>
          )}
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By delivery method */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Copies by Delivery Method
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {byMethod.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No distribution data yet</p>
            ) : byMethod.map(({ method, qty }) => {
              const pct = stats.plannedCopies > 0 ? (qty / stats.plannedCopies * 100).toFixed(1) : 0
              return (
                <div key={method}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{cap(method)}</span>
                    <span className="text-gray-500">{fmt(qty)} copies ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* By recipient type */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" /> Copies by Recipient Type
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {byRecipientType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No distribution data yet</p>
            ) : byRecipientType.map(({ type, qty }) => {
              const pct = stats.plannedCopies > 0 ? (qty / stats.plannedCopies * 100).toFixed(1) : 0
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{cap(type)}</span>
                    <span className="text-gray-500">{fmt(qty)} copies ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Per-job delivery progress table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Delivery Progress by Print Job
          </h3>
          <div className="flex items-center gap-3">
            <input
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {['draft','submitted','approved','press_assigned','in_production','quality_check','ready','distributing','completed','rejected','cancelled'].map(s => (
                <option key={s} value={s}>{cap(s)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Request #', 'Title', 'Type', 'Printed', 'Planned', 'Delivered', 'Progress', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No print jobs found</td></tr>
              ) : filteredJobs.map(job => {
                const distRows    = job.distribution_plan ?? []
                const planned     = distRows.reduce((s, r) => s + (r.quantity ?? 0), 0)
                const delivered   = distRows.filter(r => r.status === 'delivered').reduce((s, r) => s + r.quantity, 0)
                const pct         = job.quantity > 0 ? Math.round((delivered / job.quantity) * 100) : 0
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{job.request_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">{job.title}</div>
                      <div className="text-xs text-gray-400">{distRows.length} recipient group{distRows.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-gray-600 whitespace-nowrap">{job.publication_type}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{fmt(job.quantity)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(planned)}</td>
                    <td className="px-4 py-3 font-medium text-green-700 whitespace-nowrap">{fmt(delivered)}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      {distRows.length === 0 ? (
                        <span className="text-xs text-gray-300">No plan</span>
                      ) : (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-orange-400' : 'bg-sky-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'completed'   ? 'bg-green-100 text-green-700' :
                        job.status === 'distributing'? 'bg-sky-100 text-sky-700' :
                        job.status === 'ready'       ? 'bg-teal-100 text-teal-700' :
                        job.status === 'in_production'?'bg-amber-100 text-amber-700' :
                        job.status === 'rejected'    ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{cap(job.status)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail: all distribution rows */}
      {allDistRows.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4" /> All Distribution Rows
              <span className="text-xs font-normal text-gray-400">({allDistRows.length} rows across {stats.totalJobs} jobs)</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Job', 'Recipient Group', 'Type', 'Qty', 'Method', 'PIC', 'Target', 'Delivered', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allDistRows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs text-gray-500">{r.job.request_number ?? '—'}</div>
                      <div className="text-xs text-gray-700 max-w-[160px] truncate">{r.job.title}</div>
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{r.recipient_group}</td>
                    <td className="px-4 py-2 text-xs capitalize text-gray-600 whitespace-nowrap">{r.recipient_type ?? '—'}</td>
                    <td className="px-4 py-2 font-medium whitespace-nowrap">{fmt(r.quantity)}</td>
                    <td className="px-4 py-2 text-xs capitalize text-gray-600 whitespace-nowrap">{r.delivery_method ? cap(r.delivery_method) : '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{r.pic_name ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{r.target_date ? new Date(r.target_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{r.actual_delivered_date ? new Date(r.actual_delivered_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${DIST_STATUS_CLS[r.status ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
                        {cap(r.status ?? 'pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Publication Requests (existing logic extracted into sub-component)
// ─────────────────────────────────────────────────────────────────────────────
function PublicationRequestsReport() {
  const { data: rawRequests = [], isLoading } = usePublicationRequests({})
  const requests = rawRequests as Row[]
  // Print modal state
  const [showPrintModal, setShowPrintModal]   = useState(false)
  const [printStatuses, setPrintStatuses]     = useState<Set<string>>(new Set())
  const [printFields, setPrintFields]         = useState<Set<string>>(new Set(
    ALL_FIELDS.filter(f => f.key !== 'notes' && f.key !== 'cover_url').map(f => f.key)
  ))

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStatuses, setExportStatuses]   = useState<Set<string>>(new Set())
  const [exportFields, setExportFields]       = useState<Set<string>>(new Set(
    ALL_FIELDS.filter(f => f.key !== 'notes' && f.key !== 'cover_url').map(f => f.key)
  ))

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = requests.length
    const pending   = requests.filter(r => r.status === 'pending' || r.status === 'submitted').length
    const approved  = requests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length
    const rejected  = requests.filter(r => r.status === 'rejected').length
    const totalCost = requests.reduce((s, r) => s + (r.estimated_cost ?? 0) * (r.quantity ?? 1), 0)
    const totalQty  = requests.reduce((s, r) => s + (r.quantity ?? 0), 0)
    return { total, pending, approved, rejected, totalCost, totalQty }
  }, [requests])

  const byType = useMemo(() => {
    const map = new Map<string, number>()
    requests.forEach(r => {
      const t = r.publication_type ?? 'other'
      map.set(t, (map.get(t) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [requests])

  const byStatus = useMemo(() => {
    const map = new Map<string, number>()
    requests.forEach(r => {
      const s = r.status ?? 'unknown'
      map.set(s, (map.get(s) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }))
  }, [requests])

  const allStatuses = useMemo(() => [...new Set(requests.map(r => r.status ?? 'unknown'))], [requests])

  // top 5 by total cost
  const topByCost = useMemo(() =>
    [...requests]
      .sort((a, b) => ((b.estimated_cost ?? 0) * (b.quantity ?? 1)) - ((a.estimated_cost ?? 0) * (a.quantity ?? 1)))
      .slice(0, 5),
    [requests])

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  // ── Print ──────────────────────────────────────────────────────────────────
  const openPrintModal = () => {
    setPrintStatuses(new Set(allStatuses))
    setPrintFields(new Set(ALL_FIELDS.map(f => f.key)))
    setShowPrintModal(true)
  }

  const handlePrint = () => {
    const filtered = requests.filter(r => printStatuses.has(r.status ?? 'unknown'))
    const fields   = ALL_FIELDS.filter(f => printFields.has(f.key))
    const headerCells = fields.map(f => `<th>${f.label}</th>`).join('')
    const rows = filtered.map(r =>
      `<tr>${fields.map(f => {
        if (f.key === 'cover_url') {
          const url = r.cover_url
          return url
            ? `<td><a href="${encodeURI(url)}" target="_blank" style="color:#ff7e15;text-decoration:underline;font-weight:600;">View Cover</a></td>`
            : `<td>—</td>`
        }
        return `<td>${getFieldValue(r, f.key)}</td>`
      }).join('')}</tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><title>Publication Requests Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p.sub { color: #666; margin-bottom: 12px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #ff7e15; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
  tr:nth-child(even) td { background: #f9fafb; }
  @media print { @page { margin: 15mm; size: landscape; } }
</style></head><body>
<h1>Publication Requests Report</h1>
<p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total records: ${filtered.length}</p>
<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`

    const win = window.open('', '_blank', 'width=1100,height=800')
    if (!win) { toast.error('Pop-up blocked — please allow pop-ups for this site'); return }
    win.document.open(); win.document.write(html); win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
    setShowPrintModal(false)
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const openExportModal = () => {
    setExportStatuses(new Set(allStatuses))
    setExportFields(new Set(ALL_FIELDS.map(f => f.key)))
    setShowExportModal(true)
  }

  const handleExport = () => {
    const filtered = requests.filter(r => exportStatuses.has(r.status ?? 'unknown'))
    const fields   = ALL_FIELDS.filter(f => exportFields.has(f.key))
    const headers  = fields.map(f => f.label)
    // Each cell is either a raw formula string (no quoting) or a quoted string
    type Cell = { raw: true; value: string } | { raw: false; value: string }
    const rows: Cell[][] = filtered.map(r => fields.map(f => {
      switch (f.key) {
        case 'estimated_cost': return { raw: false, value: r.estimated_cost != null ? String(r.estimated_cost) : '' }
        case 'total_cost':     return { raw: false, value: String((r.estimated_cost ?? 0) * (r.quantity ?? 1)) }
        case 'cover_url':      return r.cover_url
          ? { raw: true,  value: `=HYPERLINK("${r.cover_url}","View Cover")` }
          : { raw: false, value: '' }
        default:               return { raw: false, value: getFieldValue(r, f.key) }
      }
    }))

    const serializeCell = (cell: Cell) =>
      cell.raw ? cell.value : `"${cell.value.replace(/"/g, '""')}"`

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(serializeCell).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `publication-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
  }

  // ── Export XLSX ────────────────────────────────────────────────────────────
  const handleExportXLSX = () => {
    const filtered = requests.filter(r => exportStatuses.has(r.status ?? 'unknown'))
    const fields   = ALL_FIELDS.filter(f => exportFields.has(f.key))

    const headerRow = fields.map(f => f.label)
    const dataRows  = filtered.map(r => fields.map(f => {
      switch (f.key) {
        case 'estimated_cost': return r.estimated_cost ?? ''
        case 'total_cost':     return (r.estimated_cost ?? 0) * (r.quantity ?? 1)
        case 'cover_url':      return r.cover_url ? 'View Cover' : ''
        default:               return getFieldValue(r, f.key)
      }
    }))

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

    // Add real clickable hyperlinks to cover_url cells
    const coverColIdx = fields.findIndex(f => f.key === 'cover_url')
    if (coverColIdx >= 0) {
      filtered.forEach((r, rowIdx) => {
        if (r.cover_url) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: coverColIdx })
          if (ws[cellRef]) ws[cellRef].l = { Target: r.cover_url, Tooltip: 'View Cover' }
        }
      })
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Publication Requests')
    XLSX.writeFile(wb, `publication-requests-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowExportModal(false)
  }

  // ── Selector UI (shared between print & export) ────────────────────────────
  const renderSelectors = (
    selectedSts: Set<string>,
    setSts: React.Dispatch<React.SetStateAction<Set<string>>>,
    selectedFlds: Set<string>,
    setFlds: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Statuses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status</h3>
          <div className="flex gap-2 text-xs">
            <button className="text-[#ff7e15] hover:underline" onClick={() => setSts(new Set(allStatuses))}>Select all</button>
            <span className="text-gray-300">|</span>
            <button className="text-gray-500 hover:underline" onClick={() => setSts(new Set())}>Clear</button>
          </div>
        </div>
        <div className="space-y-2">
          {allStatuses.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[#ff7e15]">
                {selectedSts.has(s)
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4 text-gray-400 group-hover:text-[#ff7e15]" />}
              </span>
              <input type="checkbox" className="sr-only" checked={selectedSts.has(s)} onChange={() => toggle(setSts, s)} />
              <span className="text-sm text-gray-800">{capitalize(s)}</span>
              <span className="ml-auto text-xs text-gray-400">{requests.filter(r => (r.status ?? 'unknown') === s).length}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fields</h3>
          <div className="flex gap-2 text-xs">
            <button className="text-[#ff7e15] hover:underline" onClick={() => setFlds(new Set(ALL_FIELDS.map(f => f.key)))}>Select all</button>
            <span className="text-gray-300">|</span>
            <button className="text-gray-500 hover:underline" onClick={() => setFlds(new Set())}>Clear</button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {ALL_FIELDS.map(field => (
            <label key={field.key} className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[#ff7e15]">
                {selectedFlds.has(field.key)
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4 text-gray-400 group-hover:text-[#ff7e15]" />}
              </span>
              <input type="checkbox" className="sr-only" checked={selectedFlds.has(field.key)} onChange={() => toggle(setFlds, field.key)} />
              <span className="text-sm text-gray-800">{field.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const printCount  = requests.filter(r => printStatuses.has(r.status ?? 'unknown')).length
  const exportCount = requests.filter(r => exportStatuses.has(r.status ?? 'unknown')).length

  const statusColors: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved:  'bg-green-100 text-green-700',
    fulfilled: 'bg-emerald-100 text-emerald-700',
    rejected:  'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={openPrintModal} disabled={isLoading}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button type="button" onClick={openExportModal} disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff7e15] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-orange-100 rounded-xl mb-3"><BookOpen className="w-6 h-6 text-[#ff7e15]" /></div>
              <p className="text-3xl font-bold text-[#ff7e15] mb-1">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Requests</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-yellow-100 rounded-xl mb-3"><Clock className="w-6 h-6 text-yellow-600" /></div>
              <p className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 rounded-xl mb-3"><CheckCircle className="w-6 h-6 text-green-600" /></div>
              <p className="text-3xl font-bold text-green-600 mb-1">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approved / Fulfilled</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-purple-100 rounded-xl mb-3"><DollarSign className="w-6 h-6 text-purple-600" /></div>
              <p className="text-3xl font-bold text-purple-600 mb-1">₱{stats.totalCost.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Est. Cost</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Requests by Type */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart className="h-5 w-5" /> Requests by Type
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {byType.map(({ type, count }) => {
                  const pct = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{capitalize(type)}</span>
                        <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#ff7e15] h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {byType.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
              </div>
            </Card>

            {/* Requests by Status */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Requests by Status
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {byStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {capitalize(status)}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#ff7e15] h-2 rounded-full"
                          style={{ width: stats.total > 0 ? `${(count / stats.total * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
                {byStatus.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
              </div>
            </Card>

            {/* Top Requests by Cost */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Top Requests by Cost
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {topByCost.map((r, idx) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-[#ff7e15] text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{r.publication_title}</div>
                        <div className="text-xs text-gray-500">{capitalize(r.publication_type)} · qty {r.quantity ?? 0}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 shrink-0">
                      ₱{((r.estimated_cost ?? 0) * (r.quantity ?? 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
                {topByCost.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
              </div>
            </Card>

            {/* Summary card */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total Requests</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total Copies Requested</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalQty.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-xs text-yellow-700 mb-1">Pending Approval</div>
                    <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-xs text-red-700 mb-1">Rejected</div>
                    <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Total Estimated Cost</div>
                  <div className="text-3xl font-bold text-purple-700">₱{stats.totalCost.toLocaleString()}</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} size="lg" centered>
          <ModalHeader onClose={() => setShowPrintModal(false)}>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-600" />
              <span>Print Report</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {renderSelectors(printStatuses, setPrintStatuses, printFields, setPrintFields)}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{printCount}</strong> record{printCount !== 1 ? 's' : ''} will be printed across{' '}
              <strong>{printStatuses.size}</strong> status{printStatuses.size === 1 ? '' : 'es'} with{' '}
              <strong>{printFields.size}</strong> field{printFields.size === 1 ? '' : 's'}.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowPrintModal(false)}>Cancel</Button>
            <Button onClick={handlePrint} disabled={printStatuses.size === 0 || printFields.size === 0}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <Modal open={showExportModal} onClose={() => setShowExportModal(false)} size="lg" centered>
          <ModalHeader onClose={() => setShowExportModal(false)}>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-gray-600" />
              <span>Export CSV</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {renderSelectors(exportStatuses, setExportStatuses, exportFields, setExportFields)}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{exportCount}</strong> record{exportCount !== 1 ? 's' : ''} will be exported across{' '}
              <strong>{exportStatuses.size}</strong> status{exportStatuses.size === 1 ? '' : 'es'} with{' '}
              <strong>{exportFields.size}</strong> field{exportFields.size === 1 ? '' : 's'}.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleExport} disabled={exportStatuses.size === 0 || exportFields.size === 0}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button onClick={handleExportXLSX} disabled={exportStatuses.size === 0 || exportFields.size === 0}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
