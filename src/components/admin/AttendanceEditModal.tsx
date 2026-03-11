'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Trash2 } from 'lucide-react'
import { useUpsertAttendanceRecord, useDeleteAttendanceRecord } from '@/hooks/useAttendance'
import type { AttendanceRecord } from '@/services/attendance.service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  type: string
  timeIn: string   // ISO string or ''
  timeOut: string  // ISO string or ''
}

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
  dateStr: string          // 'YYYY-MM-DD'
  record: AttendanceRecord | null   // null = no record yet (create mode)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORK_TYPES = [
  { value: 'work-onsite',  label: 'Work on-site' },
  { value: 'work-home',    label: 'Work from home' },
  { value: 'work-offsite', label: 'Work off-site' },
  { value: 'work-travel',  label: 'Work on Travel' },
]

/** 'HH:MM' local → full ISO string on dateStr */
function localTimeToISO(dateStr: string, hhmm: string): string {
  if (!hhmm) return ''
  return new Date(`${dateStr}T${hhmm}:00`).toISOString()
}

/** ISO string → 'HH:MM' in local time */
function isoToLocalTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Parse notes JSON → sessions array */
function parseSessions(notes: string | null): Session[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed.map((s: any) => ({
      type:    s.type    ?? 'work-onsite',
      timeIn:  s.timeIn  ?? '',
      timeOut: s.timeOut ?? '',
    }))
  } catch {}
  return []
}

/** Build notes JSON from sessions */
function serializeSessions(sessions: Session[]): string {
  return JSON.stringify(sessions.map(s => ({
    type:    s.type,
    timeIn:  s.timeIn  || null,
    timeOut: s.timeOut || null,
    note:    '',
  })))
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AttendanceEditModal({ open, onClose, employeeId, employeeName, dateStr, record }: Props) {
  const upsert = useUpsertAttendanceRecord()
  const remove = useDeleteAttendanceRecord()

  const [sessions, setSessions] = useState<Session[]>([{ type: 'work-onsite', timeIn: '', timeOut: '' }])
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Populate form when record / date changes
  useEffect(() => {
    if (!open) return
    if (record) {
      const parsed = parseSessions(record.notes)
      if (parsed.length > 0 && parsed[0].timeIn) {
        // JSON sessions
        setSessions(parsed.map(s => ({
          type:    s.type,
          timeIn:  isoToLocalTime(s.timeIn),
          timeOut: isoToLocalTime(s.timeOut),
        })))
      } else {
        // Legacy: use clock_in / clock_out
        setSessions([{
          type:    record.status ?? 'work-onsite',
          timeIn:  isoToLocalTime(record.clock_in),
          timeOut: isoToLocalTime(record.clock_out),
        }])
      }
    } else {
      setSessions([{ type: 'work-onsite', timeIn: '', timeOut: '' }])
    }
  }, [open, record, dateStr])

  const addSession = () =>
    setSessions(s => [...s, { type: 'work-onsite', timeIn: '', timeOut: '' }])

  const removeSession = (idx: number) =>
    setSessions(s => s.filter((_, i) => i !== idx))

  const updateSession = (idx: number, field: keyof Session, value: string) =>
    setSessions(s => s.map((row, i) => i === idx ? { ...row, [field]: value } : row))

  const handleSave = async () => {
    const firstIn  = sessions[0]?.timeIn  ? localTimeToISO(dateStr, sessions[0].timeIn)  : null
    const lastOut  = sessions[sessions.length - 1]?.timeOut
      ? localTimeToISO(dateStr, sessions[sessions.length - 1].timeOut) : null

    const notes = sessions.some(s => s.timeIn)
      ? serializeSessions(sessions.map(s => ({
          type:    s.type,
          timeIn:  s.timeIn  ? localTimeToISO(dateStr, s.timeIn)  : '',
          timeOut: s.timeOut ? localTimeToISO(dateStr, s.timeOut) : '',
        })))
      : null

    await upsert.mutateAsync({
      id:          record?.id,
      employee_id: employeeId,
      date:        dateStr,
      status:      sessions[0]?.type ?? 'present',
      clock_in:    firstIn,
      clock_out:   lastOut,
      notes,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!record) return
    await remove.mutateAsync({ id: record.id, employee_id: employeeId, date: dateStr })
    setConfirmDelete(false)
    onClose()
  }

  const displayDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader onClose={onClose}>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {record ? 'Edit Attendance' : 'Add Attendance'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{employeeName} · {displayDate}</p>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {sessions.map((session, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Session {idx + 1}
                  </span>
                  {sessions.length > 1 && (
                    <button
                      onClick={() => removeSession(idx)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Work type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Work Type</label>
                  <select
                    value={session.type}
                    onChange={e => updateSession(idx, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                  >
                    {WORK_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Time In / Time Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time In</label>
                    <input
                      type="time"
                      value={session.timeIn}
                      onChange={e => updateSession(idx, 'timeIn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time Out</label>
                    <input
                      type="time"
                      value={session.timeOut}
                      onChange={e => updateSession(idx, 'timeOut', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSession}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange hover:text-orange transition-colors"
            >
              + Add another session
            </button>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            {/* Delete — only shown when editing existing record */}
            {record ? (
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                disabled={remove.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={upsert.isPending}
              >
                {upsert.isPending ? 'Saving…' : record ? 'Save Changes' : 'Add Record'}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Attendance Record"
        message={`Delete the attendance record for ${employeeName} on ${displayDate}? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={remove.isPending}
      />
    </>
  )
}
