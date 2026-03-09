'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface LeaveDatePickerProps {
  label: string
  value: string          // YYYY-MM-DD
  onChange: (date: string) => void
  holidayDates: Set<string>
  minDate?: string       // YYYY-MM-DD — dates before this are disabled
  required?: boolean
  error?: string
  placeholder?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toLocal(iso: string) {
  // Parse YYYY-MM-DD as local midnight to avoid UTC offset issues
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoOf(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function LeaveDatePicker({
  label,
  value,
  onChange,
  holidayDates,
  minDate,
  required,
  error,
  placeholder = 'Select date',
}: LeaveDatePickerProps) {
  const today = isoOf(new Date())
  const initial = value ? toLocal(value) : new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = toLocal(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const isDisabled = (iso: string): { disabled: boolean; reason: string } => {
    const d = toLocal(iso)
    const day = d.getDay()
    if (day === 0) return { disabled: true, reason: 'Sunday' }
    if (day === 6) return { disabled: true, reason: 'Saturday' }
    if (holidayDates.has(iso)) return { disabled: true, reason: 'Holiday' }
    if (minDate && iso < minDate) return { disabled: true, reason: '' }
    return { disabled: false, reason: '' }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const displayValue = value
    ? toLocal(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72">
          {/* Month / Year nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${d === 'Su' || d === 'Sa' ? 'text-red-400' : 'text-gray-500'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((iso, idx) => {
              if (!iso) return <div key={idx} />
              const { disabled, reason } = isDisabled(iso)
              const isSelected = iso === value
              const isToday = iso === today
              const isWeekend = toLocal(iso).getDay() === 0 || toLocal(iso).getDay() === 6
              const isHoliday = holidayDates.has(iso)

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  title={reason || undefined}
                  onClick={() => { onChange(iso); setOpen(false) }}
                  className={`
                    relative w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors
                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                    ${!isSelected && isToday ? 'border border-blue-400 text-blue-600' : ''}
                    ${!isSelected && isHoliday ? 'bg-orange-50 text-orange-400 cursor-not-allowed line-through' : ''}
                    ${!isSelected && isWeekend && !isHoliday ? 'text-red-300 cursor-not-allowed' : ''}
                    ${!isSelected && disabled && !isWeekend && !isHoliday ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${!isSelected && !disabled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer' : ''}
                  `}
                >
                  {toLocal(iso).getDate()}
                  {isHoliday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Holiday
            </span>
            <span className="flex items-center gap-1 text-xs text-red-400">
              Sa / Su = Weekend
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
