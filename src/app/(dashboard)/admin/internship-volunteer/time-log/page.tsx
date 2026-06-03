'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Calendar, TrendingUp, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useClockIn, useAttendanceRecords } from '@/hooks/useAttendance'
import { useProgramEnrollments } from '@/hooks/useInternship'
import { localDateStr, formatDate } from '@/lib/utils'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'
import type { AttendanceRecord } from '@/services/attendance.service'

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatHours(h: number) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function sessionHours(record: AttendanceRecord): number {
  if (!record.clock_in) return 0
  const out = record.clock_out ? new Date(record.clock_out) : new Date()
  return Math.max(0, (out.getTime() - new Date(record.clock_in).getTime()) / (1000 * 60 * 60))
}

// ─── Live clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-center">
      <div className="text-5xl font-mono font-bold text-gray-900 tabular-nums">
        {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {time.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}

// ─── Session timer ────────────────────────────────────────────────────────────
function SessionTimer({ clockIn }: { clockIn: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const tick = () => setElapsed((Date.now() - new Date(clockIn).getTime()) / (1000 * 60 * 60))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [clockIn])
  return <span className="font-mono">{formatHours(elapsed)}</span>
}

export default function InternTimeLogPage() {
  const { data: currentEmployee } = useCurrentEmployee()
  const today = localDateStr()

  // Get the intern's active enrollment
  const { data: allEnrollments = [] } = useProgramEnrollments()
  const enrollment: ProgramEnrollmentWithRelations | undefined = allEnrollments.find(
    (e) =>
      e.employee_id === currentEmployee?.id &&
      e.status === 'active'
  )

  // Today's attendance record for this employee
  const { data: records = [], refetch } = useAttendanceRecords(
    currentEmployee?.id
      ? { employeeId: currentEmployee.id, date: today }
      : {}
  )
  const todayRecord = records.find((r) => r.date === today) as AttendanceRecord | undefined

  // Past records for the log (last 30 days)
  const { data: historyRecords = [] } = useAttendanceRecords(
    currentEmployee?.id
      ? {
          employeeId: currentEmployee.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today,
        }
      : {}
  )

  const clockInMutation = useClockIn()
  const [punchingOut, setPunchingOut] = useState(false)
  const [punchOutError, setPunchOutError] = useState<string | null>(null)

  const isClockedIn = !!todayRecord?.clock_in && !todayRecord?.clock_out

  async function handleClockIn() {
    if (!currentEmployee?.id) return
    await clockInMutation.mutateAsync(currentEmployee.id)
    refetch()
  }

  const handleClockOut = useCallback(async () => {
    if (!todayRecord || !enrollment) return
    setPunchingOut(true)
    setPunchOutError(null)
    try {
      const res = await fetch('/api/internship/punch-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceRecordId: todayRecord.id,
          enrollmentId: enrollment.id,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Punch out failed')
      }
      refetch()
    } catch (e) {
      setPunchOutError((e as Error).message)
    } finally {
      setPunchingOut(false)
    }
  }, [todayRecord, enrollment, refetch])

  // Progress
  const renderedHours = Number(enrollment?.rendered_hours ?? 0)
  const requiredHours = Number(enrollment?.required_hours ?? 0)
  const progressPct = requiredHours > 0 ? Math.min(100, (renderedHours / requiredHours) * 100) : 0
  const remaining = Math.max(0, requiredHours - renderedHours)

  // No active enrollment
  if (!enrollment && currentEmployee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">No Active Enrollment Found</h2>
        <p className="text-gray-500 mt-1 max-w-sm">
          You don't have an active internship or OJT enrollment. Please contact HR if this is a mistake.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Time Log</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {enrollment
            ? `${enrollment.program_type?.toUpperCase()} · ${enrollment.partner_institution?.name ?? 'Independent'}`
            : 'Loading enrollment…'}
        </p>
      </div>

      {/* Live clock + punch button */}
      <Card className="p-8">
        <LiveClock />

        <div className="mt-8 flex flex-col items-center gap-4">
          {!todayRecord ? (
            // Not yet clocked in today
            <Button
              variant="primary"
              className="h-16 w-48 text-lg rounded-2xl shadow-md"
              onClick={handleClockIn}
              disabled={clockInMutation.isPending}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {clockInMutation.isPending ? 'Punching In…' : 'Punch In'}
            </Button>
          ) : isClockedIn ? (
            // Currently clocked in
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Clocked in at {formatTime(todayRecord.clock_in)} · Session: <SessionTimer clockIn={todayRecord.clock_in!} />
              </div>
              <Button
                variant="danger"
                className="h-16 w-48 text-lg rounded-2xl shadow-md"
                onClick={handleClockOut}
                disabled={punchingOut}
              >
                <LogOut className="w-5 h-5 mr-2" />
                {punchingOut ? 'Punching Out…' : 'Punch Out'}
              </Button>
              {punchOutError && (
                <p className="text-sm text-red-600">{punchOutError}</p>
              )}
            </div>
          ) : (
            // Already done for today
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Done for today · {formatTime(todayRecord.clock_in)} – {formatTime(todayRecord.clock_out)}
                &nbsp;·&nbsp;
                <span className="font-bold">{formatHours(sessionHours(todayRecord))}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Progress */}
      {enrollment && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Hours Progress
            </div>
            <span className="text-sm font-bold text-gray-900">
              {renderedHours.toFixed(1)} / {requiredHours}h
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                progressPct >= 100 ? 'bg-green-500' :
                progressPct >= 75  ? 'bg-blue-500' :
                progressPct >= 40  ? 'bg-orange-400' : 'bg-red-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{progressPct.toFixed(0)}% complete</span>
            <span className="text-orange-600 font-medium">{formatHours(remaining)} remaining</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <StatPill label="Program" value={enrollment.program_type?.toUpperCase() ?? '—'} />
            <StatPill label="End Date" value={enrollment.end_date ? formatDate(enrollment.end_date) : 'Open'} />
            <StatPill label="Supervisor" value={enrollment.supervisor ? `${enrollment.supervisor.first_name} ${enrollment.supervisor.last_name}` : '—'} />
          </div>
        </Card>
      )}

      {/* Recent log */}
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          Recent Attendance (last 30 days)
        </div>
        {historyRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No attendance records yet.</p>
        ) : (
          <div className="space-y-2">
            {historyRecords.slice(0, 20).map((r) => {
              const hrs = sessionHours(r as AttendanceRecord)
              const done = !!(r as AttendanceRecord).clock_out
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(r.date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime((r as AttendanceRecord).clock_in)} → {done ? formatTime((r as AttendanceRecord).clock_out) : 'in progress'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <Timer className="w-3.5 h-3.5 text-gray-400" />
                    {done ? formatHours(hrs) : <span className="text-orange-500 text-xs">Active</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
    </div>
  )
}
