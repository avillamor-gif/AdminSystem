'use client'

import { useState } from 'react'
import { Clock, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { Card, Input } from '@/components/ui'
import { useProgramEnrollments, useUpdateProgramEnrollment } from '@/hooks/useInternship'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'
import { formatDate } from '@/lib/utils'

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

export default function HoursMonitoringPage() {
  const { data: enrollments = [], isLoading } = useProgramEnrollments({ status: 'active' })
  const updateMutation = useUpdateProgramEnrollment()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHours, setEditHours] = useState<string>('')

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hours Monitoring</h1>
        <p className="text-gray-600 mt-1">Track rendered vs required hours for active participants</p>
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
                {['Participant', 'Institution', 'Program', 'Period', 'Hours Progress', 'Days Left', 'Rendered Hours'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No active participants found.</td></tr>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
