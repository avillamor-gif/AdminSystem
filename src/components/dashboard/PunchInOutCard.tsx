'use client'

import { useState, useEffect } from 'react'
import { Play, Square } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { AttendanceTypeModal } from '@/components/attendance/AttendanceTypeModal'
import type { AttendanceType } from '@/components/attendance/AttendanceTypeModal'
import { usePunchInOut, attendanceTypeColor, attendanceTypeLabel } from '@/hooks/usePunchInOut'

interface Props {
  /** Called after a successful punch-in so the parent can navigate/switch tabs */
  onPunchedIn?: () => void
  /** Called after a successful punch-out so the parent can navigate/switch tabs */
  onPunchedOut?: () => void
}

export function PunchInOutCard({ onPunchedIn, onPunchedOut }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showModal, setShowModal]     = useState(false)
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null)
  const [note, setNote]               = useState('')

  const {
    isPunchedIn,
    punchInTime,
    currentType,
    saving,
    confirmPunchIn,
    punchOut,
  } = usePunchInOut({ onPunchedIn, onPunchedOut })

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

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

  const handleOpenModal = () => {
    setSelectedType(null)
    setNote('')
    setShowModal(true)
  }

  const handleCancel = () => {
    setShowModal(false)
    setSelectedType(null)
    setNote('')
  }

  const handleConfirm = async () => {
    if (!selectedType) return
    const ok = await confirmPunchIn(selectedType, note)
    if (ok) {
      setShowModal(false)
      setSelectedType(null)
      setNote('')
    }
  }

  return (
    <>
      <Card className="p-6 text-center">
        {/* Live clock */}
        <div className="mb-5">
          <p className="text-xs text-gray-500">{formatDate(currentTime)}</p>
          <p className="text-4xl font-bold text-gray-900 mt-1 tabular-nums">{formatTime(currentTime)}</p>
        </div>

        {isPunchedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-medium">Currently punched in</p>
              {currentType && (
                <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium mt-2 ${attendanceTypeColor[currentType]}`}>
                  {attendanceTypeLabel[currentType]}
                </span>
              )}
              <p className="text-2xl font-bold text-green-700 mt-2 tabular-nums">{getElapsedTime()}</p>
              <p className="text-xs text-green-500 mt-1">
                Since {punchInTime && formatTime(punchInTime)}
              </p>
            </div>
            <Button onClick={punchOut} className="w-full bg-red-500 hover:bg-red-600" size="lg">
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
            <Button onClick={handleOpenModal} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Punch In
            </Button>
          </div>
        )}
      </Card>

      {/* The one shared Select Attendance Type modal */}
      <AttendanceTypeModal
        open={showModal}
        dateLabel={formatDate(currentTime)}
        selectedType={selectedType}
        note={note}
        saving={saving}
        confirmLabel="Punch In"
        onSelectType={setSelectedType}
        onNoteChange={setNote}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
