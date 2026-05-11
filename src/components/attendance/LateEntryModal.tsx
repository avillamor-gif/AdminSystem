'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'
import type { AttendanceType } from './AttendanceTypeModal'

const TYPES: { type: AttendanceType; label: string; color: string; bg: string }[] = [
  { type: 'work-onsite',  label: 'Work on-site',       color: 'bg-blue-500',   bg: 'bg-blue-50'   },
  { type: 'work-home',    label: 'Work from home',      color: 'bg-green-500',  bg: 'bg-green-50'  },
  { type: 'work-offsite', label: 'Work off-site',       color: 'bg-purple-500', bg: 'bg-purple-50' },
  { type: 'work-travel',  label: 'Work on travel',      color: 'bg-indigo-500', bg: 'bg-indigo-50' },
  { type: 'vacation',     label: 'Vacation leave',      color: 'bg-amber-500',  bg: 'bg-amber-50'  },
  { type: 'sick',         label: 'Sick leave',          color: 'bg-red-500',    bg: 'bg-red-50'    },
  { type: 'days-off',     label: 'Days off',            color: 'bg-orange-500', bg: 'bg-orange-50' },
  { type: 'rest-day',     label: 'Day off / Rest day',  color: 'bg-gray-500',   bg: 'bg-gray-50'   },
]

interface Props {
  open: boolean
  dateStr: string          // YYYY-MM-DD
  onClose: () => void
  onSubmit: (payload: {
    date: string
    type: AttendanceType
    timeIn: string
    timeOut: string
    reason: string
  }) => Promise<void>
}

export function LateEntryModal({ open, dateStr, onClose, onSubmit }: Props) {
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null)
  const [timeIn,  setTimeIn]  = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [reason,  setReason]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const dateLabel = dateStr
    ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  const handleClose = () => {
    setSelectedType(null)
    setTimeIn('')
    setTimeOut('')
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedType) { setError('Please select an attendance type.'); return }
    if (!reason.trim()) { setError('Please provide a reason for the late entry.'); return }
    setError('')
    setSaving(true)
    try {
      await onSubmit({ date: dateStr, type: selectedType, timeIn, timeOut, reason: reason.trim() })
      handleClose()
    } catch (e: any) {
      setError(e.message ?? 'Failed to submit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>Add Late Attendance Entry</ModalHeader>

      <ModalBody>
        {/* Date */}
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">📅 {dateLabel}</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This entry will be flagged as a late submission and your supervisor will be notified.
          </p>
        </div>

        {/* Attendance type grid */}
        <p className="text-sm font-medium text-gray-700 mb-3">Attendance Type <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {TYPES.map(({ type, label, color, bg }) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                selectedType === type
                  ? `border-current ${bg} font-medium`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded flex-shrink-0 ${color}`} />
              <span className="text-sm text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* Optional time fields */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time In <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="time"
              value={timeIn}
              onChange={e => setTimeIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Out <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="time"
              value={timeOut}
              onChange={e => setTimeOut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange"
            />
          </div>
        </div>

        {/* Reason (required) */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this attendance entry was not submitted on time…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" type="button" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Submitting…' : 'Submit Late Entry'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
