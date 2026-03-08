'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, Play, Square, Calendar, FileText, Timer, CheckCircle, X, ChevronRight } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '../../../lib/supabase/client'
import { useAttendanceRecords, useClockIn, useClockOut, useCurrentEmployee, useLeaveRequests } from '@/hooks'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { useHolidays } from '@/hooks/useLeaveAbsence'

type AttendanceType = 'work-onsite' | 'work-home' | 'work-offsite' | 'work-travel' | 'vacation' | 'sick' | 'days-off' | 'rest-day'

// Session entry stored inside the notes JSON array
interface PunchSession {
  type: AttendanceType
  timeIn: string  // ISO timestamp
  timeOut: string | null
  note: string
}

// Parse notes field → array of PunchSession (handles legacy plain-text notes too)
function parseSessions(notes: string | null): PunchSession[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed as PunchSession[]
  } catch {}
  // Legacy: "work-onsite: some note" or just "work-onsite"
  const parts = notes.split(':')
  const type = parts[0].trim() as AttendanceType
  const note = parts.slice(1).join(':').trim()
  return [{ type, timeIn: '', timeOut: null, note }]
}

function serializeSessions(sessions: PunchSession[]): string {
  return JSON.stringify(sessions)
}

// Format a timestamp to "09:34 AM"
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// Map UI attendance types to database status values
const mapAttendanceTypeToStatus = (type: AttendanceType): 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' => {
  const mapping: Record<AttendanceType, 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'> = {
    'work-onsite': 'present',
    'work-home': 'present',
    'work-offsite': 'present',
    'work-travel': 'present',
    'vacation': 'on_leave',
    'sick': 'on_leave',
    'days-off': 'on_leave',
    'rest-day': 'on_leave',
  }
  return mapping[type]
}

export default function TimePage() {
  const [activeTab, setActiveTab] = useState<'punch' | 'timesheets' | 'attendance'>('punch')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState<Date | null>(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<AttendanceType | null>(null)
  const [attendanceNote, setAttendanceNote] = useState('')
  const [currentAttendanceType, setCurrentAttendanceType] = useState<AttendanceType | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth()))

  // Fetch current employee data
  const { data: currentEmployee, isLoading: isLoadingEmployee, error: employeeError } = useCurrentEmployee()
  const { data: roleInfo } = useCurrentUserPermissions()
  const isAdmin = ['Admin', 'HR Manager', 'Super Admin', 'Executive Director'].includes(roleInfo?.role_name ?? '')

  // Debug logging
  useEffect(() => {
    console.log('Current Employee Data:', currentEmployee)
    console.log('Loading Employee:', isLoadingEmployee)
    console.log('Employee Error:', employeeError)
  }, [currentEmployee, isLoadingEmployee, employeeError])

  // Fetch attendance records for current month
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0]
  
  // Filter by current employee's ID
  const { data: attendanceRecords, isLoading, refetch } = useAttendanceRecords({
    startDate: monthStart,
    endDate: monthEnd,
    employeeId: currentEmployee?.id, // Only show current employee's records
  })

  // Compute current week's Mon–Sun date range (stable, only recomputes daily via currentTime day change)
  const weekRange = useMemo(() => {
    const today = new Date()
    // Monday = 0 offset; Sunday = 6 offset (ISO week: Mon first)
    const dayOfWeek = today.getDay() // 0=Sun,1=Mon,...,6=Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(today.getDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const toStr = (d: Date) => d.toISOString().split('T')[0]
    // Build Mon→Sun date strings
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return toStr(d)
    })
    return { weekStart: toStr(monday), weekEnd: toStr(sunday), dates }
  }, [currentTime.toDateString()]) // recompute when calendar day changes

  // Fetch attendance records for the current week (may straddle two months)
  const { data: weekRecords } = useAttendanceRecords({
    startDate: weekRange.weekStart,
    endDate: weekRange.weekEnd,
    employeeId: currentEmployee?.id,
  })

  // Compute hours per day for the current week from real punch sessions
  const weeklyData = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return weekRange.dates.map((dateStr, i) => {
      const record = (weekRecords ?? []).find(r => r.date === dateStr)
      if (!record) return { label: dayLabels[i], hours: 0, date: dateStr }
      const sessions = parseSessions(record.notes)
      const totalHours = sessions.reduce((sum, s) => {
        if (s.timeIn && s.timeOut) {
          return sum + (new Date(s.timeOut).getTime() - new Date(s.timeIn).getTime()) / 3_600_000
        }
        // If still active (no timeOut) count elapsed time up to now
        if (s.timeIn && !s.timeOut) {
          return sum + (Date.now() - new Date(s.timeIn).getTime()) / 3_600_000
        }
        return sum
      }, 0)
      // Round to 2 decimal places
      return { label: dayLabels[i], hours: Math.round(totalHours * 100) / 100, date: dateStr }
    })
  }, [weekRecords, weekRange.dates, currentTime])

  // Fetch leave requests for current employee
  const { data: leaveRequests } = useLeaveRequests(currentEmployee?.id)

  // Fetch holidays for current year
  const currentYear = currentMonth.getFullYear()
  const { data: holidays = [] } = useHolidays({ 
    year: currentYear, 
    is_active: true 
  })

  const clockIn = useClockIn()
  const clockOut = useClockOut()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Check if user is already punched in today
  useEffect(() => {
    if (attendanceRecords && currentEmployee) {
      const today = new Date().toISOString().split('T')[0]
      const todayRecord = attendanceRecords.find(r => r.date === today && r.employee_id === currentEmployee.id)
      
      if (todayRecord) {
        // Restore punch-in state from open session in the JSON sessions array
        const sessions = parseSessions(todayRecord.notes)
        const openSession = [...sessions].reverse().find(s => !s.timeOut)
        if (openSession && openSession.timeIn) {
          setIsPunchedIn(true)
          setCurrentAttendanceType(openSession.type)
          setPunchInTime(new Date(openSession.timeIn))
        } else {
          setIsPunchedIn(false)
          setCurrentAttendanceType(null)
          setPunchInTime(null)
        }
      } else {
        // No record at all today
        setIsPunchedIn(false)
        setCurrentAttendanceType(null)
        setPunchInTime(null)
      }
    }
  }, [attendanceRecords, currentEmployee])

  const handlePunchIn = async () => {
    setIsEditMode(false)
    setSelectedDate(null)
    setSelectedAttendanceType(null)
    setAttendanceNote('')
    setShowAttendanceModal(true)
  }

  const handleDateClick = (date: string, existingType?: AttendanceType, existingNote?: string) => {
    setIsEditMode(!!existingType) // only true if there's already an entry
    setSelectedDate(date)
    setSelectedAttendanceType(existingType || null)
    setAttendanceNote(existingNote || '')
    setShowAttendanceModal(true)
  }

  const handleConfirmPunchIn = async () => {
    if (!selectedAttendanceType) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Get employee_id from user_roles table
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('employee_id')
        .eq('user_id', user.id)
        .single()
      
      if (roleError || !userRole?.employee_id) {
        console.error('Error getting employee:', roleError)
        alert('Employee record not found. Please contact your administrator.')
        return
      }
      
      const now = new Date()
      const today = new Date().toISOString().split('T')[0]

      // Load existing sessions for today (if any) and append new open session
      const existing = attendanceRecords?.find(r => r.date === today && r.employee_id === userRole.employee_id)
      const sessions = parseSessions(existing?.notes ?? null)
      const newSession: PunchSession = {
        type: selectedAttendanceType,
        timeIn: now.toISOString(),
        timeOut: null,
        note: attendanceNote,
      }
      sessions.push(newSession)

      // first clock_in = earliest timeIn across sessions
      const earliestIn = sessions.reduce((min, s) => s.timeIn && (!min || s.timeIn < min) ? s.timeIn : min, '')

      const { error } = await supabase.from('attendance_records').upsert({
        employee_id: userRole.employee_id,
        date: today,
        clock_in: earliestIn || now.toISOString(),
        clock_out: null,
        status: mapAttendanceTypeToStatus(selectedAttendanceType),
        notes: serializeSessions(sessions),
      }, {
        onConflict: 'employee_id,date'
      })
      
      if (error) {
        console.error('Error saving attendance:', error)
        alert(`Error: ${error.message}`)
        return
      }
      
      // Update UI state
      setIsPunchedIn(true)
      setPunchInTime(now)
      setCurrentAttendanceType(selectedAttendanceType)
      setShowAttendanceModal(false)
      setSelectedAttendanceType(null)
      setAttendanceNote('')
      
      // Refresh calendar data
      await refetch()
    }
  }

  const handleSaveAttendance = async () => {
    if (!selectedAttendanceType || !selectedDate) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Get employee_id from user_roles table
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('employee_id')
        .eq('user_id', user.id)
        .single()
      
      if (roleError || !userRole?.employee_id) {
        console.error('Error getting employee:', roleError)
        alert('Employee record not found. Please contact your administrator.')
        return
      }
      
      const { data, error } = await supabase.from('attendance_records').upsert({
        employee_id: userRole.employee_id,
        date: selectedDate,
        status: mapAttendanceTypeToStatus(selectedAttendanceType),
        notes: `${selectedAttendanceType}${attendanceNote ? ': ' + attendanceNote : ''}`
      }, {
        onConflict: 'employee_id,date'
      })
      
      if (error) {
        console.error('Error saving attendance:', error)
        alert(`Error: ${error.message}`)
        return
      }
      
      setShowAttendanceModal(false)
      setSelectedAttendanceType(null)
      setAttendanceNote('')
      setSelectedDate(null)
      setIsEditMode(false)
      
      // Refresh calendar data
      await refetch()
    }
  }

  const handleCancelEdit = () => {
    setShowAttendanceModal(false)
    setSelectedAttendanceType(null)
    setAttendanceNote('')
    setSelectedDate(null)
    setIsEditMode(false)
  }

  const handlePunchOut = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && isPunchedIn) {
      // Get employee_id from user_roles table
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('employee_id')
        .eq('user_id', user.id)
        .single()
      
      if (!roleError && userRole?.employee_id) {
        const now = new Date()
        const today = new Date().toISOString().split('T')[0]

        // Close the last open session
        const existing = attendanceRecords?.find(r => r.date === today && r.employee_id === userRole.employee_id)
        const sessions = parseSessions(existing?.notes ?? null)
        // Find the last session without a timeOut and close it
        const lastOpenIdx = sessions.map((s, i) => (!s.timeOut ? i : -1)).filter(i => i >= 0).pop()
        if (lastOpenIdx !== undefined) {
          sessions[lastOpenIdx] = { ...sessions[lastOpenIdx], timeOut: now.toISOString() }
        }

        // latest clock_out = latest timeOut across sessions
        const latestOut = sessions.reduce((max, s) => s.timeOut && (!max || s.timeOut > max) ? s.timeOut : max, '' as string)

        await supabase
          .from('attendance_records')
          .update({
            clock_out: latestOut || now.toISOString(),
            notes: serializeSessions(sessions),
          })
          .eq('employee_id', userRole.employee_id)
          .eq('date', today)
        
        // Refresh attendance data
        await refetch()
      }
    }
    
    setIsPunchedIn(false)
    setPunchInTime(null)
    setCurrentAttendanceType(null)
  }

  const getAttendanceTypeInfo = (type: AttendanceType | string) => {
    const typeMap: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
      'work-onsite': { label: 'Work on-site', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      'work-home': { label: 'Work from home', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      'work-offsite': { label: 'Work off-site', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
      'work-travel': { label: 'Work on Travel', color: 'bg-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
      'vacation': { label: 'Vacation leave', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
      'sick': { label: 'Sick leave', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
      'days-off': { label: 'Days Off-set', color: 'bg-orange', bgColor: 'bg-orange/10', textColor: 'text-orange' },
      'rest-day': { label: 'Day off / Rest day', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
      'present': { label: 'Work on-site', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      'absent': { label: 'Absent', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
      'holiday': { label: 'Holiday', color: 'bg-pink-500', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    }
    return typeMap[type] || typeMap['work-onsite']
  }

  const getAttendanceForDate = (dateStr: string) => {
    return attendanceRecords?.find(record => record.date === dateStr)
  }

  const getLeaveForDate = (dateStr: string) => {
    if (!leaveRequests) return null
    
    // Check if there's an approved or pending leave request for this date
    return leaveRequests.find(leave => {
      const startDate = new Date(leave.start_date)
      const endDate = new Date(leave.end_date)
      const checkDate = new Date(dateStr)
      
      // Check if the date falls within the leave range
      return checkDate >= startDate && checkDate <= endDate && 
             (leave.status === 'approved' || leave.status === 'pending')
    })
  }

  const getHolidayForDate = (dateStr: string) => {
    if (!holidays) return null
    
    // Check if there's a holiday for this date
    return holidays.find(holiday => holiday.holiday_date === dateStr && holiday.is_active)
  }

  const getHolidayTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      regular: 'Regular Holidays',
      special_non_working: 'Special (Non-Working) Holidays',
      special_working: 'Special (Working) Holidays',
    }
    return labels[type] || type
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }



  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getElapsedTime = () => {
    if (!punchInTime) return '00:00:00'
    const diff = currentTime.getTime() - punchInTime.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return '-'
    
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    const diff = end.getTime() - start.getTime()
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  const formatTimeOnly = (timestamp: string | null) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'work-onsite':
      case 'work-home':
      case 'work-offsite':
      case 'work-travel':
      case 'present':
        return 'success'
      case 'vacation':
      case 'sick':
      case 'days-off':
      case 'rest-day':
        return 'warning'
      case 'absent':
        return 'error'
      case 'holiday':
        return 'info'
      default:
        return 'default'
    }
  }

  const totalWeekHours = weeklyData.reduce((sum, d) => sum + d.hours, 0)
  const maxDayHours = Math.max(...weeklyData.map(d => d.hours), 8) // at least 8 for bar scale

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          body > div:not(#monthly-sheet-print),
          header,
          nav:not(#monthly-sheet-print nav),
          .sidebar,
          aside,
          footer {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #monthly-sheet-print {
            display: block !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          table {
            border-collapse: collapse !important;
          }
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-500 mt-1">Track your time and attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('punch')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'punch'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Punch In/Out
          </button>
          <button
            onClick={() => setActiveTab('timesheets')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timesheets'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            My Calendar
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Timesheet
          </button>
        </nav>
      </div>

      {/* Punch In/Out Tab */}
      {activeTab === 'punch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <p className="text-gray-500">{formatDate(currentTime)}</p>
              <p className="text-5xl font-bold text-gray-900 mt-2">{formatTime(currentTime)}</p>
            </div>
            
            {isPunchedIn ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">You are currently punched in</p>
                  {currentAttendanceType && (
                    <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium mt-2 ${getAttendanceTypeInfo(currentAttendanceType).color}`}>
                      {getAttendanceTypeInfo(currentAttendanceType).label}
                    </div>
                  )}
                  <p className="text-2xl font-bold text-green-700 mt-2">{getElapsedTime()}</p>
                  <p className="text-xs text-green-500 mt-1">
                    Since {punchInTime && formatTime(punchInTime)}
                  </p>
                </div>
                <Button 
                  onClick={handlePunchOut}
                  className="w-full bg-red-500 hover:bg-red-600"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Punch Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Ready to start your day?</p>
                  <p className="text-lg font-medium text-gray-700 mt-1">Tap to punch in</p>
                </div>
                <Button 
                  onClick={handlePunchIn}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Punch In
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">This Week's Hours</h3>
            <div className="space-y-3">
              {weeklyData.map((day) => {
                const today = new Date().toISOString().split('T')[0]
                const isToday = day.date === today
                const barPct = Math.min((day.hours / maxDayHours) * 100, 100)
                return (
                  <div key={day.label} className="flex items-center justify-between">
                    <span className={`text-sm w-12 ${isToday ? 'font-semibold text-orange' : 'text-gray-600'}`}>
                      {day.label}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${day.hours > 0 ? 'bg-orange' : 'bg-gray-200'}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm w-14 text-right ${
                      isToday ? 'font-bold text-orange' : day.hours > 0 ? 'font-medium text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">Total This Week</span>
              <span className="font-bold text-orange">
                {totalWeekHours > 0 ? `${totalWeekHours.toFixed(1)}h` : '0h'}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* My Calendar Tab */}
      {activeTab === 'timesheets' && (
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{formatMonthYear(currentMonth)}</h2>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7">
              {(() => {
                const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth)
                const days = []
                
                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(
                    <div key={`empty-${i}`} className="min-h-[100px] p-2 border-r border-b border-gray-200 bg-gray-50"></div>
                  )
                }
                
                // Actual days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const attendance = getAttendanceForDate(dateStr)
                  const leaveRequest = getLeaveForDate(dateStr)
                  const holiday = getHolidayForDate(dateStr)
                  // Parse the UI attendance type from notes (stored as "work-onsite: note" or "work-home")
                  const attendanceUiType = attendance?.notes
                    ? (attendance.notes.split(':')[0].trim() as AttendanceType)
                    : (attendance?.status as AttendanceType | undefined)
                  const attendanceInfo = attendanceUiType ? getAttendanceTypeInfo(attendanceUiType) : null
                  const isLastCol = (firstDay + day - 1) % 7 === 6
                  
                  // Determine background color: holiday > leave > attendance
                  let bgColor = ''
                  let displayInfo = null
                  
                  if (holiday) {
                    // Show holiday (highest priority)
                    bgColor = 'bg-pink-50'
                    displayInfo = {
                      label: holiday.holiday_name,
                      textColor: 'text-pink-600',
                      badge: getHolidayTypeLabel(holiday.holiday_type),
                      badgeVariant: 'default' as const
                    }
                  } else if (leaveRequest) {
                    // Show leave request
                    bgColor = leaveRequest.status === 'approved' ? 'bg-blue-50' : 'bg-yellow-50'
                    displayInfo = {
                      label: leaveRequest.leave_type?.name || 'Leave',
                      textColor: leaveRequest.status === 'approved' ? 'text-blue-600' : 'text-yellow-600',
                      badge: (leaveRequest.status ?? '').charAt(0).toUpperCase() + (leaveRequest.status ?? '').slice(1),
                      badgeVariant: (leaveRequest.status === 'approved' ? 'success' : 'warning') as 'success' | 'warning'
                    }
                  } else if (attendanceInfo) {
                    // Show attendance
                    bgColor = attendanceInfo.bgColor
                    displayInfo = {
                      label: attendanceInfo.label,
                      textColor: attendanceInfo.textColor,
                      badge: null,
                      badgeVariant: null
                    }
                  }
                  
                  // Parse sessions for this day (for punch-based days)
                  const daySessions = !leaveRequest && !holiday && attendance ? parseSessions(attendance.notes) : []
                  const hasSessions = daySessions.length > 0 && daySessions[0].timeIn !== ''

                  days.push(
                    <div
                      key={day}
                      onClick={() => isAdmin && !holiday && handleDateClick(dateStr, attendanceUiType, attendance?.notes ? (attendance.notes.includes(':') ? attendance.notes.split(':').slice(1).join(':').trim() : '') : '')}
                      className={`min-h-[100px] p-2 border-b border-gray-200 ${holiday || !isAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'} transition-colors ${
                        !isLastCol ? 'border-r' : ''
                      } ${bgColor}`}
                    >
                      <div className={`text-sm ${attendance || leaveRequest || holiday ? 'font-medium' : 'text-gray-500'}`}>{day}</div>

                      {/* Holiday or Leave: show label + badge as before */}
                      {(holiday || leaveRequest) && displayInfo && (
                        <>
                          <div className={`mt-1 text-xs font-medium ${displayInfo.textColor}`}>
                            {displayInfo.label}
                          </div>
                          {displayInfo.badge && (
                            <Badge variant={displayInfo.badgeVariant} className="mt-1 text-xs">
                              {displayInfo.badge}
                            </Badge>
                          )}
                        </>
                      )}

                      {/* Attendance with sessions: show each session block */}
                      {!holiday && !leaveRequest && hasSessions && (
                        <div className="mt-1 space-y-1">
                          {daySessions.map((session, idx) => {
                            const sInfo = getAttendanceTypeInfo(session.type)
                            return (
                              <div key={idx} className={`rounded px-1.5 py-1 ${sInfo.bgColor}`}>
                                <div className={`text-xs font-semibold ${sInfo.textColor} truncate`}>
                                  {sInfo.label}
                                </div>
                                <div className="text-[10px] text-gray-500 leading-tight">
                                  <span className="font-medium">In:</span> {fmtTime(session.timeIn)}
                                </div>
                                <div className="text-[10px] text-gray-500 leading-tight">
                                  <span className="font-medium">Out:</span> {session.timeOut ? fmtTime(session.timeOut) : <span className="text-green-500">Active</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Attendance without sessions (legacy plain-text notes or manual calendar entry) */}
                      {!holiday && !leaveRequest && !hasSessions && displayInfo && (
                        <div className={`mt-1 text-xs font-medium ${displayInfo.textColor}`}>
                          {displayInfo.label}
                        </div>
                      )}
                    </div>
                  )
                }
                
                return days
              })()}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Work on-site</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Work from home</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-xs text-gray-600">Work off-site</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                <span className="text-xs text-gray-600">Work on Travel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-xs text-gray-600">Vacation leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Sick leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange rounded"></div>
                <span className="text-xs text-gray-600">Days Off-set</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-xs text-gray-600">Day off / Rest day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <span className="text-xs text-gray-600">Public Holidays</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                <span className="text-xs text-gray-600">Leave Request (Approved)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
                <span className="text-xs text-gray-600">Leave Request (Pending)</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Timesheet Tab */}
      {activeTab === 'attendance' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Punch Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : attendanceRecords && attendanceRecords.length > 0 ? (
                  // Expand each record into one row per punch session
                  attendanceRecords.flatMap((record) => {
                    const sessions = parseSessions(record.notes)
                    const hasSessions = sessions.length > 0 && sessions[0].timeIn !== ''

                    if (hasSessions) {
                      return sessions.map((session, idx) => {
                        const info = getAttendanceTypeInfo(session.type)
                        const duration = session.timeIn && session.timeOut
                          ? formatDuration(session.timeIn, session.timeOut)
                          : session.timeIn && !session.timeOut ? 'Active' : '—'
                        return (
                          <tr key={`${record.id}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {fmtTime(session.timeIn)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {session.timeOut ? fmtTime(session.timeOut) : <span className="text-green-600 font-medium">Active</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {duration}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${info.color}`}></div>
                                <span className="text-sm font-medium text-gray-700">{info.label}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    }

                    // Legacy plain-text record — show as single row
                    const uiType = record.status ?? ''
                    const attendanceInfo = getAttendanceTypeInfo(uiType)
                    return [(
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatTimeOnly(record.clock_in)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatTimeOnly(record.clock_out)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDuration(record.clock_in, record.clock_out)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${attendanceInfo.color}`}></div>
                            <span className="text-sm font-medium text-gray-700">{attendanceInfo.label}</span>
                          </div>
                        </td>
                      </tr>
                    )]
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Attendance Type Selection Modal */}
      <Modal open={showAttendanceModal} onClose={handleCancelEdit} className="max-w-lg">
        <ModalHeader onClose={handleCancelEdit}>
          {isEditMode
            ? 'Edit Attendance Entry'
            : selectedDate
              ? 'Add Attendance Entry'
              : 'Select Attendance Type'}
        </ModalHeader>
        
        <ModalBody>
          {selectedDate && (
            <div className={`mb-4 p-3 rounded-lg ${isEditMode ? 'bg-blue-50' : 'bg-green-50'}`}>
              <p className={`text-sm font-medium ${isEditMode ? 'text-blue-700' : 'text-green-700'}`}>
                {isEditMode ? 'Editing' : 'Adding entry for'}:{' '}
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {!isEditMode && !selectedDate && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Date: {formatDate(currentTime)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedAttendanceType('work-onsite')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'work-onsite'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Work on-site</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('work-home')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'work-home'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Work from home</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('work-offsite')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'work-offsite'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Work off-site</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('work-travel')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'work-travel'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-indigo-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Work on Travel</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('days-off')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'days-off'
                  ? 'border-orange bg-orange/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-orange rounded"></div>
              <span className="text-sm font-medium text-gray-700">Days Off-set</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('rest-day')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'rest-day'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-gray-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Day off / Rest day</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={attendanceNote}
              onChange={(e) => setAttendanceNote(e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent resize-none"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
          <Button 
            onClick={selectedDate ? handleSaveAttendance : handleConfirmPunchIn}
            disabled={!selectedAttendanceType}
          >
            {isEditMode ? 'Save Changes' : selectedDate ? 'Add Entry' : 'Punch In'}
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  )
}
