'use client'

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'

export type AttendanceType =
  | 'work-onsite'
  | 'work-home'
  | 'work-offsite'
  | 'work-travel'
  | 'vacation'
  | 'sick'
  | 'days-off'
  | 'rest-day'

interface Props {
  open: boolean
  title?: string
  dateLabel?: string
  selectedType: AttendanceType | null
  note: string
  saving?: boolean
  confirmLabel?: string
  onSelectType: (type: AttendanceType) => void
  onNoteChange: (note: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function AttendanceTypeModal({
  open,
  title = 'Select Attendance Type',
  dateLabel,
  selectedType,
  note,
  saving = false,
  confirmLabel = 'Confirm',
  onSelectType,
  onNoteChange,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} className="max-w-lg">
      <ModalHeader onClose={onCancel}>{title}</ModalHeader>

      <ModalBody>
        {dateLabel && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">Date: {dateLabel}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => onSelectType('work-onsite')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'work-onsite'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-blue-500 rounded" />
            <span className="text-sm font-medium text-gray-700">Work on-site</span>
          </button>

          <button
            onClick={() => onSelectType('work-home')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'work-home'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-green-500 rounded" />
            <span className="text-sm font-medium text-gray-700">Work from home</span>
          </button>

          <button
            onClick={() => onSelectType('work-offsite')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'work-offsite'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-purple-500 rounded" />
            <span className="text-sm font-medium text-gray-700">Work off-site</span>
          </button>

          <button
            onClick={() => onSelectType('work-travel')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'work-travel'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-indigo-500 rounded" />
            <span className="text-sm font-medium text-gray-700">Work on Travel</span>
          </button>

          <button
            onClick={() => onSelectType('days-off')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'days-off'
                ? 'border-orange bg-orange/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-orange rounded" />
            <span className="text-sm font-medium text-gray-700">Days Off-set</span>
          </button>

          <button
            onClick={() => onSelectType('rest-day')}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              selectedType === 'rest-day'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 bg-gray-500 rounded" />
            <span className="text-sm font-medium text-gray-700">Day off / Rest day</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add any additional notes..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent resize-none"
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!selectedType || saving}>
          {saving ? 'Saving…' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
