'use client'

import { useState } from 'react'
import { Building2, UserCheck, RotateCcw, History, Plus, Search } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '@/components/ui'
import { useAssetRequests, useMarkEquipmentReturned, useAssets, useCreateAssetRequest, useFulfillAssetRequest } from '@/hooks/useAssets'
import { useEmployees } from '@/hooks'
import type { AssetRequest } from '@/services/asset.service'
import { formatDate, localDateStr } from '@/lib/utils'

const BORROWER_FILTER_OPTIONS = [
  { value: '', label: 'All Borrowers' },
  { value: 'employee', label: 'Employee' },
  { value: 'external', label: 'External / Partner' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Records' },
  { value: 'active', label: 'Currently Borrowed' },
  { value: 'returned', label: 'Returned' },
]

export default function BorrowedEquipmentPage() {
  const [borrowerFilter, setBorrowerFilter] = useState<'' | 'employee' | 'external'>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'returned' | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [returnModal, setReturnModal] = useState<{ open: boolean; req: AssetRequest | null }>({
    open: false,
    req: null,
  })
  const [returnNotes, setReturnNotes] = useState('')
  const [historyModal, setHistoryModal] = useState<{ open: boolean; assetId: string | null; assetName: string }>({ open: false, assetId: null, assetName: '' })
  const [manualModal, setManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    borrowerType: 'employee' as 'employee' | 'external',
    employee_id: '',
    external_name: '',
    external_org: '',
    asset_id: '',
    purpose: '',
    borrow_start_date: localDateStr(new Date()),
    borrow_end_date: '',
  })
  const [manualError, setManualError] = useState('')

  // Fetch only fulfilled requests (equipment that was given out)
  const { data: requests = [], isLoading } = useAssetRequests({ status: 'fulfilled' })
  const markReturnedMutation = useMarkEquipmentReturned()
  const createRequestMutation = useCreateAssetRequest()
  const fulfillRequestMutation = useFulfillAssetRequest()
  const { data: employees = [] } = useEmployees()
  const employeeMap = Object.fromEntries(employees.map(e => [e.id, `${e.first_name} ${e.last_name}`]))
  const { data: allAssets = [] } = useAssets({})
  const assetTagMap = Object.fromEntries(allAssets.map(a => [a.id, a.asset_tag || '']))

  const filtered = requests.filter(r => {
    const isReturned = !!(r as any).returned_date
    if (statusFilter === 'active' && isReturned) return false
    if (statusFilter === 'returned' && !isReturned) return false
    if (borrowerFilter) {
      const bt = (r as any).borrower_type || 'employee'
      if (bt !== borrowerFilter) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const empName = employeeMap[(r as any).employee_id]?.toLowerCase() || ''
      const extName = ((r as any).external_borrower_name || '').toLowerCase()
      const extOrg  = ((r as any).external_borrower_org  || '').toLowerCase()
      const item    = (r.item_description || '').toLowerCase()
      const tag     = (assetTagMap[(r as any).assigned_asset_id] || '').toLowerCase()
      if (!empName.includes(q) && !extName.includes(q) && !extOrg.includes(q) && !item.includes(q) && !tag.includes(q)) return false
    }
    return true
  })

  const activeCount = requests.filter(r => !(r as any).returned_date).length
  const overdueCount = requests.filter(r => {
    if ((r as any).returned_date) return false
    const endDate = r.borrow_end_date
    if (!endDate) return false
    return new Date(endDate) < new Date(new Date().toISOString().split('T')[0])
  }).length

  function getBorrowerDisplay(r: AssetRequest) {
    const bt = (r as any).borrower_type || 'employee'
    if (bt === 'external') {
      return (
        <div className="flex items-start gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {(r as any).external_borrower_name || '—'}
            </p>
            <p className="text-xs text-gray-500">{(r as any).external_borrower_org || 'External'}</p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-start gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {employeeMap[(r as any).employee_id] || '—'}
          </p>
          <p className="text-xs text-gray-500">Internal</p>
        </div>
      </div>
    )
  }

  async function handleConfirmReturn() {
    if (!returnModal.req) return
    await markReturnedMutation.mutateAsync({ id: returnModal.req.id, notes: returnNotes || undefined })
    setReturnModal({ open: false, req: null })
    setReturnNotes('')
  }

  async function handleManualSubmit() {
    setManualError('')
    const asset = allAssets.find(a => a.id === manualForm.asset_id)
    if (!manualForm.asset_id || !asset) { setManualError('Please select an asset.'); return }
    if (manualForm.borrowerType === 'employee' && !manualForm.employee_id) { setManualError('Please select an employee.'); return }
    if (manualForm.borrowerType === 'external' && !manualForm.external_name.trim()) { setManualError('Please enter the borrower name.'); return }
    if (!manualForm.borrow_start_date) { setManualError('Please enter a borrow date.'); return }

    // Step 1: create the request as 'pending'
    const created = await createRequestMutation.mutateAsync({
      asset_id: manualForm.asset_id,
      item_description: asset.name,
      justification: manualForm.purpose || null,
      priority: 'normal',
      status: 'pending',
      requested_date: manualForm.borrow_start_date,
      borrow_start_date: manualForm.borrow_start_date,
      borrow_end_date: manualForm.borrow_end_date || null,
      borrower_type: manualForm.borrowerType,
      employee_id: manualForm.borrowerType === 'employee' ? manualForm.employee_id || null : null,
      external_borrower_name: manualForm.borrowerType === 'external' ? manualForm.external_name : null,
      external_borrower_org: manualForm.borrowerType === 'external' ? manualForm.external_org || null : null,
    })

    // Step 2: fulfill it — this sets asset_requests.status = 'fulfilled' AND assets.status = 'assigned'
    await fulfillRequestMutation.mutateAsync({ id: created.id, assetId: manualForm.asset_id })

    // Step 3: patch the fulfilled_date and borrow_start_date to the actual borrow date (fulfill() uses today)
    if (manualForm.borrow_start_date !== localDateStr(new Date())) {
      await fetch(`/api/admin/asset-requests/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfilled_date: manualForm.borrow_start_date,
          borrow_start_date: manualForm.borrow_start_date,
        }),
      }).catch(() => null) // best-effort date correction
    }

    setManualModal(false)
    setManualForm({ borrowerType: 'employee', employee_id: '', external_name: '', external_org: '', asset_id: '', purpose: '', borrow_start_date: localDateStr(new Date()), borrow_end_date: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Borrowed Equipment</h1>
          <p className="text-gray-600 mt-1">Track all equipment currently checked out or previously returned</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-sm">
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
              {activeCount} Currently Out
            </div>
            {overdueCount > 0 && (
              <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                {overdueCount} Overdue
              </div>
            )}
          </div>
          <Button onClick={() => setManualModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Borrow
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search borrower, item, tag…"
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
            className={`px-4 py-2 text-sm rounded-lg border font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <select
          value={borrowerFilter}
          onChange={e => setBorrowerFilter(e.target.value as typeof borrowerFilter)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ml-auto"
        >
          {BORROWER_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Borrower</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Equipment</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Asset Tag</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Purpose</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date Borrowed</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Expected Return</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date Returned</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => {
                  const isReturned = !!(r as any).returned_date
                  const bt = (r as any).borrower_type || 'employee'
                  const fulfilledDate = (r as any).fulfilled_date || r.requested_date
                  const isOverdue =
                    !isReturned &&
                    r.borrow_end_date &&
                    new Date(r.borrow_end_date) < new Date(new Date().toISOString().split('T')[0])

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {getBorrowerDisplay(r)}
                          {bt === 'external' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">
                              External
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{r.item_description}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {assetTagMap[(r as any).assigned_asset_id] || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">
                        {r.justification || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {fulfilledDate ? formatDate(fulfilledDate) : '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {r.borrow_end_date ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {formatDate(r.borrow_end_date)}
                            {isOverdue && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-semibold">OVERDUE</span>}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {isReturned ? (
                          <span className="text-green-700">{formatDate((r as any).returned_date)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isReturned ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            With Borrower
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-700 px-2 py-1 rounded hover:bg-gray-100"
                            onClick={() => setHistoryModal({ open: true, assetId: (r as any).assigned_asset_id || r.asset_id || null, assetName: r.item_description || '' })}
                            title="View borrow history for this item"
                          >
                            <History className="w-3.5 h-3.5" />
                            History
                          </button>
                          {!isReturned && (
                            <Button
                              variant="secondary"
                              className="text-xs py-1 px-3 h-auto inline-flex items-center gap-1.5"
                              onClick={() => setReturnModal({ open: true, req: r })}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Mark Returned
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manual Borrow Modal */}
      <Modal open={manualModal} onClose={() => { setManualModal(false); setManualError('') }}>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            Log Manual Borrow
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Borrower type toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Borrower Type</label>
              <div className="flex gap-2">
                {(['employee', 'external'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setManualForm(f => ({ ...f, borrowerType: t }))}
                    className={`px-4 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                      manualForm.borrowerType === t
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {t === 'employee' ? 'Employee' : 'External / Partner'}
                  </button>
                ))}
              </div>
            </div>

            {/* Borrower */}
            {manualForm.borrowerType === 'employee' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <select
                  value={manualForm.employee_id}
                  onChange={e => setManualForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select employee…</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <Input value={manualForm.external_name} onChange={e => setManualForm(f => ({ ...f, external_name: e.target.value }))} placeholder="e.g. John Dugan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <Input value={manualForm.external_org} onChange={e => setManualForm(f => ({ ...f, external_org: e.target.value }))} placeholder="e.g. Partner NGO" />
                </div>
              </div>
            )}

            {/* Asset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment <span className="text-red-500">*</span></label>
              <select
                value={manualForm.asset_id}
                onChange={e => setManualForm(f => ({ ...f, asset_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select asset…</option>
                {allAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}{a.asset_tag ? ` (${a.asset_tag})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Borrowed <span className="text-red-500">*</span></label>
                <Input type="date" value={manualForm.borrow_start_date} onChange={e => setManualForm(f => ({ ...f, borrow_start_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return</label>
                <Input type="date" value={manualForm.borrow_end_date} onChange={e => setManualForm(f => ({ ...f, borrow_end_date: e.target.value }))} />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Notes</label>
              <Input value={manualForm.purpose} onChange={e => setManualForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Field documentation" />
            </div>

            {manualError && <p className="text-sm text-red-600">{manualError}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setManualModal(false); setManualError('') }}>Cancel</Button>
          <Button
            onClick={handleManualSubmit}
            disabled={createRequestMutation.isPending || fulfillRequestMutation.isPending}
          >
            {(createRequestMutation.isPending || fulfillRequestMutation.isPending) ? 'Saving…' : 'Log Borrow'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* History Modal */}
      <Modal open={historyModal.open} onClose={() => setHistoryModal({ open: false, assetId: null, assetName: '' })}>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-green-600" />
            Borrow History — {historyModal.assetName}
          </div>
        </ModalHeader>
        <ModalBody>
          {(() => {
            const history = requests
              .filter(r => {
                const aid = (r as any).assigned_asset_id || r.asset_id
                return aid === historyModal.assetId
              })
              .sort((a, b) => {
                const aDate = (a as any).fulfilled_date || a.requested_date || ''
                const bDate = (b as any).fulfilled_date || b.requested_date || ''
                return bDate.localeCompare(aDate)
              })
            if (history.length === 0) {
              return <p className="text-sm text-gray-400 text-center py-4">No borrow history found for this item.</p>
            }
            return (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">{history.length} borrow record{history.length !== 1 ? 's' : ''} found</p>
                {history.map((r, i) => {
                  const isReturned = !!(r as any).returned_date
                  const bt = (r as any).borrower_type || 'employee'
                  const borrowerName = bt === 'external'
                    ? ((r as any).external_borrower_name || 'External')
                    : (employeeMap[(r as any).employee_id] || '—')
                  const borrowerSub = bt === 'external'
                    ? ((r as any).external_borrower_org || 'External')
                    : 'Internal Employee'
                  const fulfilledDate = (r as any).fulfilled_date || r.requested_date
                  const isOverdueH = !isReturned && r.borrow_end_date &&
                    new Date(r.borrow_end_date) < new Date(new Date().toISOString().split('T')[0])
                  return (
                    <div key={r.id} className={`p-3.5 rounded-lg border text-sm ${
                      isReturned ? 'bg-green-50 border-green-200' :
                      isOverdueH ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {bt === 'external' ? <Building2 className="w-3.5 h-3.5 text-blue-500" /> : <UserCheck className="w-3.5 h-3.5 text-green-600" />}
                            <span className="font-medium text-gray-900">{borrowerName}</span>
                            <span className="text-xs text-gray-400">{borrowerSub}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.justification || 'No purpose stated'}</p>
                          {(r as any).return_notes && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">Return note: {(r as any).return_notes}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                          isReturned ? 'bg-green-100 text-green-700' :
                          isOverdueH ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isReturned ? 'Returned' : isOverdueH ? 'Overdue' : 'With Borrower'}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Borrowed: <strong className="text-gray-700">{fulfilledDate ? formatDate(fulfilledDate) : '—'}</strong></span>
                        {r.borrow_end_date && <span>Due: <strong className={isOverdueH ? 'text-red-600' : 'text-gray-700'}>{formatDate(r.borrow_end_date)}</strong></span>}
                        {isReturned && <span>Returned: <strong className="text-green-700">{formatDate((r as any).returned_date)}</strong></span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setHistoryModal({ open: false, assetId: null, assetName: '' })}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* Return Modal */}
      <Modal open={returnModal.open} onClose={() => setReturnModal({ open: false, req: null })}>
        <ModalHeader>Mark Equipment as Returned</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            Confirm that{' '}
            <strong>
              {returnModal.req?.item_description}
            </strong>{' '}
            has been returned.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Return Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={returnNotes}
            onChange={e => setReturnNotes(e.target.value)}
            placeholder="e.g. Item returned in good condition"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReturnModal({ open: false, req: null })}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmReturn}
            disabled={markReturnedMutation.isPending}
          >
            {markReturnedMutation.isPending ? 'Saving…' : 'Confirm Return'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
