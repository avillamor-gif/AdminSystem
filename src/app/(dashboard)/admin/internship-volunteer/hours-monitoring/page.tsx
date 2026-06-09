'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, TrendingUp, Users, AlertCircle, ListOrdered, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react'
import { Card, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useProgramEnrollments, useUpdateProgramEnrollment, useRecalcInternshipHours } from '@/hooks/useInternship'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'
import type { AttendanceRecord } from '@/services/attendance.service'
import { formatDate, localDateStr } from '@/lib/utils'
import toast from 'react-hot-toast'

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 75)  return 'bg-blue-500'
  if (pct >= 40)  return 'bg-orange-400'
  return 'bg-red-400'
}

function hoursUntilDeadline(endDate: string | null): number | null {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return ''
  // Convert ISO to datetime-local input value (YYYY-MM-DDTHH:mm)
  return new Date(iso).toISOString().slice(0, 16)
}

function toISOFromLocal(val: string): string {
  // datetime-local value → full ISO string
  return new Date(val).toISOString()
}

function sessionHrs(r: AttendanceRecord): number {
  if (!r.clock_in || !r.clock_out) return 0
  return Math.max(0, (new Date(r.clock_out as string).getTime() - new Date(r.clock_in as string).getTime()) / (1000 * 60 * 60))
}

// ─── Sessions Modal ────────────────────────────────────────────────────────────

function SessionsModal({
  enrollment,
  onClose,
}: {
  enrollment: ProgramEnrollmentWithRelations
  onClose: () => void
}) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Form state (shared for add + edit)
  const [formDate, setFormDate] = useState(localDateStr(new Date()))
  const [formClockIn, setFormClockIn] = useState('')
  const [formClockOut, setFormClockOut] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRecords = useCallback(async () => {
    if (!enrollment.employee_id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/internship/attendance?employeeId=${enrollment.employee_id}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [enrollment.employee_id])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  function openEdit(r: AttendanceRecord) {
    setEditingRecord(r)
    setIsAdding(false)
    setFormDate(r.date)
    setFormClockIn(toLocalDatetimeValue(r.clock_in as string))
    setFormClockOut(toLocalDatetimeValue(r.clock_out as string | null))
  }

  function openAdd() {
    setEditingRecord(null)
    setIsAdding(true)
    const now = new Date()
    setFormDate(localDateStr(now))
    setFormClockIn('')
    setFormClockOut('')
  }

  function cancelForm() {
    setEditingRecord(null)
    setIsAdding(false)
  }

  async function saveRecord() {
    if (!formClockIn) { toast.error('Clock-in time is required'); return }
    setSaving(true)
    try {
      if (editingRecord) {
        // PATCH
        const res = await fetch('/api/internship/attendance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRecord.id,
            clock_in: toISOFromLocal(formClockIn),
            clock_out: formClockOut ? toISOFromLocal(formClockOut) : null,
            enrollmentId: enrollment.id,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed')
        toast.success('Session updated')
      } else {
        // POST
        const res = await fetch('/api/internship/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: enrollment.employee_id,
            date: formDate,
            clock_in: toISOFromLocal(`${formDate}T${formClockIn.includes('T') ? formClockIn.split('T')[1] : formClockIn}`),
            clock_out: formClockOut
              ? toISOFromLocal(`${formDate}T${formClockOut.includes('T') ? formClockOut.split('T')[1] : formClockOut}`)
              : null,
            enrollmentId: enrollment.id,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Create failed')
        toast.success('Session added')
      }
      cancelForm()
      await fetchRecords()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error saving session')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(r: AttendanceRecord) {
    if (!confirm('Delete this session? Rendered hours will be recalculated.')) return
    try {
      const res = await fetch(`/api/internship/attendance?id=${r.id}&enrollmentId=${enrollment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed')
      toast.success('Session deleted')
      await fetchRecords()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const name = enrollment.employee
    ? `${enrollment.employee.first_name} ${enrollment.employee.last_name}`
    : 'Participant'

  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        Attendance Sessions — {name}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Add / Edit form */}
          {(isAdding || editingRecord) && (
            <div className="border border-cyan-200 bg-cyan-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-cyan-800">
                {editingRecord ? 'Edit Session' : 'Add Manual Session'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Clock In <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formClockIn.includes('T') ? formClockIn.split('T')[1].slice(0, 5) : formClockIn}
                    onChange={(e) => setFormClockIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Clock Out <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    type="time"
                    value={formClockOut.includes('T') ? formClockOut.split('T')[1].slice(0, 5) : formClockOut}
                    onChange={(e) => setFormClockOut(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={cancelForm} disabled={saving}>Cancel</Button>
                <Button variant="primary" onClick={saveRecord} disabled={saving}>
                  {saving ? 'Saving…' : editingRecord ? 'Update Session' : 'Add Session'}
                </Button>
              </div>
            </div>
          )}

          {/* Records table */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{records.length} session(s) found</p>
            {!isAdding && !editingRecord && (
              <Button variant="secondary" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add Manual Session
              </Button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading sessions…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    {['Date', 'Clock In', 'Clock Out', 'Hours', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => {
                    const hrs = sessionHrs(r)
                    const isOpen = r.clock_in && !r.clock_out
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{formatDate(r.date)}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {r.clock_in ? new Date(r.clock_in as string).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {isOpen ? (
                            <span className="text-amber-600 font-medium text-xs">Not clocked out</span>
                          ) : r.clock_out ? (
                            new Date(r.clock_out as string).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-cyan-700">
                          {r.clock_out ? `${hrs.toFixed(2)}h` : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteRecord(r)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <p className="text-xs text-gray-400 flex-1">
          Rendered hours are recalculated automatically after each change.
        </p>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  )
}

export default function HoursMonitoringPage() {
  const { data: enrollments = [], isLoading, refetch } = useProgramEnrollments({ status: 'active' })
  const updateMutation = useUpdateProgramEnrollment()
  const recalcMutation = useRecalcInternshipHours()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHours, setEditHours] = useState<string>('')
  const [sessionsTarget, setSessionsTarget] = useState<ProgramEnrollmentWithRelations | null>(null)

  const filtered = enrollments.filter(e => {
    const name = `${e.employee?.first_name ?? ''} ${e.employee?.last_name ?? ''}`.toLowerCase()
    const inst = (e.partner_institution?.name ?? '').toLowerCase()
    return !search || name.includes(search.toLowerCase()) || inst.includes(search.toLowerCase())
  })

  // Overall stats across all active enrollments
  const totalRequired = enrollments.reduce((s, e) => s + (e.required_hours || 0), 0)
  const totalRendered = enrollments.reduce((s, e) => s + (Number(e.rendered_hours) || 0), 0)
  const atRisk = enrollments.filter(e => {
    const daysLeft = hoursUntilDeadline(e.end_date)
    const pct = e.required_hours > 0 ? (Number(e.rendered_hours) / e.required_hours) * 100 : 0
    return daysLeft !== null && daysLeft <= 14 && pct < 80
  }).length

  async function saveHours(enr: ProgramEnrollmentWithRelations) {
    const parsed = parseFloat(editHours)
    if (isNaN(parsed) || parsed < 0) return
    await updateMutation.mutateAsync({ id: enr.id, data: { rendered_hours: parsed } })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hours Monitoring</h1>
          <p className="text-gray-600 mt-1">Track rendered vs required hours for active participants</p>
        </div>
        <Button
          onClick={() => recalcMutation.mutate(undefined)}
          disabled={recalcMutation.isPending}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <RefreshCw className={`w-4 h-4 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
          {recalcMutation.isPending ? 'Recalculating...' : 'Sync All Hours'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Participants', value: enrollments.length,              icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Total Hours Required', value: `${totalRequired}h`,            icon: Clock,       color: 'text-gray-700',   bg: 'bg-gray-100' },
          { label: 'Total Hours Rendered', value: `${totalRendered.toFixed(1)}h`, icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'At Risk',              value: atRisk,                         icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Overall progress bar */}
      {totalRequired > 0 && (
        <Card className="p-4">
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span className="font-medium">Overall Program Progress</span>
            <span>{totalRendered.toFixed(1)}h of {totalRequired}h ({Math.round((totalRendered / totalRequired) * 100)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${progressColor(Math.round((totalRendered / totalRequired) * 100))}`}
              style={{ width: `${Math.min(100, (totalRendered / totalRequired) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Search */}
      <div>
        <Input placeholder="Search participant or institution…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Participant', 'Institution', 'Program', 'Period', 'Hours Progress', 'Days Left', 'Rendered Hours', 'Sessions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No active participants found.</td></tr>
              ) : filtered.map(enr => {
                const rendered = Number(enr.rendered_hours) || 0
                const required = enr.required_hours || 1
                const pct      = Math.min(100, Math.round((rendered / required) * 100))
                const daysLeft = hoursUntilDeadline(enr.end_date)
                const isAtRisk = daysLeft !== null && daysLeft <= 14 && pct < 80

                return (
                  <tr key={enr.id} className={`hover:bg-gray-50 ${isAtRisk ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {enr.employee ? `${enr.employee.first_name} ${enr.employee.last_name}` : '—'}
                      </div>
                      <div className="text-xs text-gray-400">{enr.employee?.employee_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {enr.partner_institution?.name ?? <span className="text-gray-400 italic">Walk-in</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700 capitalize">{enr.program_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{formatDate(enr.start_date)}</div>
                      <div className="text-xs text-gray-400">{enr.end_date ? `→ ${formatDate(enr.end_date)}` : 'No end date'}</div>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${progressColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 min-w-[40px] text-right">{pct}%</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{rendered.toFixed(1)}h of {required}h</div>
                    </td>
                    <td className="px-4 py-3">
                      {daysLeft === null ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : daysLeft < 0 ? (
                        <span className="text-xs font-medium text-red-600">Overdue</span>
                      ) : (
                        <span className={`text-xs font-medium ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 14 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {daysLeft}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === enr.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            className="w-20 px-2 py-1 border border-orange-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={editHours}
                            onChange={e => setEditHours(e.target.value)}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') saveHours(enr); if (e.key === 'Escape') setEditingId(null) }}
                          />
                          <button
                            onClick={() => saveHours(enr)}
                            disabled={updateMutation.isPending}
                            className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(enr.id); setEditHours(rendered.toString()) }}
                          className="text-sm font-medium text-gray-700 hover:text-orange-600 hover:underline"
                          title="Click to update rendered hours"
                        >
                          {rendered.toFixed(1)}h
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSessionsTarget(enr)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-900 hover:underline"
                        title="View / edit attendance sessions"
                      >
                        <ListOrdered className="w-3.5 h-3.5" /> Sessions
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sessions modal */}
      {sessionsTarget && (
        <SessionsModal
          enrollment={sessionsTarget}
          onClose={() => { setSessionsTarget(null); refetch() }}
        />
      )}
    </div>
  )
}
