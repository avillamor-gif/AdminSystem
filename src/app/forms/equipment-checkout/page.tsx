'use client'

import { useState, useMemo } from 'react'
import { Monitor, Calendar, AlertCircle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useAssets } from '@/hooks/useAssets'
import { localDateStr } from '@/lib/utils'
import toast from 'react-hot-toast'

interface FormData {
  name: string
  org: string
  contact: string
  position: string
  asset_id: string
  purpose: string
  borrowed_date: string
  expected_return_date: string
  notes: string
}

const today = localDateStr(new Date())

/**
 * PUBLIC FORM: Equipment Checkout for External Partners / Guests
 * No authentication required
 * Rate limited on backend
 */
export default function PublicEquipmentCheckoutForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    org: '',
    contact: '',
    position: '',
    asset_id: '',
    purpose: '',
    borrowed_date: today,
    expected_return_date: '',
    notes: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [equipSearch, setEquipSearch] = useState('')
  const [equipOpen, setEquipOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectingEnd, setSelectingEnd] = useState(false)

  const { data: assets = [] } = useAssets({ status: 'available' })
  const borrowableAssets = assets.filter(a => (a as any).borrowable_by && (a as any).borrowable_by !== 'none')

  const selectedAsset = borrowableAssets.find(a => a.id === formData.asset_id) as
    | (any & { category?: { name: string } })
    | undefined

  const filteredAssets = borrowableAssets.filter(a => {
    const q = equipSearch.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.asset_tag?.toLowerCase().includes(q) ||
      (a as any).category?.name?.toLowerCase().includes(q)
    )
  })

  function selectAsset(a: any) {
    setFormData(p => ({ ...p, asset_id: a.id }))
    setEquipSearch(a.name)
    setEquipOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(y => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(y => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  function renderCalendar() {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: React.ReactNode[] = []

    for (let i = 0; i < firstWeekday; i++) {
      cells.push(<div key={`pad-${i}`} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isPast = d < today
      const isStart = d === formData.borrowed_date
      const isEnd = d === formData.expected_return_date
      const isInRange =
        formData.borrowed_date &&
        formData.expected_return_date &&
        d > formData.borrowed_date &&
        d < formData.expected_return_date

      let className =
        'h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors cursor-pointer '
      if (isPast) {
        className += 'text-gray-300 cursor-not-allowed'
      } else if (isStart || isEnd) {
        className += 'bg-green-600 text-white shadow'
      } else if (isInRange) {
        className += 'bg-green-100 text-green-700'
      } else {
        className += 'text-gray-700 hover:bg-green-50'
      }

      cells.push(
        <div
          key={d}
          className={className}
          onClick={() => {
            if (isPast) return
            if (!selectingEnd) {
              setFormData(p => ({ ...p, borrowed_date: d, expected_return_date: '' }))
              setSelectingEnd(true)
            } else {
              if (d <= formData.borrowed_date) {
                setFormData(p => ({ ...p, borrowed_date: d }))
              } else {
                setFormData(p => ({ ...p, expected_return_date: d }))
                setSelectingEnd(false)
              }
            }
          }}
        >
          {day}
        </div>
      )
    }

    const label = new Date(viewYear, viewMonth, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })

    return (
      <div>
        <p className="text-sm font-semibold text-gray-700 text-center mb-3">{label}</p>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(h => (
            <div key={h} className="text-[10px] font-medium text-gray-400 py-1">
              {h}
            </div>
          ))}
          {cells}
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!formData.org.trim()) {
        toast.error('Please enter your organization')
        return
      }
      if (!formData.contact.trim()) {
        toast.error('Please enter a contact (phone or email)')
        return
      }
      if (!formData.asset_id) {
        toast.error('Please select equipment')
        return
      }
      if (!formData.purpose.trim()) {
        toast.error('Please provide a purpose')
        return
      }
      if (!formData.borrowed_date || !formData.expected_return_date) {
        toast.error('Please select a date range')
        return
      }

      const response = await fetch('/api/forms/equipment-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_borrower_name: formData.name.trim(),
          external_borrower_org: formData.org.trim(),
          external_borrower_contact: formData.contact.trim(),
          external_borrower_position: formData.position.trim() || undefined,
          assigned_asset_id: formData.asset_id,
          item_description: selectedAsset?.name || formData.asset_id,
          justification: formData.purpose.trim(),
          borrow_start_date: formData.borrowed_date,
          borrow_end_date: formData.expected_return_date,
          notes: formData.notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to submit form')
        return
      }

      setSubmitted(true)
      toast.success('Form submitted successfully!')

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          org: '',
          contact: '',
          position: '',
          asset_id: '',
          purpose: '',
          borrowed_date: today,
          expected_return_date: '',
          notes: '',
        })
        setEquipSearch('')
        setSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your equipment checkout request has been submitted successfully.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Next Steps:</strong> Our team will review your request and contact you at <strong>{formData.contact}</strong> to confirm.
            </p>
          </div>
          <p className="text-xs text-gray-500">Redirecting in 2 seconds...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Monitor className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Checkout</h1>
          <p className="text-gray-600">Request to borrow equipment from IBON International</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Borrower Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g., Juan dela Cruz"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Organization / Institution"
                  required
                  placeholder="e.g., DSWD Region III"
                  value={formData.org}
                  onChange={e => setFormData(p => ({ ...p, org: e.target.value }))}
                />
                <Input
                  label="Contact (Phone or Email)"
                  required
                  placeholder="e.g., 09XX-XXX-XXXX or name@email.com"
                  value={formData.contact}
                  onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                />
                <Input
                  label="Position / Role"
                  placeholder="e.g., Program Officer"
                  value={formData.position}
                  onChange={e => setFormData(p => ({ ...p, position: e.target.value }))}
                />
              </div>
            </div>

            {/* Equipment Selection */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Equipment Details</h2>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Equipment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={equipSearch}
                  onChange={e => {
                    setEquipSearch(e.target.value)
                    setEquipOpen(true)
                  }}
                  onFocus={() => setEquipOpen(true)}
                  placeholder="Search by name or category..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {equipOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAssets.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No equipment available</div>
                    ) : (
                      filteredAssets.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => selectAsset(a)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 ${
                            formData.asset_id === a.id ? 'bg-green-100 text-green-700 font-medium' : ''
                          }`}
                        >
                          {a.name}
                          {a.asset_tag && <span className="text-xs text-gray-500 ml-2">({a.asset_tag})</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Field research, Training workshop"
                  value={formData.purpose}
                  onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Borrow Dates</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.borrowed_date}
                    readOnly
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Return <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.expected_return_date}
                    readOnly
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCalendar(!showCalendar)
                  setSelectingEnd(false)
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
              </button>

              {showCalendar && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-gray-200 rounded">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      {selectingEnd ? 'Select End Date' : 'Select Start Date'}
                    </span>
                    <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-gray-200 rounded">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {renderCalendar()}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="border-t pt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Form Submission</p>
                <p className="text-xs">Your request will be reviewed by our team. You'll receive a confirmation email at the contact address provided.</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>IBON International • Equipment Checkout Form</p>
        </div>
      </div>
    </div>
  )
}
