'use client'

import { useState, useMemo } from 'react'
import { ClipboardCheck, Plus, Search, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, Badge, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useClearanceChecklists, useCreateClearanceChecklist, useUpdateClearanceChecklist, useClearChecklistItem } from '@/hooks'
import { useEmployees } from '@/hooks/useEmployees'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useTerminationRequests } from '@/hooks/useTerminations'
import type { ClearanceChecklistWithRelations, ClearanceChecklistItem } from '@/services'
import { formatDate } from '@/lib/utils'

// ── Status meta ───────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  open:        { label: 'Open',        color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-600' },
}

// ── Create Checklist Modal ────────────────────────────────────

function CreateChecklistModal({ onClose }: { onClose: () => void }) {
  const { data: termRequests = [] } = useTerminationRequests({})
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateClearanceChecklist()

  const [selectedTermId, setSelectedTermId] = useState('')
  const [lastWorkingDate, setLastWorkingDate] = useState('')
  const [notes, setNotes] = useState('')

  // Filter: termination requests not yet linked to a clearance
  const eligible = (termRequests as any[]).filter(r =>
    ['pending', 'approved', 'in_review'].includes(r.status)
  )

  const selectedTerm = eligible.find(r => r.id === selectedTermId)

  const handleCreate = async () => {
    if (!selectedTermId) return
    await createMutation.mutateAsync({
      termination_request_id: selectedTermId,
      employee_id: selectedTerm?.employee_id,
      last_working_date: lastWorkingDate || null,
      notes: notes || null,
      created_by: currentEmployee?.id ?? null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>Create Clearance Checklist</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linked Separation Request *
            </label>
            <select
              value={selectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a termination/resignation request…</option>
              {eligible.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.employee
                    ? `${r.employee.first_name} ${r.employee.last_name}`
                    : r.employee_id} — {r.termination_type?.replace(/_/g, ' ')} ({r.request_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Date</label>
            <input
              type="date"
              value={lastWorkingDate}
              onChange={e => setLastWorkingDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special instructions…"
            />
          </div>
          <p className="text-xs text-gray-400">
            Standard checklist items (IT, Finance, HR, Admin, Supervisor) will be auto-populated via the database helper.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={!selectedTermId || createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating…' : 'Create Checklist'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ── Checklist Detail Panel ────────────────────────────────────

function ChecklistDetail({ checklist, onBack }: {
  checklist: ClearanceChecklistWithRelations
  onBack: () => void
}) {
  const { data: currentEmployee } = useCurrentEmployee()
  const clearItemMutation = useClearChecklistItem()
  const updateMutation = useUpdateClearanceChecklist()
  const { data: refreshed } = useClearanceChecklists()

  // Use refreshed data if available
  const current = (refreshed || []).find(c => c.id === checklist.id) || checklist
  const items: ClearanceChecklistItem[] = (current as any).items || []

  const clearedCount = items.filter(i => i.is_cleared).length
  const totalCount = items.length
  const allCleared = totalCount > 0 && clearedCount === totalCount

  const handleClearItem = async (itemId: string) => {
    await clearItemMutation.mutateAsync({
      itemId,
      clearedBy: currentEmployee?.id ?? '',
    })
  }

  const handleMarkFinalPayReleased = async () => {
    await updateMutation.mutateAsync({
      id: checklist.id,
      updates: {
        final_pay_released: true,
        final_pay_released_at: new Date().toISOString(),
        final_pay_released_by: currentEmployee?.id ?? null,
        status: 'completed',
      },
    })
  }

  const emp = checklist.employee
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-sm">← Back</Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clearance: {empName}</h2>
          <p className="text-sm text-gray-500">
            {checklist.last_working_date ? `Last day: ${formatDate(checklist.last_working_date)}` : 'Last working date not set'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[checklist.status]?.color}`}>
            {STATUS_META[checklist.status]?.label}
          </span>
          {allCleared && !checklist.final_pay_released && (
            <Button variant="primary" onClick={handleMarkFinalPayReleased} disabled={updateMutation.isPending}>
              Mark Final Pay Released
            </Button>
          )}
          {checklist.final_pay_released && (
            <span className="text-green-700 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Final pay released {checklist.final_pay_released_at ? formatDate(checklist.final_pay_released_at) : ''}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Clearance Progress</span>
            <span className="text-sm font-bold text-gray-900">{clearedCount}/{totalCount} items cleared</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(clearedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No items. Run the SQL helper <code>seed_clearance_items('{checklist.id}')</code> to populate defaults.
            </div>
          ) : (
            <div className="divide-y">
              {items.map(item => (
                <div key={item.id} className={`flex items-start gap-3 px-4 py-3 ${item.is_cleared ? 'bg-green-50/30' : ''}`}>
                  <button
                    onClick={() => !item.is_cleared && handleClearItem(item.id)}
                    className="mt-0.5 flex-shrink-0"
                    disabled={item.is_cleared || clearItemMutation.isPending}
                  >
                    {item.is_cleared
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : <Circle className="w-5 h-5 text-gray-300 hover:text-green-400 transition-colors" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.is_cleared ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {item.description}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        {item.department}
                      </span>
                    </div>
                    {item.is_cleared && item.cleared_at && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Cleared {formatDate(item.cleared_at)}
                        {item.remarks && ` · ${item.remarks}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function ClearanceTrackingPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<ClearanceChecklistWithRelations | null>(null)

  const { data: checklists = [], isLoading } = useClearanceChecklists()

  const filtered = useMemo(() => {
    return checklists.filter(c => {
      const emp = c.employee
      const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [checklists, search, statusFilter])

  const stats = useMemo(() => ({
    total: checklists.length,
    open: checklists.filter(c => c.status === 'open').length,
    in_progress: checklists.filter(c => c.status === 'in_progress').length,
    completed: checklists.filter(c => c.status === 'completed').length,
  }), [checklists])

  if (selected) {
    return <ChecklistDetail checklist={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clearance Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee clearance checklists for resignations and separations
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Checklist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Open', value: stats.open, color: 'text-gray-600' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-700' },
          { label: 'Completed', value: stats.completed, color: 'text-green-700' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {checklists.length === 0
                  ? 'No clearance checklists yet. Click "Create Checklist" to start one for a separating employee.'
                  : 'No checklists match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Last Working Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Final Pay</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(c => {
                    const emp = c.employee
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={emp?.avatar_url}
                              firstName={emp?.first_name ?? '?'}
                              lastName={emp?.last_name ?? ''}
                              size="sm"
                            />
                            <span className="font-medium text-gray-900">
                              {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {c.last_working_date ? formatDate(c.last_working_date) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[c.status]?.color}`}>
                            {STATUS_META[c.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.final_pay_released ? (
                            <span className="text-green-700 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Released
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" onClick={() => setSelected(c)} className="text-xs">
                            View →
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreate && <CreateChecklistModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
