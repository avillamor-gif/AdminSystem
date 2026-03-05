'use client'

import { useState, useEffect } from 'react'
import { Clock, Play, Square, Calendar, FileText, BarChart3, Timer, CheckCircle, X, ChevronRight } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '../../../lib/supabase/client'
import { useAttendanceRecords, useClockIn, useClockOut, useCurrentEmployee, useLeaveRequests } from '@/hooks'
import { useHolidays } from '@/hooks/useLeaveAbsence'

type AttendanceType = 'work-onsite' | 'work-home' | 'work-offsite' | 'work-travel' | 'vacation' | 'sick' | 'days-off' | 'rest-day'

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
  const [activeTab, setActiveTab] = useState<'punch' | 'timesheets' | 'attendance' | 'reports'>('punch')
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
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<'project' | 'attendance' | 'timesheet' | 'monthly-sheet' | null>(null)
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0])
  const [sheetMonth, setSheetMonth] = useState(new Date().getMonth())
  const [sheetYear, setSheetYear] = useState(new Date().getFullYear())
  const [editableDates, setEditableDates] = useState<{[key: string]: string}>({})

  // Fetch current employee data
  const { data: currentEmployee, isLoading: isLoadingEmployee, error: employeeError } = useCurrentEmployee()

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
      
      if (todayRecord && todayRecord.clock_in && !todayRecord.clock_out) {
        // Punched in but not yet punched out
        setIsPunchedIn(true)
        // Extract attendance type from notes (format: "work-onsite: note" or just "work-onsite")
        const notesParts = todayRecord.notes?.split(':') || []
        const attendanceType = notesParts[0] as AttendanceType || 'work-onsite'
        setCurrentAttendanceType(attendanceType)
        setPunchInTime(new Date(todayRecord.clock_in))
      } else {
        // Not punched in, or already punched out
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
      
      // Save to database with mapped status (reset clock_out so punch-out detection works correctly)
      const { data, error } = await supabase.from('attendance_records').upsert({
        employee_id: userRole.employee_id,
        date: today,
        clock_in: now.toISOString(),
        clock_out: null,
        status: mapAttendanceTypeToStatus(selectedAttendanceType),
        notes: `${selectedAttendanceType}${attendanceNote ? ': ' + attendanceNote : ''}` // Store UI type in notes
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
        
        // Update the attendance record with clock_out time
        await supabase
          .from('attendance_records')
          .update({ clock_out: now.toISOString() })
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

  const handleOpenReport = (reportType: 'project' | 'attendance' | 'timesheet' | 'monthly-sheet') => {
    setSelectedReport(reportType)
    setShowReportModal(true)
  }

  const handlePrintMonthlySheet = () => {
    const printWindow = window.open('', '_blank', 'width=1400,height=900')
    if (!printWindow) return

    const daysInMonth = new Date(sheetYear, sheetMonth + 1, 0).getDate()
    const monthName = new Date(sheetYear, sheetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const employeeName = currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : ''
    const department = currentEmployee?.department?.name || ''
    const position = currentEmployee?.job_title?.title || ''
    const logoUrl = `${window.location.origin}/ibon-logo.png`

    const rowTypes = [
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

    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateKey = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const label = editableDates[dateKey] || day.toString()
      return `<th style="border:1px solid #d1d5db;padding:4px 2px;text-align:center;font-size:10px;min-width:22px;">${label}</th>`
    }).join('')

    const tableRows = rowTypes.map(type => {
      const typeRecords = attendanceRecords?.filter(r => {
        const d = new Date(r.date)
        return d.getMonth() === sheetMonth && d.getFullYear() === sheetYear && r.status === type.key
      }) || []
      const count = typeRecords.length

      const cells = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const dateStr = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const hasRecord = typeRecords.some(r => r.date === dateStr)
        return `<td style="border:1px solid #d1d5db;text-align:center;min-width:22px;height:24px;">${hasRecord ? '<span style="color:#2563eb;font-weight:700;">✓</span>' : ''}</td>`
      }).join('')

      return `
        <tr style="background:${type.bg};">
          <td style="border:1px solid #d1d5db;padding:4px 8px;white-space:nowrap;font-size:11px;">${type.label}</td>
          <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:600;font-size:11px;">${count.toFixed(1)}</td>
          ${cells}
        </tr>`
    }).join('')

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Monthly Attendance Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 12px; }
    @page { size: A4 landscape; margin: 8mm; }
    @media print { body { padding: 0; } }
    table { border-collapse: collapse; width: 100%; }
    input[type=text] { border: none; border-bottom: 1px solid #9ca3af; background: transparent; font-size: 10px; width: 70px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
    <img src="${logoUrl}" alt="IBON International" style="height:60px;width:auto;" />
    <div style="flex:1;text-align:right;">
      <h2 style="font-size:20px;font-weight:700;">ATTENDANCE SHEET</h2>
    </div>
  </div>

  <!-- Employee Info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 32px;margin-bottom:20px;font-size:12px;">
    <div style="display:flex;"><span style="font-weight:600;width:180px;">NAME OF PERSON :</span><span>${employeeName}</span></div>
    <div style="display:flex;"><span style="font-weight:600;width:180px;">PERIOD COVERED :</span><span>${monthName}</span></div>
    <div style="display:flex;"><span style="font-weight:600;width:180px;">PROJECT NAME/ UNIT :</span><span>${department}</span></div>
    <div style="display:flex;"><span style="font-weight:600;width:180px;">POSITION :</span><span>${position}</span></div>
  </div>

  <!-- Attendance Table -->
  <div style="overflow-x:auto;margin-bottom:24px;">
    <table>
      <thead>
        <tr style="background:#f9fafb;">
          <th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;font-size:11px;white-space:nowrap;">Description</th>
          <th style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;font-size:11px;">Days</th>
          ${dayHeaders}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <!-- Signatories -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;margin-top:32px;font-size:11px;">
    <div>
      <div style="font-weight:600;margin-bottom:4px;">SIGNED:</div>
      <div style="margin-bottom:4px;">PROGRAM HEAD:</div>
      <div>DATE: <input type="text" placeholder="mm/dd/yyyy" /></div>
    </div>
    <div>
      <div style="font-weight:600;margin-bottom:4px;">REVIEWED BY:</div>
      <div style="margin-bottom:4px;">NAME: <span style="display:inline-block;width:130px;border-bottom:1px solid #9ca3af;margin-left:8px;"></span></div>
      <div style="margin-bottom:4px;">POSITION: Administrative Manager</div>
      <div>DATE: <input type="text" placeholder="mm/dd/yyyy" /></div>
    </div>
    <div>
      <div style="font-weight:600;margin-bottom:4px;">APPROVED:</div>
      <div style="margin-bottom:4px;">NAME: Jennifer Narcisa D. Malonzo</div>
      <div style="margin-bottom:4px;">POSITION: Executive Director</div>
      <div>DATE: <input type="text" placeholder="mm/dd/yyyy" /></div>
    </div>
  </div>
</body>
</html>`)

    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
    }
    setTimeout(() => {
      if (!printWindow.closed) { printWindow.print(); printWindow.close() }
    }, 2000)
  }

  const handleExportReport = () => {
    if (!attendanceRecords) return
    
    // Filter records by date range
    const filteredRecords = attendanceRecords.filter(record => {
      return record.date >= reportStartDate && record.date <= reportEndDate
    })
    
    // Create CSV content
    let csvContent = ''
    
    if (selectedReport === 'attendance') {
      csvContent = 'Date,Punch In,Punch Out,Duration,Status,Notes\n'
      filteredRecords.forEach(record => {
        const duration = formatDuration(record.clock_in, record.clock_out)
        csvContent += `${record.date},${formatTimeOnly(record.clock_in)},${formatTimeOnly(record.clock_out)},${duration},${getAttendanceTypeInfo(record.status).label},"${record.notes || ''}"\n`
      })
    } else if (selectedReport === 'timesheet') {
      csvContent = 'Date,Day,Hours Worked,Status,Notes\n'
      filteredRecords.forEach(record => {
        const hours = record.clock_in && record.clock_out 
          ? ((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 3600000).toFixed(2)
          : '0'
        const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })
        csvContent += `${record.date},${day},${hours},${getAttendanceTypeInfo(record.status).label},"${record.notes || ''}"\n`
      })
    } else if (selectedReport === 'project') {
      csvContent = 'Date,Hours,Project,Status,Notes\n'
      filteredRecords.forEach(record => {
        const hours = record.clock_in && record.clock_out 
          ? ((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 3600000).toFixed(2)
          : '0'
        csvContent += `${record.date},${hours},General Work,${getAttendanceTypeInfo(record.status).label},"${record.notes || ''}"\n`
      })
    }
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport}-report-${reportStartDate}-to-${reportEndDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeklyHours = [8, 8.5, 7.5, 8, 0, 0, 0]

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
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Reports
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
              {weekdays.map((day, index) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-12">{day}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange rounded-full"
                        style={{ width: `${(weeklyHours[index] / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {weeklyHours[index]}h
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">Total This Week</span>
              <span className="font-bold text-orange">
                {weeklyHours.reduce((a, b) => a + b, 0)}h
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
                      badge: leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1),
                      badgeVariant: (leaveRequest.status === 'approved' ? 'success' : 'warning') as const
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
                  
                  days.push(
                    <div
                      key={day}
                      onClick={() => !holiday && handleDateClick(dateStr, attendanceUiType, attendance?.notes ? (attendance.notes.includes(':') ? attendance.notes.split(':').slice(1).join(':').trim() : '') : '')}
                      className={`min-h-[100px] p-2 border-b border-gray-200 ${holiday ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'} transition-colors ${
                        !isLastCol ? 'border-r' : ''
                      } ${bgColor}`}
                    >
                      <div className={`text-sm ${attendance || leaveRequest || holiday ? 'font-medium' : 'text-gray-500'}`}>{day}</div>
                      {displayInfo && (
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
                      {attendance?.notes && !leaveRequest && !holiday && (() => {
                          const noteText = attendance.notes.includes(':') 
                            ? attendance.notes.split(':').slice(1).join(':').trim()
                            : null
                          return noteText ? (
                            <div className="mt-0.5 text-xs text-gray-500 truncate">{noteText}</div>
                          ) : null
                        })()}
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

      {/* Attendance Tab */}
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
                  attendanceRecords.map((record) => {
                    const uiType = record.notes ? record.notes.split(':')[0].trim() : record.status
                    const attendanceInfo = getAttendanceTypeInfo(uiType)
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatTimeOnly(record.clock_in)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatTimeOnly(record.clock_out)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDuration(record.clock_in, record.clock_out)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${attendanceInfo.color}`}></div>
                            <span className="text-sm font-medium text-gray-700">
                              {attendanceInfo.label}
                            </span>
                          </div>
                          {record.notes && (
                            <div className="text-xs text-gray-500 mt-1">{record.notes}</div>
                          )}
                        </td>
                      </tr>
                    )
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

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Project Time Report', description: 'View time spent on each project', icon: BarChart3, type: 'project' as const },
            { title: 'Employee Attendance Report', description: 'View attendance summary', icon: Calendar, type: 'attendance' as const },
            { title: 'Timesheet Report', description: 'Export timesheet data', icon: FileText, type: 'timesheet' as const },
            { title: 'Monthly Attendance Sheet', description: 'Generate monthly attendance form', icon: FileText, type: 'monthly-sheet' as const },
          ].map((report) => (
            <Card key={report.title} className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenReport(report.type)}>
              <div className="p-3 bg-orange/10 rounded-lg w-fit mb-4">
                <report.icon className="w-6 h-6 text-orange" />
              </div>
              <h3 className="font-semibold text-gray-900">{report.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{report.description}</p>
              <Button variant="outline" size="sm" className="mt-4">
                View Report
              </Button>
          </Card>
        ))}
      </div>
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
              onClick={() => setSelectedAttendanceType('vacation')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'vacation'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-amber-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Vacation leave</span>
            </button>

            <button
              onClick={() => setSelectedAttendanceType('sick')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedAttendanceType === 'sick'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Sick leave</span>
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

      {/* Report Modal */}
      <Modal 
        open={showReportModal} 
        onClose={() => setShowReportModal(false)}
        className={selectedReport === 'monthly-sheet' ? 'max-w-7xl' : 'max-w-2xl'}
      >
        <ModalHeader onClose={() => setShowReportModal(false)}>
          {selectedReport === 'project' && 'Project Time Report'}
          {selectedReport === 'attendance' && 'Employee Attendance Report'}
          {selectedReport === 'timesheet' && 'Timesheet Report'}
          {selectedReport === 'monthly-sheet' && 'Monthly Attendance Sheet'}
        </ModalHeader>
        
        <ModalBody>
          {/* Date Range Filter - only for non-monthly-sheet reports */}
          {selectedReport !== 'monthly-sheet' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Date Range</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Report Content */}
          <div>
            {selectedReport === 'attendance' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h4>
                {attendanceRecords && attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length > 0 ? (
                  <div className="space-y-3">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-green-600 font-medium">Total Days</div>
                        <div className="text-2xl font-bold text-green-700">
                          {attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium">Total Hours</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {attendanceRecords
                            .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                            .reduce((sum, r) => {
                              if (r.clock_in && r.clock_out) {
                                const hours = (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000
                                return sum + hours
                              }
                              return sum
                            }, 0)
                            .toFixed(1)}h
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="text-xs text-amber-600 font-medium">Avg Hours/Day</div>
                        <div className="text-2xl font-bold text-amber-700">
                          {(attendanceRecords
                            .filter(r => r.date >= reportStartDate && r.date <= reportEndDate && r.clock_in && r.clock_out)
                            .reduce((sum, r) => {
                              const hours = (new Date(r.clock_out!).getTime() - new Date(r.clock_in!).getTime()) / 3600000
                              return sum + hours
                            }, 0) / attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate && r.clock_in && r.clock_out).length || 0)
                            .toFixed(1)}h
                        </div>
                      </div>
                    </div>
                    
                    {/* Records List */}
                    <div className="space-y-2">
                      {attendanceRecords
                        .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                        .map(record => {
                          const info = getAttendanceTypeInfo(record.status)
                          return (
                            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{record.date}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${info.color}`}></div>
                                  <span className="text-xs text-gray-600">{info.label}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDuration(record.clock_in, record.clock_out)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTimeOnly(record.clock_in)} - {formatTimeOnly(record.clock_out)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No records found for selected date range</p>
                )}
              </div>
            )}

            {selectedReport === 'timesheet' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timesheet Details</h4>
                {attendanceRecords && attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Day</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendanceRecords
                        .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                        .map(record => {
                          const hours = record.clock_in && record.clock_out 
                            ? ((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 3600000).toFixed(2)
                            : '0.00'
                          const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })
                          return (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{record.date}</td>
                              <td className="px-3 py-2 text-gray-600">{day}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{hours}h</td>
                            </tr>
                          )
                        })}
                      <tr className="bg-orange/5 font-semibold">
                        <td className="px-3 py-2" colSpan={2}>Total</td>
                        <td className="px-3 py-2 text-right">
                          {attendanceRecords
                            .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                            .reduce((sum, r) => {
                              if (r.clock_in && r.clock_out) {
                                return sum + ((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000)
                              }
                              return sum
                            }, 0)
                            .toFixed(2)}h
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No records found for selected date range</p>
                )}
              </div>
            )}

            {selectedReport === 'monthly-sheet' && (
              <div id="monthly-sheet-print" className="space-y-6">
                {/* Month/Year Selector with Print Button */}
                <div className="flex gap-3 items-end print:hidden">
                  <div className="w-40">
                    <label className="block text-xs text-gray-600 mb-1">Month</label>
                    <select
                      value={sheetMonth}
                      onChange={(e) => setSheetMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                        <option key={month} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <select
                      value={sheetYear}
                      onChange={(e) => setSheetYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handlePrintMonthlySheet} className="whitespace-nowrap">
                    Print Report
                  </Button>
                </div>

                {/* Sheet Content */}
                <div className="border border-gray-300 rounded-lg p-6 bg-white">
                  {/* Header Section with Logo */}
                  <div className="flex items-start justify-between mb-6">
                    <img 
                      src="/ibon-logo.png" 
                      alt="IBON International" 
                      className="h-16 w-auto"
                    />
                    <div className="flex-1 text-right">
                      <h2 className="text-xl font-bold text-gray-900">ATTENDANCE SHEET</h2>
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-48">NAME OF PERSON :</span>
                      <span className="text-gray-700">
                        {isLoadingEmployee ? 'Loading...' : currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : 'No employee data'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-48">PERIOD COVERED :</span>
                      <span className="text-gray-700">{new Date(sheetYear, sheetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-48">PROJECT NAME/ UNIT :</span>
                      <span className="text-gray-700">
                        {isLoadingEmployee ? 'Loading...' : currentEmployee?.department?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-48">POSITION :</span>
                      <span className="text-gray-700">
                        {isLoadingEmployee ? 'Loading...' : currentEmployee?.job_title?.title || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-gray-300 text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Description</th>
                          <th className="border border-gray-300 px-2 py-2 text-center font-semibold">Days</th>
                          {Array.from({ length: new Date(sheetYear, sheetMonth + 1, 0).getDate() }, (_, i) => {
                            const day = i + 1
                            const dateKey = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            return (
                              <th key={day} className="border border-gray-300 px-1 py-2 text-center font-semibold">
                                <input
                                  type="text"
                                  value={editableDates[dateKey] || day.toString()}
                                  onChange={(e) => setEditableDates(prev => ({ ...prev, [dateKey]: e.target.value }))}
                                  className="w-full text-center bg-transparent border-none focus:outline-none focus:bg-white focus:border focus:border-orange rounded px-1 font-semibold"
                                  maxLength={2}
                                />
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Work on-site', key: 'work-onsite', bgColor: 'bg-blue-50' },
                          { label: 'Work from home', key: 'work-home', bgColor: 'bg-green-50' },
                          { label: 'Work off-site', key: 'work-offsite', bgColor: 'bg-purple-50' },
                          { label: 'Work on Travel', key: 'work-travel', bgColor: 'bg-indigo-50' },
                          { label: 'Vacation leave', key: 'vacation', bgColor: 'bg-amber-50' },
                          { label: 'Sick leave', key: 'sick', bgColor: 'bg-red-50' },
                          { label: 'Days Off-set', key: 'days-off', bgColor: 'bg-orange/10' },
                          { label: 'Public Holidays', key: 'holiday', bgColor: 'bg-pink-50' },
                          { label: 'Day off / Rest day', key: 'rest-day', bgColor: 'bg-gray-50' },
                        ].map(type => {
                          const daysInMonth = new Date(sheetYear, sheetMonth + 1, 0).getDate()
                          const typeRecords = attendanceRecords?.filter(r => {
                            const recordDate = new Date(r.date)
                            return recordDate.getMonth() === sheetMonth && 
                                   recordDate.getFullYear() === sheetYear && 
                                   r.status === type.key
                          }) || []
                          
                          return (
                            <tr key={type.key} className={type.bgColor}>
                              <td className="border border-gray-300 px-2 py-2">{type.label}</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{typeRecords.length.toFixed(1)}</td>
                              {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1
                                const dateStr = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                const hasRecord = typeRecords.some(r => r.date === dateStr)
                                return (
                                  <td key={day} className="border border-gray-300 text-center w-8 h-8">
                                    {hasRecord && <span className="text-blue-600 font-bold text-lg">✓</span>}
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
                    <div>
                      <div className="mb-1">
                        <span className="text-xs font-semibold">SIGNED:</span>
                      </div>
                      <div className="text-xs mb-1">PROGRAM HEAD:</div>
                      <div className="text-xs mb-8">
                        DATE: 
                        <input 
                          type="text" 
                          placeholder="mm/dd/yyyy"
                          className="ml-2 border-b border-gray-400 focus:border-orange focus:outline-none text-xs w-24 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1">
                        <span className="text-xs font-semibold">REVIEWED BY:</span>
                      </div>
                      <div className="text-xs">NAME: <span className="border-b border-gray-400 inline-block w-32 ml-2"></span></div>
                      <div className="text-xs my-1">POSITION: Administrative Manager</div>
                      <div className="text-xs">
                        DATE: 
                        <input 
                          type="text" 
                          placeholder="mm/dd/yyyy"
                          className="ml-2 border-b border-gray-400 focus:border-orange focus:outline-none text-xs w-24 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1">
                        <span className="text-xs font-semibold">APPROVED:</span>
                      </div>
                      <div className="text-xs">NAME: Jennifer Narcisa D. Malonzo</div>
                      <div className="text-xs my-1">POSITION: Executive Director</div>
                      <div className="text-xs">
                        DATE: 
                        <input 
                          type="text" 
                          placeholder="mm/dd/yyyy"
                          className="ml-2 border-b border-gray-400 focus:border-orange focus:outline-none text-xs w-24 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'project' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Project Time Breakdown</h4>
                {attendanceRecords && attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">General Work</h5>
                        <span className="text-sm font-bold text-blue-700">
                          {attendanceRecords
                            .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                            .reduce((sum, r) => {
                              if (r.clock_in && r.clock_out) {
                                return sum + ((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000)
                              }
                              return sum
                            }, 0)
                            .toFixed(1)}h
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length} days logged
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {attendanceRecords
                        .filter(r => r.date >= reportStartDate && r.date <= reportEndDate)
                        .map(record => {
                          const hours = record.clock_in && record.clock_out 
                            ? ((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 3600000).toFixed(2)
                            : '0.00'
                          return (
                            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{record.date}</div>
                                {record.notes && (
                                  <div className="text-xs text-gray-500 mt-1">{record.notes}</div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-gray-900">{hours}h</div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No records found for selected date range</p>
                )}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {selectedReport !== 'monthly-sheet' && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReportModal(false)}
              >
                Close
              </Button>
              <Button 
                onClick={handleExportReport}
                disabled={!attendanceRecords || attendanceRecords.filter(r => r.date >= reportStartDate && r.date <= reportEndDate).length === 0}
              >
                Export CSV
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}