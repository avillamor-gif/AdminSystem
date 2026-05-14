'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Monitor, Search, X, CheckCircle, ChevronDown, UserCheck, Building2, AlertTriangle, CalendarX, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useAssets, useAssetCategories, useCreateAssetRequest } from '@/hooks/useAssets'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { localDateStr } from '@/lib/utils'
import { assetRequestService, type Asset, type AssetRequest } from '@/services/asset.service'
import toast from 'react-hot-toast'

interface CheckoutFormData {
  asset_id: string
  purpose: string
  borrowed_date: string
  expected_return_date: string
  notes: string
}

interface ExternalBorrowerData {
  name: string
  org: string
  contact: string
  position: string
}

const today = localDateStr(new Date())

// ── Availability Calendar ──────────────────────────────────────────────────
interface BookedRange { start: string; end: string }

function AvailabilityCalendar({
  bookings,
  startDate,
  endDate,
  onRangeChange,
}: {
  bookings: AssetRequest[]
  startDate: string
  endDate: string
  onRangeChange: (start: string, end: string) => void
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [firstClick, setFirstClick] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)

  const bookedRanges: BookedRange[] = bookings
    .map(b => ({ start: b.borrow_start_date ?? '', end: b.borrow_end_date ?? b.borrow_start_date ?? '' }))
    .filter(r => r.start)

  function isBooked(d: string) {
    return bookedRanges.some(r => d >= r.start && d <= r.end)
  }

  function isInSelection(d: string) {
    const anchor = firstClick || startDate
    const cursor = hoverDate || endDate
    if (!anchor || !cursor) return false
    const [lo, hi] = anchor <= cursor ? [anchor, cursor] : [cursor, anchor]
    return d >= lo && d <= hi
  }

  function isEndpoint(d: string) {
    return d === startDate || d === endDate
  }

  function handleClick(d: string) {
    if (d < today || isBooked(d)) return
    if (!firstClick) {
      // First click — set anchor
      setFirstClick(d)
      onRangeChange(d, '')
    } else {
      // Second click — finalise range
      const [s, e] = firstClick <= d ? [firstClick, d] : [d, firstClick]
      setFirstClick(null)
      setHoverDate(null)
      onRangeChange(s, e)
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Second displayed month
  const m2month = viewMonth === 11 ? 0 : viewMonth + 1
  const m2year  = viewMonth === 11 ? viewYear + 1 : viewYear

  function renderMonth(year: number, month: number) {
    const label = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth  = new Date(year, month + 1, 0).getDate()
    const cells: React.ReactNode[] = []

    for (let i = 0; i < firstWeekday; i++) cells.push(<div key={`pad-${i}`} />)

    for (let day = 1; day <= daysInMonth; day++) {
      const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const past   = d < today
      const booked = isBooked(d)
      const inSel  = isInSelection(d)
      const endpt  = isEndpoint(d)

      let cls = 'h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors select-none '
      if (past) {
        cls += 'text-gray-300 cursor-not-allowed'
      } else if (booked) {
        cls += 'bg-red-100 text-red-500 cursor-not-allowed line-through'
      } else if (endpt) {
        cls += 'bg-green-600 text-white cursor-pointer shadow'
      } else if (inSel) {
        cls += 'bg-green-100 text-green-700 cursor-pointer'
      } else {
        cls += 'text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer'
      }

      cells.push(
        <div
          key={d}
          className={cls}
          onClick={() => handleClick(d)}
          onMouseEnter={() => firstClick && !past && !booked && setHoverDate(d)}
          onMouseLeave={() => firstClick && setHoverDate(null)}
        >
          {day}
        </div>
      )
    }

    return (
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 text-center mb-2">{label}</p>
        <div className="grid grid-cols-7 gap-y-0.5 gap-x-0 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(h => (
            <div key={h} className="text-[10px] font-medium text-gray-400 py-1">{h}</div>
          ))}
          {cells}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50/60">
        <p className="text-xs font-semibold text-gray-700">Availability Calendar</p>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-200 border border-red-300" /> Booked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-400" /> Your selection
          </span>
          {firstClick && (
            <span className="text-green-600 font-medium animate-pulse">Click an end date…</span>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex items-start gap-2 px-4 py-3">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 mt-5">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-6 flex-1 overflow-hidden">
          {renderMonth(viewYear, viewMonth)}
          {renderMonth(m2year, m2month)}
        </div>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 mt-5">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selected range footer */}
      {(startDate || endDate) && (
        <div className="px-4 py-2 border-t bg-green-50 text-xs text-center text-green-800">
          {startDate && endDate
            ? <>Borrow: <strong>{startDate}</strong> → <strong>{endDate}</strong></>
            : <>Start date: <strong>{startDate || endDate}</strong> — select an end date</>
          }
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
function CheckoutPageInner() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('asset') ?? ''

  const [borrowerType, setBorrowerType] = useState<'employee' | 'external'>('employee')
  const [formData, setFormData] = useState<CheckoutFormData>({
    asset_id: preselectedId,
    purpose: '',
    borrowed_date: today,
    expected_return_date: '',
    notes: '',
  })
  const [external, setExternal] = useState<ExternalBorrowerData>({
    name: '',
    org: '',
    contact: '',
    position: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [conflicts, setConflicts] = useState<AssetRequest[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  // Active borrows on the selected asset (regardless of chosen dates) — shown immediately on asset select
  const [activeBookings, setActiveBookings] = useState<AssetRequest[]>([])
  const [checkingActive, setCheckingActive] = useState(false)

  // Equipment search combobox state
  const [equipSearch, setEquipSearch] = useState('')
  const [equipOpen, setEquipOpen] = useState(false)
  const equipRef = useRef<HTMLDivElement>(null)

  // If the URL changes (e.g. user navigates from browse with a different asset)
  useEffect(() => {
    if (preselectedId) {
      setFormData(p => ({ ...p, asset_id: preselectedId }))
    }
  }, [preselectedId])

  const { data: availableAssets = [] } = useAssets({ status: 'available' })
  const { data: assignedAssets = [] } = useAssets({ status: 'assigned' })
  const assets = [...availableAssets, ...assignedAssets].filter(a => (a as any).borrowable_by && (a as any).borrowable_by !== 'none')
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateAssetRequest()

  const employeeName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
    : '—'

  const selectedAsset = assets.find(a => a.id === formData.asset_id) as
    | (Asset & { category?: { name: string }; brand?: { name: string } })
    | undefined

  // Sync search label when asset is preselected or changed externally
  useEffect(() => {
    if (selectedAsset) {
      setEquipSearch(selectedAsset.name)
    }
  }, [selectedAsset?.id])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (equipRef.current && !equipRef.current.contains(e.target as Node)) {
        setEquipOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Availability conflict check — runs whenever asset + both dates are set
  useEffect(() => {
    const assetId = formData.asset_id
    if (!assetId) { setActiveBookings([]); return }
    let cancelled = false
    setCheckingActive(true)
    // Check a wide window (today → 2 years out) to surface ANY active borrow
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 2)
    assetRequestService.checkAvailability(assetId, today, farFuture.toISOString().split('T')[0])
      .then(async result => {
        if (cancelled) return
        setActiveBookings(result)
        if (result.length > 0) {
          const next = await assetRequestService.getNextAvailableDate(assetId).catch(() => null)
          if (!cancelled) setNextAvailableDate(next)
        } else {
          setNextAvailableDate(null)
        }
      })
      .catch(() => { if (!cancelled) { setActiveBookings([]); setNextAvailableDate(null) } })
      .finally(() => { if (!cancelled) setCheckingActive(false) })
    return () => { cancelled = true }
  }, [formData.asset_id])

  // Date-specific conflict check — runs whenever asset + both dates are set
  useEffect(() => {
    const assetId = formData.asset_id
    const start = formData.borrowed_date
    const end = formData.expected_return_date
    if (!assetId || !start || !end) { setConflicts([]); return }
    let cancelled = false
    setCheckingAvailability(true)
    assetRequestService.checkAvailability(assetId, start, end)
      .then(async result => {
        if (cancelled) return
        setConflicts(result)
        if (result.length > 0) {
          const next = await assetRequestService.getNextAvailableDate(assetId).catch(() => null)
          if (!cancelled) setNextAvailableDate(next)
        } else {
          setNextAvailableDate(null)
        }
      })
      .catch(() => { if (!cancelled) { setConflicts([]); setNextAvailableDate(null) } })
      .finally(() => { if (!cancelled) setCheckingAvailability(false) })
    return () => { cancelled = true }
  }, [formData.asset_id, formData.borrowed_date, formData.expected_return_date])

  // Filtered asset list based on search input
  const filteredAssets = assets.filter(a => {
    const q = equipSearch.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.asset_tag?.toLowerCase().includes(q) ||
      (a as any).category?.name?.toLowerCase().includes(q)
    )
  })

  function selectAsset(a: Asset) {
    setFormData(p => ({ ...p, asset_id: a.id }))
    setEquipSearch(a.name)
    setEquipOpen(false)
  }

  function resetForm() {
    setFormData({ asset_id: '', purpose: '', borrowed_date: today, expected_return_date: '', notes: '' })
    setExternal({ name: '', org: '', contact: '', position: '' })
    setEquipSearch('')
    setConflicts([])
    setNextAvailableDate(null)
    setActiveBookings([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (borrowerType === 'employee' && !currentEmployee?.id) {
      toast.error('Could not determine your employee profile.')
      return
    }
    if (borrowerType === 'external') {
      if (!external.name.trim()) { toast.error('Please enter the external borrower\'s name.'); return }
      if (!external.org.trim()) { toast.error('Please enter the borrower\'s organization.'); return }
      if (!external.contact.trim()) { toast.error('Please enter a contact number or email.'); return }
    }
    if (!formData.asset_id) { toast.error('Please select an equipment item.'); return }
    if (!formData.purpose.trim()) { toast.error('Please provide a purpose.'); return }
    if (!formData.expected_return_date) { toast.error('Please provide an expected return date.'); return }

    const notesText = [`Expected return: ${formData.expected_return_date}`, formData.notes.trim()]
      .filter(Boolean).join('\n')

    if (borrowerType === 'employee') {
      await createMutation.mutateAsync({
        employee_id: currentEmployee!.id,
        asset_id: formData.asset_id || undefined,
        borrower_type: 'employee',
        category_id: (selectedAsset as any)?.category_id || undefined,
        item_description: selectedAsset?.name || formData.asset_id,
        justification: formData.purpose.trim(),
        requested_date: formData.borrowed_date,
        borrow_start_date: formData.borrowed_date,
        borrow_end_date: formData.expected_return_date,
        notes: notesText || undefined,
        priority: 'normal',
        status: 'pending',
      } as any)
    } else {
      await createMutation.mutateAsync({
        employee_id: null,
        asset_id: formData.asset_id || undefined,
        borrower_type: 'external',
        external_borrower_name: external.name.trim(),
        external_borrower_org: external.org.trim(),
        external_borrower_contact: external.contact.trim(),
        external_borrower_position: external.position.trim() || undefined,
        category_id: (selectedAsset as any)?.category_id || undefined,
        item_description: selectedAsset?.name || formData.asset_id,
        justification: formData.purpose.trim(),
        requested_date: formData.borrowed_date,
        borrow_start_date: formData.borrowed_date,
        borrow_end_date: formData.expected_return_date,
        notes: notesText || undefined,
        priority: 'normal',
        status: 'pending',
      } as any)
    }

    resetForm()
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Equipment Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Request to borrow a piece of equipment</p>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Checkout request submitted successfully</p>
            <p className="text-xs text-green-600 mt-0.5">Your request is pending approval.</p>
          </div>
          <button className="ml-auto text-green-500 hover:text-green-700 text-xs" onClick={() => setSubmitted(false)}>Dismiss</button>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Borrower Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Borrower Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBorrowerType('employee')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  borrowerType === 'employee'
                    ? 'bg-green-600 border-green-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => setBorrowerType('external')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  borrowerType === 'external'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                <Building2 className="w-4 h-4" />
                External / Partner
              </button>
            </div>
          </div>

          <div className="p-5 border border-gray-200 rounded-xl space-y-5 bg-gray-50/40">

            {/* Borrower Details */}
            {borrowerType === 'employee' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    value={employeeName}
                    disabled
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">External / Partner Borrower Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={external.name}
                      onChange={e => setExternal(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Juan dela Cruz"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Organization / Institution <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={external.org}
                      onChange={e => setExternal(p => ({ ...p, org: e.target.value }))}
                      placeholder="e.g., DSWD Region III"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact (Phone or Email) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={external.contact}
                      onChange={e => setExternal(p => ({ ...p, contact: e.target.value }))}
                      placeholder="e.g., 09XX-XXX-XXXX or name@email.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Position / Role</label>
                    <input
                      type="text"
                      value={external.position}
                      onChange={e => setExternal(p => ({ ...p, position: e.target.value }))}
                      placeholder="e.g., Program Officer"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Equipment search — always shown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div ref={equipRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Equipment <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={equipSearch}
                    onChange={e => { setEquipSearch(e.target.value); setEquipOpen(true); if (!e.target.value) setFormData(p => ({ ...p, asset_id: '' })) }}
                    onFocus={() => setEquipOpen(true)}
                    placeholder="Search by name, tag or category..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {equipSearch ? (
                    <button type="button" onClick={() => { setEquipSearch(''); setFormData(p => ({ ...p, asset_id: '' })); setEquipOpen(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {equipOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filteredAssets.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No equipment found</div>
                    ) : filteredAssets.map(a => {
                      const cat = (a as any).category?.name
                      const cond = a.condition ? a.condition.charAt(0).toUpperCase() + a.condition.slice(1) : ''
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => selectAsset(a)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center justify-between gap-2 ${
                            formData.asset_id === a.id ? 'bg-green-50 font-medium text-green-700' : 'text-gray-800'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{a.name}{a.asset_tag ? ` · ${a.asset_tag}` : ''}</span>
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">{[cat, cond].filter(Boolean).join(' · ')}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected asset details */}
            {selectedAsset && (
              <div className={`p-4 border rounded-lg text-sm ${
                activeBookings.length > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'
              }`}>
                {/* Currently borrowed alert */}
                {checkingActive && (
                  <p className="text-xs text-gray-400 mb-2">Checking current availability…</p>
                )}
                {!checkingActive && activeBookings.length > 0 && (
                  <div className="flex items-start gap-2 mb-3 pb-3 border-b border-red-200">
                    <CalendarX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-800">Currently borrowed — not available</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {activeBookings.map(b => (
                          <li key={b.id} className="text-xs text-red-600">
                            {b.borrow_start_date} → {b.borrow_end_date ?? 'TBD'}
                            {b.external_borrower_name ? ` · ${b.external_borrower_name}` : ''}
                          </li>
                        ))}
                      </ul>
                      {nextAvailableDate && (
                        <p className="text-xs text-green-700 font-medium mt-1">
                          Next available: <span className="font-bold">{nextAvailableDate}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div><span className="text-gray-500">Category: </span><span className="font-medium text-gray-800">{(selectedAsset as any).category?.name || '—'}</span></div>
                  <div><span className="text-gray-500">Location: </span><span className="font-medium text-gray-800">{selectedAsset.location || '—'}</span></div>
                  <div><span className="text-gray-500">Condition: </span><span className="font-medium text-gray-800 capitalize">{selectedAsset.condition || '—'}</span></div>
                  <div><span className="text-gray-500">Status: </span><span className={`font-medium ${
                    activeBookings.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>{activeBookings.length > 0 ? 'Currently Borrowed' : 'Available'}</span></div>
                </div>
              </div>
            )}

            {/* Availability conflict — blocking banner */}
            {conflicts.length > 0 && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <CalendarX className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    This equipment is unavailable for your selected dates.
                  </p>
                  {nextAvailableDate && (
                    <p className="text-xs text-green-700 font-medium mt-0.5">
                      Next available from: <span className="font-bold">{nextAvailableDate}</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAvailabilityModal(true)}
                    className="mt-1.5 text-xs text-red-600 underline hover:text-red-800"
                  >
                    View conflicting bookings
                  </button>
                </div>
              </div>
            )}
            {checkingAvailability && formData.asset_id && formData.borrowed_date && formData.expected_return_date && (
              <p className="text-xs text-gray-400">Checking availability…</p>
            )}

            {/* Availability modal */}
            {showAvailabilityModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                  <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                      <CalendarX className="w-5 h-5 text-red-500" />
                      <h3 className="text-sm font-semibold text-gray-900">Equipment Unavailable</h3>
                    </div>
                    <button type="button" onClick={() => setShowAvailabilityModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{selectedAsset?.name}</span> is already booked during your selected dates:
                    </p>
                    <ul className="space-y-1.5">
                      {conflicts.map(c => (
                        <li key={c.id} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-red-700 font-medium">{c.borrow_start_date} → {c.borrow_end_date ?? 'TBD'}</span>
                          {c.external_borrower_name && (
                            <span className="text-red-500">· {c.external_borrower_name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {nextAvailableDate && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-sm text-green-800">
                          Next available from: <span className="font-bold">{nextAvailableDate}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Please adjust your borrow dates or choose a different item.
                    </p>
                  </div>
                  <div className="px-5 py-3 border-t flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAvailabilityModal(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Calendar — shown as soon as an asset is selected */}
            {formData.asset_id && (
              <AvailabilityCalendar
                bookings={activeBookings}
                startDate={formData.borrowed_date}
                endDate={formData.expected_return_date}
                onRangeChange={(start, end) =>
                  setFormData(p => ({ ...p, borrowed_date: start, expected_return_date: end }))
                }
              />
            )}

            {/* Row 2: Purpose + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))}
                  placeholder="e.g., Business presentation"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Borrow Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.borrowed_date}
                  onChange={e => setFormData(p => ({ ...p, borrowed_date: e.target.value }))}
                  required
                  min={today}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expected Return Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={e => setFormData(p => ({ ...p, expected_return_date: e.target.value }))}
                  required
                  min={formData.borrowed_date || today}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any special requirements or notes..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-gray-500">* Required fields</p>
            <Button type="submit" disabled={createMutation.isPending || conflicts.length > 0} className="px-6">
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function EquipmentCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 text-sm">Loading...</div>}>
      <CheckoutPageInner />
    </Suspense>
  )
}


