'use client'

import { useState, useMemo } from 'react'
import { ShieldAlert, Plus, Search } from 'lucide-react'
import { Card, CardContent, Button, Avatar, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useDisciplinaryRecords, useCreateDisciplinaryRecord, useUpdateDisciplinaryRecord } from '@/hooks'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useEmployees } from '@/hooks/useEmployees'
import {
  disciplinaryService,
  nextPenaltyLevel,
  PENALTY_LEVEL_LABELS,
  OFFENSE_TYPE_LABELS,
} from '@/services'
import type {
  DisciplinaryRecordWithRelations,
  DisciplinaryOffenseType,
  DisciplinaryPenaltyLevel,
  DisciplinaryStatus,
} from '@/services'
import { formatDate } from '@/lib/utils'

// ── Meta ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<DisciplinaryStatus, string> = {
  open:         'bg-red-100 text-red-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  appealed:     'bg-yellow-100 text-yellow-800',
  closed:       'bg-gray-100 text-gray-600',
  overturned:   'bg-green-100 text-green-700',
}

const PENALTY_COLORS: Record<DisciplinaryPenaltyLevel, string> = {
  verbal_warning:    'bg-yellow-50 text-yellow-700',
  written_warning_1: 'bg-orange-100 text-orange-700',
  written_warning_2: 'bg-orange-200 text-orange-800',
  suspension_1day:   'bg-red-100 text-red-700',
  suspension_3day:   'bg-red-200 text-red-800',
  suspension_5day:   'bg-red-300 text-red-900',
  dismissal:         'bg-red-900 text-white',
}

// ── Create Modal ──────────────────────────────────────────────

function CreateRecordModal({ onClose }: { onClose: () => void }) {
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateDisciplinaryRecord()

  const [employeeId, setEmployeeId] = useState('')
  const [offenseType, setOffenseType] = useState<DisciplinaryOffenseType>('tardiness')
  const [offenseDate, setOffenseDate] = useState('')
  const [description, setDescription] = useState('')
  const [autoCount, setAutoCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCount = async (empId: string, type: DisciplinaryOffenseType) => {
    if (!empId) return
    setLoading(true)
    try {
      const count = await disciplinaryService.getOffenseCount(empId, type)
      setAutoCount(count + 1) // next offense
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id)
    if (id) fetchCount(id, offenseType)
  }

  const handleTypeChange = (type: DisciplinaryOffenseType) => {
    setOffenseType(type)
    if (employeeId) fetchCount(employeeId, type)
  }

  const offenseCount = autoCount ?? 1
  const suggestedPenalty = nextPenaltyLevel(offenseCount)

  const handleSubmit = async () => {
    if (!employeeId || !offenseDate || !description) return
    await createMutation.mutateAsync({
      employee_id: employeeId,
      offense_type: offenseType,
      offense_date: offenseDate,
      offense_count: offenseCount,
      penalty_level: suggestedPenalty,
      description,
      issued_by: currentEmployee?.id ?? null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>Issue Disciplinary Record</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select
              value={employeeId}
              onChange={e => handleEmployeeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee…</option>
              {(employees as any[]).map((e: any) => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offense Type *</label>
              <select
                value={offenseType}
                onChange={e => handleTypeChange(e.target.value as DisciplinaryOffenseType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(OFFENSE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offense Date *</label>
              <input
                type="date"
                value={offenseDate}
                onChange={e => setOffenseDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {employeeId && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="text-gray-600">
                <span className="font-medium">Offense count:</span> #{loading ? '…' : offenseCount} for {OFFENSE_TYPE_LABELS[offenseType]}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Suggested penalty:</span>{' '}
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PENALTY_COLORS[suggestedPenalty]}`}>
                  {PENALTY_LEVEL_LABELS[suggestedPenalty]}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Details *</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident, date/time, witnesses, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          onClick={handleSubmit}
          disabled={!employeeId || !offenseDate || !description || createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving…' : 'Issue Record'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function DisciplinaryRecordsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data: records = [], isLoading } = useDisciplinaryRecords()
  const updateMutation = useUpdateDisciplinaryRecord()

  const filtered = useMemo(() => {
    return records.filter(r => {
      const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [records, search, statusFilter])

  const stats = useMemo(() => ({
    total: records.length,
    open: records.filter(r => r.status === 'open').length,
    dismissed: records.filter(r => r.penalty_level === 'dismissal').length,
    thisMonth: records.filter(r => {
      const d = new Date(r.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
  }), [records])

  const handleClose = async (record: DisciplinaryRecordWithRelations) => {
    await updateMutation.mutateAsync({ id: record.id, updates: { status: 'closed' } })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinary Records</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track employee infractions with progressive discipline per IBON policy
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Issue Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: stats.total, color: 'text-gray-900' },
          { label: 'Open', value: stats.open, color: 'text-red-700' },
          { label: 'Dismissal Level', value: stats.dismissed, color: 'text-red-900' },
          { label: 'This Month', value: stats.thisMonth, color: 'text-orange-700' },
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
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="appealed">Appealed</option>
          <option value="closed">Closed</option>
          <option value="overturned">Overturned</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {records.length === 0
                  ? 'No disciplinary records on file.'
                  : 'No records match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Offense</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Count</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Penalty</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(r => (
                    <tr key={r.id} className={`hover:bg-gray-50 ${r.penalty_level === 'dismissal' ? 'bg-red-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={r.employee?.avatar_url}
                            firstName={r.employee?.first_name ?? '?'}
                            lastName={r.employee?.last_name ?? ''}
                            size="sm"
                          />
                          <span className="font-medium text-gray-900">
                            {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{OFFENSE_TYPE_LABELS[r.offense_type]}</div>
                        <div className="text-xs text-gray-400 max-w-xs truncate">{r.description}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(r.offense_date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                          #{r.offense_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PENALTY_COLORS[r.penalty_level]}`}>
                          {PENALTY_LEVEL_LABELS[r.penalty_level]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'open' && (
                          <Button
                            variant="ghost"
                            onClick={() => handleClose(r)}
                            className="text-xs text-gray-500"
                            disabled={updateMutation.isPending}
                          >
                            Close
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreate && <CreateRecordModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
