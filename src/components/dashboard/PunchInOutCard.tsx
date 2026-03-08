'use client'

import { useState, useEffect } from 'react'
import { Play, Square } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAttendanceRecords, useCurrentEmployee } from '@/hooks'

type AttendanceType = 'work-onsite' | 'work-home' | 'work-offsite' | 'work-travel' | 'vacation' | 'sick' | 'days-off' | 'rest-day'

interface PunchSession {
  type: AttendanceType
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
  const type = parts[0].trim() as AttendanceType
  const note = parts.slice(1).join(':').trim()
  return [{ type, timeIn: '', timeOut: null, note }]
}

function serializeSessions(sessions: PunchSession[]): string {
  return JSON.stringify(sessions)
}

const mapAttendanceTypeToStatus = (type: AttendanceType): 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' => {
  const mapping: Record<AttendanceType, 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'> = {
    'work-onsite': 'present', 'work-home': 'present',
    'work-offsite': 'present', 'work-travel': 'present',
    'vacation': 'on_leave', 'sick': 'on_leave',
    'days-off': 'on_leave', 'rest-day': 'on_leave',
  }
  return mapping[type]
}

const ATTENDANCE_TYPES: { type: AttendanceType; label: string; color: string; bg: string; text: string }[] = [
  { type: 'work-onsite',  label: 'Work on-site',      color: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700'   },
  { type: 'work-home',    label: 'Work from home',     color: 'bg-green-500',  bg: 'bg-green-50',   text: 'text-green-700'  },
  { type: 'work-offsite', label: 'Work off-site',      color: 'bg-purple-500', bg: 'bg-purple-50',  text: 'text-purple-700' },
  { type: 'work-travel',  label: 'Work on Travel',     color: 'bg-indigo-500', bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  { type: 'days-off',     label: 'Days Off-set',       color: 'bg-orange',     bg: 'bg-orange/10',  text: 'text-orange'     },
  { type: 'rest-day',     label: 'Day off / Rest day', color: 'bg-gray-500',   bg: 'bg-gray-100',   text: 'text-gray-700'   },
]

interface Props {
  /** Called after a successful punch-in so the parent can navigate/switch tabs */
  onPunchedIn?: () => void
}

export function PunchInOutCard({ onPunchedIn }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState<Date | null>(null)
  const [currentAttendanceType, setCurrentAttendanceType] = useState<AttendanceType | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: currentEmployee } = useCurrentEmployee()

  const today = new Date().toISOString().split('T')[0]
  const { data: attendanceRecords, refetch } = useAttendanceRecords({
    startDate: today,
    endDate: today,
    employeeId: currentEmployee?.id,
  })

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Restore punch-in state from today's record
  useEffect(() => {
    if (!attendanceRecords || !currentEmployee) return
    const todayRecord = attendanceRecords.find(r => r.date === today && r.employee_id === currentEmployee.id)
    if (todayRecord) {
      const sessions = parseSessions(todayRecord.notes)
      const openSession = [...sessions].reverse().find(s => !s.timeOut)
      if (openSession?.timeIn) {
        setIsPunchedIn(true)
        setCurrentAttendanceType(openSession.type)
        setPunchInTime(new Date(openSession.timeIn))
        return
      }
    }
    setIsPunchedIn(false)
    setCurrentAttendanceType(null)
    setPunchInTime(null)
  }, [attendanceRecords, currentEmployee, today])

  const getElapsedTime = () => {
    if (!punchInTime) return '00:00:00'
    const diff = currentTime.getTime() - punchInTime.getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const typeInfo = (type: AttendanceType) =>
    ATTENDANCE_TYPES.find(t => t.type === type) ?? ATTENDANCE_TYPES[0]

  const handleConfirmPunchIn = async () => {
    if (!selectedType) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles').select('employee_id').eq('user_id', user.id).single()
      if (roleError || !userRole?.employee_id) {
        alert('Employee record not found.')
        return
      }

      const now = new Date()
      const existing = attendanceRecords?.find(r => r.date === today && r.employee_id === userRole.employee_id)
      const sessions = parseSessions(existing?.notes ?? null)
      sessions.push({ type: selectedType, timeIn: now.toISOString(), timeOut: null, note })
      const earliestIn = sessions.reduce((min, s) => s.timeIn && (!min || s.timeIn < min) ? s.timeIn : min, '')

      const { error } = await supabase.from('attendance_records').upsert({
        employee_id: userRole.employee_id,
        date: today,
        clock_in: earliestIn || now.toISOString(),
        clock_out: null,
        status: mapAttendanceTypeToStatus(selectedType),
        notes: serializeSessions(sessions),
      }, { onConflict: 'employee_id,date' })

      if (error) { alert(`Error: ${error.message}`); return }

      setIsPunchedIn(true)
      setPunchInTime(now)
      setCurrentAttendanceType(selectedType)
      setShowModal(false)
      setSelectedType(null)
      setNote('')
      await refetch()
      onPunchedIn?.()
    } finally {
      setSaving(false)
    }
  }

  const handlePunchOut = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isPunchedIn) return

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles').select('employee_id').eq('user_id', user.id).single()
    if (roleError || !userRole?.employee_id) return

    const now = new Date()
    const existing = attendanceRecords?.find(r => r.date === today && r.employee_id === userRole.employee_id)
    const sessions = parseSessions(existing?.notes ?? null)
    const lastOpenIdx = sessions.map((s, i) => (!s.timeOut ? i : -1)).filter(i => i >= 0).pop()
    if (lastOpenIdx !== undefined) {
      sessions[lastOpenIdx] = { ...sessions[lastOpenIdx], timeOut: now.toISOString() }
    }
    const latestOut = sessions.reduce((max, s) => s.timeOut && (!max || s.timeOut > max) ? s.timeOut : max, '' as string)

    await supabase.from('attendance_records').update({
      clock_out: latestOut || now.toISOString(),
      notes: serializeSessions(sessions),
    }).eq('employee_id', userRole.employee_id).eq('date', today)

    setIsPunchedIn(false)
    setPunchInTime(null)
    setCurrentAttendanceType(null)
    await refetch()
  }

  return (
    <>
      <Card className="p-6 text-center">
        {/* Clock */}
        <div className="mb-5">
          <p className="text-xs text-gray-500">{formatDate(currentTime)}</p>
          <p className="text-4xl font-bold text-gray-900 mt-1 tabular-nums">{formatTime(currentTime)}</p>
        </div>

        {isPunchedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-medium">Currently punched in</p>
              {currentAttendanceType && (
                <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium mt-2 ${typeInfo(currentAttendanceType).color}`}>
                  {typeInfo(currentAttendanceType).label}
                </span>
              )}
              <p className="text-2xl font-bold text-green-700 mt-2 tabular-nums">{getElapsedTime()}</p>
              <p className="text-xs text-green-500 mt-1">
                Since {punchInTime && formatTime(punchInTime)}
              </p>
            </div>
            <Button onClick={handlePunchOut} className="w-full bg-red-500 hover:bg-red-600" size="lg">
              <Square className="w-4 h-4 mr-2" />
              Punch Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">Ready to start your day?</p>
              <p className="text-sm font-medium text-gray-700 mt-1">Tap to punch in</p>
            </div>
            <Button onClick={() => { setSelectedType(null); setNote(''); setShowModal(true) }} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Punch In
            </Button>
          </div>
        )}
      </Card>

      {/* Select Attendance Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Select Attendance Type</h3>
              <p className="text-xs text-gray-500 mt-0.5">Choose how you're working today</p>
            </div>
            <div className="p-5 space-y-2">
              {ATTENDANCE_TYPES.map(({ type, label, bg, text }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedType === type
                      ? `${bg} border-current ${text}`
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    selectedType === type ? `ring-2 ring-offset-1 ring-current` : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm font-medium ${selectedType === type ? text : 'text-gray-700'}`}>
                    {label}
                  </span>
                </button>
              ))}
              <div className="pt-1">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange/40"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedType || saving}
                onClick={handleConfirmPunchIn}
              >
                {saving ? 'Saving…' : 'Punch In'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
