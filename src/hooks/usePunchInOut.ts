'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAttendanceRecords } from './useAttendance'
import { attendanceKeys } from './useAttendance'
import { useCurrentEmployee } from './useEmployees'
import { localDateStr } from '@/lib/utils'
import type { AttendanceType } from '@/components/attendance/AttendanceTypeModal'

// ── Session helpers ──────────────────────────────────────────────────────────

export interface PunchSession {
  type: AttendanceType
  timeIn: string   // ISO timestamp
  timeOut: string | null
  note: string
}

export function parseSessions(notes: string | null): PunchSession[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed as PunchSession[]
  } catch {}
  // Legacy plain-text: "work-onsite: some note"
  const parts = notes.split(':')
  const type = parts[0].trim() as AttendanceType
  const note = parts.slice(1).join(':').trim()
  return [{ type, timeIn: '', timeOut: null, note }]
}

export function serializeSessions(sessions: PunchSession[]): string {
  return JSON.stringify(sessions)
}

export function mapAttendanceTypeToStatus(
  type: AttendanceType,
): 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' {
  const mapping: Record<AttendanceType, 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'> = {
    'work-onsite':  'present',
    'work-home':    'present',
    'work-offsite': 'present',
    'work-travel':  'present',
    'vacation':     'on_leave',
    'sick':         'on_leave',
    'days-off':     'on_leave',
    'rest-day':     'on_leave',
  }
  return mapping[type]
}

// ── Display helpers (colour swatch + label) ──────────────────────────────────

export const attendanceTypeColor: Record<AttendanceType, string> = {
  'work-onsite':  'bg-blue-500',
  'work-home':    'bg-green-500',
  'work-offsite': 'bg-purple-500',
  'work-travel':  'bg-indigo-500',
  'vacation':     'bg-amber-500',
  'sick':         'bg-red-500',
  'days-off':     'bg-orange',
  'rest-day':     'bg-gray-500',
}

export const attendanceTypeLabel: Record<AttendanceType, string> = {
  'work-onsite':  'Work on-site',
  'work-home':    'Work from home',
  'work-offsite': 'Work off-site',
  'work-travel':  'Work on Travel',
  'vacation':     'Vacation leave',
  'sick':         'Sick leave',
  'days-off':     'Days Off-set',
  'rest-day':     'Day off / Rest day',
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UsePunchInOutOptions {
  /** Called after a successful punch-in */
  onPunchedIn?: () => void
  /** Called after a successful punch-out */
  onPunchedOut?: () => void
}

export function usePunchInOut({ onPunchedIn, onPunchedOut }: UsePunchInOutOptions = {}) {
  const today = localDateStr()
  const queryClient = useQueryClient()
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee()
  const { data: attendanceRecords, refetch, isLoading: isLoadingRecords } = useAttendanceRecords({
    startDate: today,
    endDate: today,
    employeeId: currentEmployee?.id,
  })

  const [isPunchedIn, setIsPunchedIn]         = useState(false)
  const [punchInTime, setPunchInTime]         = useState<Date | null>(null)
  const [currentType, setCurrentType]         = useState<AttendanceType | null>(null)
  const [saving, setSaving]                   = useState(false)

  // Restore punch-in state from today's DB record
  // Only run once both the employee AND the attendance records have loaded.
  // If we run while records are still undefined (loading), we would incorrectly
  // reset isPunchedIn to false and lose the active session display.
  useEffect(() => {
    if (isLoadingEmployee || isLoadingRecords) return   // still loading — don't touch state
    if (!currentEmployee) return
    const rec = attendanceRecords?.find(
      r => r.date === today && r.employee_id === currentEmployee.id,
    )
    if (rec) {
      const sessions = parseSessions(rec.notes)
      const open = [...sessions].reverse().find(s => !s.timeOut)
      if (open?.timeIn) {
        setIsPunchedIn(true)
        setCurrentType(open.type)
        setPunchInTime(new Date(open.timeIn))
        return
      }
    }
    setIsPunchedIn(false)
    setCurrentType(null)
    setPunchInTime(null)
  }, [attendanceRecords, currentEmployee, today, isLoadingEmployee, isLoadingRecords])

  /** Write a new punch-in session to Supabase */
  const confirmPunchIn = useCallback(
    async (type: AttendanceType, note: string): Promise<boolean> => {
      setSaving(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return false

        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('employee_id')
          .eq('user_id', user.id)
          .single()

        if (roleError || !userRole?.employee_id) {
          alert('Employee record not found. Please contact your administrator.')
          return false
        }

        const now = new Date()
        const existing = attendanceRecords?.find(
          r => r.date === today && r.employee_id === userRole.employee_id,
        )
        const sessions = parseSessions(existing?.notes ?? null)
        sessions.push({ type, timeIn: now.toISOString(), timeOut: null, note })
        const earliestIn = sessions.reduce(
          (min, s) => (s.timeIn && (!min || s.timeIn < min) ? s.timeIn : min),
          '',
        )

        const { error } = await supabase.from('attendance_records').upsert(
          {
            employee_id: userRole.employee_id,
            date: today,
            clock_in: earliestIn || now.toISOString(),
            clock_out: null,
            status: mapAttendanceTypeToStatus(type),
            notes: serializeSessions(sessions),
          },
          { onConflict: 'employee_id,date' },
        )

        if (error) {
          alert(`Error: ${error.message}`)
          return false
        }

        setIsPunchedIn(true)
        setPunchInTime(now)
        setCurrentType(type)
        await queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
        onPunchedIn?.()
        return true
      } finally {
        setSaving(false)
      }
    },
    [attendanceRecords, today, queryClient, onPunchedIn],
  )

  /** Close the current open session and write clock_out to Supabase */
  const punchOut = useCallback(async () => {
    if (!isPunchedIn) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('employee_id')
      .eq('user_id', user.id)
      .single()
    if (roleError || !userRole?.employee_id) return

    const now = new Date()
    const existing = attendanceRecords?.find(
      r => r.date === today && r.employee_id === userRole.employee_id,
    )
    const sessions = parseSessions(existing?.notes ?? null)
    const lastOpenIdx = sessions
      .map((s, i) => (!s.timeOut ? i : -1))
      .filter(i => i >= 0)
      .pop()
    if (lastOpenIdx !== undefined) {
      sessions[lastOpenIdx] = { ...sessions[lastOpenIdx], timeOut: now.toISOString() }
    }
    const latestOut = sessions.reduce(
      (max, s) => (s.timeOut && (!max || s.timeOut > max) ? s.timeOut : max),
      '' as string,
    )

    await supabase
      .from('attendance_records')
      .update({
        clock_out: latestOut || now.toISOString(),
        notes: serializeSessions(sessions),
      })
      .eq('employee_id', userRole.employee_id)
      .eq('date', today)

    setIsPunchedIn(false)
    setPunchInTime(null)
    setCurrentType(null)
    await queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    onPunchedOut?.()
  }, [isPunchedIn, attendanceRecords, today, queryClient, onPunchedOut])

  return {
    isPunchedIn,
    punchInTime,
    currentType,
    saving,
    isLoading: isLoadingEmployee || isLoadingRecords,
    confirmPunchIn,
    punchOut,
    attendanceRecords,
    refetch,
  }
}
