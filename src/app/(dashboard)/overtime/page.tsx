'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useMyOvertimeRequests, useCreateOvertimeRequest, useCancelOvertimeRequest } from '@/hooks'
import {
  REQUEST_TYPE_LABELS,
  DAY_TYPE_LABELS,
  OT_RATE_MULTIPLIERS,
  computeHours,
} from '@/services'
import type { OvertimeRequestType, OvertimeDayType, OvertimeRequestStatus } from '@/services'
import { formatDate, localDateStr } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<OvertimeRequestStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function OvertimeRequestPage() {
  const router = useRouter()
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: myRequests = [], isLoading } = useMyOvertimeRequests(currentEmployee?.id ?? '')
  const createMutation = useCreateOvertimeRequest()
  const cancelMutation = useCancelOvertimeRequest()

  // Form state
  const [requestType, setRequestType] = useState<OvertimeRequestType>('overtime')
  const [requestDate, setRequestDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [dayType, setDayType] = useState<OvertimeDayType>('regular')
  const [location, setLocation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [showForm, setShowForm] = useState(false)

  const totalHours = startTime && endTime ? computeHours(startTime, endTime) : 0
  const multiplier = OT_RATE_MULTIPLIERS[dayType]
  const isOB = requestType === 'official_business'

  const handleSubmit = async () => {
    if (!currentEmployee?.id || !requestDate || !startTime || !endTime || !purpose) {
      toast.error('Please fill in all required fields.')
      return
    }
    await createMutation.mutateAsync({
      employee_id: currentEmployee.id,
      request_type: requestType,
      request_date: requestDate,
      start_time: startTime,
      end_time: endTime,
      total_hours: totalHours,
      location: location || null,
      purpose,
      day_type: dayType,
      ot_rate_multiplier: isOB ? null : multiplier,
      requested_by: currentEmployee.id,
    })
    setShowForm(false)
    setRequestDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setPurpose('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">OT / OB Requests</h1>
            <p className="text-sm text-gray-500">Submit overtime, stay-on, or official business requests</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ New Request'}
        </Button>
      </div>

      {/* Request Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Request</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type *</label>
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value as OvertimeRequestType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(REQUEST_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Type *</label>
                  <select value={dayType} onChange={e => setDayType(e.target.value as OvertimeDayType)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(DAY_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {startTime && endTime && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <span className="font-medium text-blue-800">Total: {totalHours.toFixed(2)} hours</span>
                  {!isOB && (
                    <span className="text-blue-600 ml-2">· Rate: ×{multiplier} ({DAY_TYPE_LABELS[dayType]})</span>
                  )}
                  {isOB && (
                    <span className="text-blue-600 ml-2">· OB — attendance credit only, no OT pay</span>
                  )}
                </div>
              )}

              {isOB && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Destination *</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Client office, Government agency…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Task *</label>
                <textarea rows={3} value={purpose} onChange={e => setPurpose(e.target.value)}
                  placeholder="Describe what work will be done…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex gap-3">
                <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Requests */}
      <Card>
        <CardHeader><CardTitle>My Requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">Loading…</div>
          ) : myRequests.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No requests yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {myRequests.map(r => (
                <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{REQUEST_TYPE_LABELS[r.request_type]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(r.request_date)} · {r.start_time}–{r.end_time} · {r.total_hours?.toFixed(2)}h
                    </div>
                    <div className="text-xs text-gray-400">{r.purpose}</div>
                    {r.rejection_reason && (
                      <div className="text-xs text-red-500">Reason: {r.rejection_reason}</div>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <Button
                      variant="ghost"
                      onClick={() => cancelMutation.mutateAsync(r.id)}
                      className="text-xs text-gray-400 flex-shrink-0"
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
