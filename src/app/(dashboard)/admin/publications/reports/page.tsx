'use client'

import { useState, useMemo, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { usePublicationRequests } from '@/hooks/usePublications'
import {
  BookOpen, DollarSign, Clock, CheckCircle, XCircle, BarChart3,
  PieChart, Download, Printer, CheckSquare, Square, TrendingUp,
} from 'lucide-react'

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
  { key: 'purpose',           label: 'Purpose' },
  { key: 'notes',             label: 'Notes' },
  { key: 'created_at',        label: 'Date Requested' },
  { key: 'cover_url',         label: 'Cover Image URL' },
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
    case 'cover_url':         return row.cover_url ?? ''
    default:                  return ''
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PublicationReportsPage() {
  const { data: rawRequests = [], isLoading } = usePublicationRequests({})
  const requests = rawRequests as Row[]
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  // Print modal state
  const [showPrintModal, setShowPrintModal]   = useState(false)
  const [printStatuses, setPrintStatuses]     = useState<Set<string>>(new Set())
  const [printFields, setPrintFields]         = useState<Set<string>>(new Set(ALL_FIELDS.map(f => f.key)))

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStatuses, setExportStatuses]   = useState<Set<string>>(new Set())
  const [exportFields, setExportFields]       = useState<Set<string>>(new Set(ALL_FIELDS.map(f => f.key)))

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
            ? `<td><img src="${url}" alt="cover" style="width:48px;height:64px;object-fit:cover;border-radius:3px;" /></td>`
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

    const iframe = printFrameRef.current!
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
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
    const rows     = filtered.map(r => fields.map(f => {
      switch (f.key) {
        case 'estimated_cost': return r.estimated_cost != null ? String(r.estimated_cost) : ''
        case 'total_cost':     return String((r.estimated_cost ?? 0) * (r.quantity ?? 1))
        case 'cover_url':      return r.cover_url ?? ''
        default:               return getFieldValue(r, f.key)
      }
    }))

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `publication-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publication Reports</h1>
          <p className="text-gray-600">Analytics and export for publication requests</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={openPrintModal} disabled={isLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button type="button" onClick={openExportModal} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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

      {/* Hidden print iframe */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame" />

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
            <Button onClick={handleExport} disabled={exportStatuses.size === 0 || exportFields.size === 0}>
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
