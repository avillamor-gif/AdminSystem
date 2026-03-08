'use client'

import { useState, useMemo } from 'react'
import { BarChart3, Calendar, FileText, Download, Printer } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { attendanceService } from '@/services'
import { useEmployees } from '@/hooks/useEmployees'

// ─── helpers ────────────────────────────────────────────────────────────────

interface PunchSession {
  type: string
  timeIn: string
  timeOut: string | null
  note: string
}

function parseSessions(notes: string | null): PunchSession[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed as PunchSession[]
  } catch {}
  const parts = notes.split(':')
  return [{ type: parts[0].trim(), timeIn: '', timeOut: null, note: parts.slice(1).join(':').trim() }]
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(a: string | null, b: string | null): string {
  if (!a || !b) return '—'
  const diff = new Date(b).getTime() - new Date(a).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function totalSessionHours(sessions: PunchSession[]): number {
  return sessions.reduce((sum, s) => {
    if (s.timeIn && s.timeOut) {
      return sum + (new Date(s.timeOut).getTime() - new Date(s.timeIn).getTime()) / 3600000
    }
    return sum
  }, 0)
}

const TYPE_INFO: Record<string, { label: string; color: string }> = {
  'work-onsite':  { label: 'Work on-site',       color: 'bg-blue-500' },
  'work-home':    { label: 'Work from home',      color: 'bg-green-500' },
  'work-offsite': { label: 'Work off-site',       color: 'bg-purple-500' },
  'work-travel':  { label: 'Work on Travel',      color: 'bg-indigo-500' },
  'vacation':     { label: 'Vacation leave',      color: 'bg-amber-500' },
  'sick':         { label: 'Sick leave',          color: 'bg-red-500' },
  'days-off':     { label: 'Days Off-set',        color: 'bg-orange-500' },
  'rest-day':     { label: 'Day off / Rest day',  color: 'bg-gray-500' },
  'present':      { label: 'Present',             color: 'bg-blue-500' },
  'absent':       { label: 'Absent',              color: 'bg-red-500' },
  'on_leave':     { label: 'On Leave',            color: 'bg-amber-500' },
}
function typeInfo(t: string) { return TYPE_INFO[t] || { label: t, color: 'bg-gray-400' } }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHEET_TYPES = [
  { label: 'Work on-site',      key: 'work-onsite',  bg: '#eff6ff' },
  { label: 'Work from home',    key: 'work-home',    bg: '#f0fdf4' },
  { label: 'Work off-site',     key: 'work-offsite', bg: '#faf5ff' },
  { label: 'Work on Travel',    key: 'work-travel',  bg: '#eef2ff' },
  { label: 'Vacation leave',    key: 'vacation',     bg: '#fffbeb' },
  { label: 'Sick leave',        key: 'sick',         bg: '#fef2f2' },
  { label: 'Days Off-set',      key: 'days-off',     bg: '#fff7ed' },
  { label: 'Public Holidays',   key: 'holiday',      bg: '#fdf2f8' },
  { label: 'Day off / Rest day',key: 'rest-day',     bg: '#f9fafb' },
]

// ─── component ──────────────────────────────────────────────────────────────

type ReportType = 'attendance' | 'timesheet' | 'monthly-sheet' | 'project'

export default function AttendanceReportsPage() {
  const today = new Date()
  const [activeReport, setActiveReport] = useState<ReportType>('attendance')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [sheetMonth, setSheetMonth] = useState(today.getMonth())
  const [sheetYear, setSheetYear] = useState(today.getFullYear())

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees()

  // Fetch records — admin can query all or by specific employee
  const fetchStart = `${sheetYear - 1}-01-01`
  const fetchEnd   = `${sheetYear + 1}-12-31`
  const { data: allRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance', 'admin-reports', selectedEmployeeId, fetchStart, fetchEnd],
    queryFn: () => attendanceService.getRecords({
      employeeId: selectedEmployeeId || undefined,
      startDate: fetchStart,
      endDate: fetchEnd,
    }),
    // Always fetch — admin view has no restriction on filter
    enabled: true,
  })

  // Records filtered by date-range picker (for attendance/timesheet/project)
  const rangeRecords = useMemo(
    () => allRecords.filter(r => r.date >= startDate && r.date <= endDate),
    [allRecords, startDate, endDate]
  )

  // Expand rangeRecords into individual sessions
  const sessionRows = useMemo(() => {
    const rows: { record: typeof allRecords[0]; session: PunchSession }[] = []
    for (const record of rangeRecords) {
      const sessions = parseSessions(record.notes)
      if (sessions.length > 0 && sessions[0].timeIn) {
        sessions.forEach(s => rows.push({ record, session: s }))
      } else {
        rows.push({ record, session: { type: record.status ?? '', timeIn: record.clock_in ?? '', timeOut: record.clock_out, note: '' } })
      }
    }
    return rows
  }, [rangeRecords])

  // Monthly-sheet records
  const sheetRecords = useMemo(
    () => allRecords.filter(r => {
      const d = new Date(r.date)
      return d.getFullYear() === sheetYear && d.getMonth() === sheetMonth
    }),
    [allRecords, sheetMonth, sheetYear]
  )

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId)

  // ── export CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let csv = ''
    if (activeReport === 'attendance' || activeReport === 'project') {
      csv = 'Date,Punch In,Punch Out,Duration,Type\n'
      sessionRows.forEach(({ record, session }) => {
        const dur = session.timeIn && session.timeOut ? formatDuration(session.timeIn, session.timeOut) : '—'
        csv += `${record.date},${fmtTime(session.timeIn)},${fmtTime(session.timeOut)},${dur},${typeInfo(session.type).label}\n`
      })
    } else if (activeReport === 'timesheet') {
      csv = 'Date,Day,Punch In,Punch Out,Hours,Type\n'
      sessionRows.forEach(({ record, session }) => {
        const hrs = session.timeIn && session.timeOut
          ? ((new Date(session.timeOut).getTime() - new Date(session.timeIn).getTime()) / 3600000).toFixed(2)
          : '0.00'
        const day = new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
        csv += `${record.date},${day},${fmtTime(session.timeIn)},${fmtTime(session.timeOut)},${hrs},${typeInfo(session.type).label}\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeReport}-${startDate}-to-${endDate}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── print monthly sheet ─────────────────────────────────────────────────
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=1400,height=900')
    if (!win) return
    const daysInMonth = new Date(sheetYear, sheetMonth + 1, 0).getDate()
    const monthName = new Date(sheetYear, sheetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const empName = selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''
    const dept = (selectedEmployee as any)?.department?.name || ''
    const pos  = (selectedEmployee as any)?.job_title?.title || ''
    const logoUrl = `${window.location.origin}/ibon-logo.png`

    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) =>
      `<th style="border:1px solid #d1d5db;padding:4px 2px;text-align:center;font-size:10px;min-width:22px;">${i + 1}</th>`
    ).join('')

    const tableRows = SHEET_TYPES.map(t => {
      const matched = sheetRecords.filter(r => {
        const sessions = parseSessions(r.notes)
        if (sessions.length > 0 && sessions[0].timeIn) return sessions.some(s => s.type === t.key)
        return r.status === t.key
      })
      const cells = Array.from({ length: daysInMonth }, (_, i) => {
        const ds = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
        const has = matched.some(r => r.date === ds)
        return `<td style="border:1px solid #d1d5db;text-align:center;min-width:22px;height:24px;">${has ? '<span style="color:#2563eb;font-weight:700;">✓</span>' : ''}</td>`
      }).join('')
      return `<tr style="background:${t.bg};"><td style="border:1px solid #d1d5db;padding:4px 8px;white-space:nowrap;font-size:11px;">${t.label}</td><td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:600;font-size:11px;">${matched.length.toFixed(1)}</td>${cells}</tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head><title>Monthly Attendance Sheet</title>
<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
body{font-family:Arial,sans-serif;font-size:11px;padding:12px;}
@page{size:A4 landscape;margin:8mm;}table{border-collapse:collapse;width:100%;}</style></head><body>
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
<img src="${logoUrl}" style="height:60px;"/><div style="flex:1;text-align:right;"><h2 style="font-size:20px;font-weight:700;">ATTENDANCE SHEET</h2></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 32px;margin-bottom:20px;font-size:12px;">
<div><span style="font-weight:600;width:180px;display:inline-block;">NAME OF PERSON :</span>${empName}</div>
<div><span style="font-weight:600;width:180px;display:inline-block;">PERIOD COVERED :</span>${monthName}</div>
<div><span style="font-weight:600;width:180px;display:inline-block;">PROJECT NAME/ UNIT :</span>${dept}</div>
<div><span style="font-weight:600;width:180px;display:inline-block;">POSITION :</span>${pos}</div></div>
<div style="overflow-x:auto;margin-bottom:24px;"><table>
<thead><tr style="background:#f9fafb;">
<th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;font-size:11px;white-space:nowrap;">Description</th>
<th style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;font-size:11px;">Days</th>${dayHeaders}</tr></thead>
<tbody>${tableRows}</tbody></table></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;margin-top:32px;font-size:11px;">
<div><div style="font-weight:600;margin-bottom:4px;">SIGNED:</div><div style="margin-bottom:4px;">PROGRAM HEAD:</div><div>DATE: <input type="text" placeholder="mm/dd/yyyy"/></div></div>
<div><div style="font-weight:600;margin-bottom:4px;">REVIEWED BY:</div><div style="margin-bottom:4px;">NAME: <span style="display:inline-block;width:130px;border-bottom:1px solid #9ca3af;margin-left:8px;"></span></div><div style="margin-bottom:4px;">POSITION: Administrative Manager</div><div>DATE: <input type="text" placeholder="mm/dd/yyyy"/></div></div>
<div><div style="font-weight:600;margin-bottom:4px;">APPROVED:</div><div style="margin-bottom:4px;">NAME: Jennifer Narcisa D. Malonzo</div><div style="margin-bottom:4px;">POSITION: Executive Director</div><div>DATE: <input type="text" placeholder="mm/dd/yyyy"/></div></div>
</div></body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const totalHours = sessionRows.reduce((sum, { session }) => {
    if (session.timeIn && session.timeOut) {
      return sum + (new Date(session.timeOut).getTime() - new Date(session.timeIn).getTime()) / 3600000
    }
    return sum
  }, 0)

  const isLoading = loadingEmployees || loadingRecords

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="text-gray-500 mt-1">View and export attendance data across all employees</p>
      </div>

      {/* Report type tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { key: 'attendance',    label: 'Attendance Summary', icon: Calendar },
            { key: 'timesheet',     label: 'Timesheet',          icon: FileText },
            { key: 'project',       label: 'Project / Hours',    icon: BarChart3 },
            { key: 'monthly-sheet', label: 'Monthly Sheet',      icon: Printer },
          ] as { key: ReportType; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveReport(tab.key)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeReport === tab.key
                  ? 'border-orange text-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Employee picker */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>

          {activeReport !== 'monthly-sheet' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent" />
              </div>
              <Button onClick={handleExportCSV} variant="secondary" className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                <select value={sheetMonth} onChange={e => setSheetMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent">
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <select value={sheetYear} onChange={e => setSheetYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent">
                  {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print Sheet
              </Button>
            </>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Attendance Summary ─────────────────────────────────── */}
          {activeReport === 'attendance' && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-xs text-gray-500 font-medium">Total Sessions</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">{sessionRows.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-gray-500 font-medium">Total Hours</div>
                  <div className="text-3xl font-bold text-orange mt-1">{totalHours.toFixed(1)}h</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-gray-500 font-medium">Avg Hours / Session</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {sessionRows.length ? (totalHours / sessionRows.length).toFixed(1) : '0'}h
                  </div>
                </Card>
              </div>

              <Card className="overflow-hidden p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch In</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch Out</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessionRows.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No records found</td></tr>
                    ) : sessionRows.map(({ record, session }, i) => {
                      const emp = employees.find(e => e.id === record.employee_id)
                      const info = typeInfo(session.type)
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">
                            {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{fmtTime(session.timeIn)}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {session.timeOut ? fmtTime(session.timeOut) : <span className="text-green-600 font-medium">Active</span>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {session.timeIn && session.timeOut ? formatDuration(session.timeIn, session.timeOut) : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                              <span className="text-sm text-gray-700">{info.label}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ── Timesheet ─────────────────────────────────────────── */}
          {activeReport === 'timesheet' && (
            <Card className="overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Day</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch In</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch Out</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hours</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessionRows.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">No records found</td></tr>
                  ) : sessionRows.map(({ record, session }, i) => {
                    const emp = employees.find(e => e.id === record.employee_id)
                    const hrs = session.timeIn && session.timeOut
                      ? ((new Date(session.timeOut).getTime() - new Date(session.timeIn).getTime()) / 3600000).toFixed(2)
                      : '—'
                    const day = new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                    const info = typeInfo(session.type)
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{day}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{fmtTime(session.timeIn)}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {session.timeOut ? fmtTime(session.timeOut) : <span className="text-green-600 font-medium">Active</span>}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{hrs}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                            <span className="text-sm text-gray-700">{info.label}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {sessionRows.length > 0 && (
                    <tr className="bg-orange/5 font-semibold">
                      <td colSpan={5} className="px-5 py-3 text-sm">Total</td>
                      <td className="px-5 py-3 text-sm text-right">{totalHours.toFixed(2)}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {/* ── Project / Hours ───────────────────────────────────── */}
          {activeReport === 'project' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-xs text-gray-500 font-medium">Total Hours</div>
                  <div className="text-3xl font-bold text-orange mt-1">{totalHours.toFixed(1)}h</div>
                  <div className="text-xs text-gray-400 mt-1">{sessionRows.length} sessions across {rangeRecords.length} days</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-gray-500 font-medium mb-2">By Type</div>
                  <div className="space-y-1">
                    {Object.entries(
                      sessionRows.reduce((acc, { session }) => {
                        const key = typeInfo(session.type).label
                        const hrs = session.timeIn && session.timeOut
                          ? (new Date(session.timeOut).getTime() - new Date(session.timeIn).getTime()) / 3600000 : 0
                        acc[key] = (acc[key] || 0) + hrs
                        return acc
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1]).map(([label, hrs]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-semibold">{hrs.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="overflow-hidden p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch In</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch Out</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hours</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessionRows.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No records found</td></tr>
                    ) : sessionRows.map(({ record, session }, i) => {
                      const emp = employees.find(e => e.id === record.employee_id)
                      const hrs = session.timeIn && session.timeOut
                        ? ((new Date(session.timeOut).getTime() - new Date(session.timeIn).getTime()) / 3600000).toFixed(2)
                        : '—'
                      const info = typeInfo(session.type)
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">
                            {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{fmtTime(session.timeIn)}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {session.timeOut ? fmtTime(session.timeOut) : <span className="text-green-600 font-medium">Active</span>}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{hrs}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                              <span className="text-sm text-gray-700">{info.label}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ── Monthly Sheet ─────────────────────────────────────── */}
          {activeReport === 'monthly-sheet' && (
            <Card className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <img src="/ibon-logo.png" alt="IBON International" className="h-16 w-auto" />
                <h2 className="text-xl font-bold text-gray-900">ATTENDANCE SHEET</h2>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
                <div className="flex"><span className="font-semibold w-48">NAME OF PERSON :</span>
                  <span className="text-gray-700">{selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'All Employees'}</span></div>
                <div className="flex"><span className="font-semibold w-48">PERIOD COVERED :</span>
                  <span className="text-gray-700">{new Date(sheetYear, sheetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></div>
                <div className="flex"><span className="font-semibold w-48">PROJECT NAME/ UNIT :</span>
                  <span className="text-gray-700">{(selectedEmployee as any)?.department?.name || '—'}</span></div>
                <div className="flex"><span className="font-semibold w-48">POSITION :</span>
                  <span className="text-gray-700">{(selectedEmployee as any)?.job_title?.title || '—'}</span></div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Description</th>
                      <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Days</th>
                      {Array.from({ length: new Date(sheetYear, sheetMonth + 1, 0).getDate() }, (_, i) => (
                        <th key={i} className="border border-gray-300 px-1 py-2 text-center font-semibold">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SHEET_TYPES.map(t => {
                      const daysInMonth = new Date(sheetYear, sheetMonth + 1, 0).getDate()
                      const matched = sheetRecords.filter(r => {
                        const sessions = parseSessions(r.notes)
                        if (sessions.length > 0 && sessions[0].timeIn) return sessions.some(s => s.type === t.key)
                        return r.status === t.key
                      })
                      return (
                        <tr key={t.key} style={{ background: t.bg }}>
                          <td className="border border-gray-300 px-2 py-2">{t.label}</td>
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{matched.length.toFixed(1)}</td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const ds = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                            return (
                              <td key={i} className="border border-gray-300 text-center w-8 h-8">
                                {matched.some(r => r.date === ds) && <span className="text-blue-600 font-bold">✓</span>}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-3 gap-8 mt-8">
                {[
                  { title: 'SIGNED:', sub: 'PROGRAM HEAD:' },
                  { title: 'REVIEWED BY:', sub: 'POSITION: Administrative Manager' },
                  { title: 'APPROVED:', sub: 'NAME: Jennifer Narcisa D. Malonzo' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-xs font-semibold mb-1">{s.title}</div>
                    <div className="text-xs mb-1">{s.sub}</div>
                    <div className="text-xs">DATE: <input type="text" placeholder="mm/dd/yyyy"
                      className="ml-2 border-b border-gray-400 focus:border-orange focus:outline-none text-xs w-24 bg-transparent" /></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
