'use client'

import { useState } from 'react'
import { Building2, UserCheck, RotateCcw } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useAssetRequests, useMarkEquipmentReturned } from '@/hooks/useAssets'
import type { AssetRequest } from '@/services/asset.service'
import { formatDate } from '@/lib/utils'

const BORROWER_FILTER_OPTIONS = [
  { value: '', label: 'All Borrowers' },
  { value: 'employee', label: 'Employee' },
  { value: 'external', label: 'External / Partner' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Currently Borrowed' },
  { value: 'returned', label: 'Returned' },
  { value: '', label: 'All' },
]

export default function BorrowedEquipmentPage() {
  const [borrowerFilter, setBorrowerFilter] = useState<'' | 'employee' | 'external'>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'returned' | ''>('active')
  const [returnModal, setReturnModal] = useState<{ open: boolean; req: AssetRequest | null }>({
    open: false,
    req: null,
  })
  const [returnNotes, setReturnNotes] = useState('')

  // Fetch only fulfilled requests (equipment that was given out)
  const { data: requests = [], isLoading } = useAssetRequests({ status: 'fulfilled' })
  const markReturnedMutation = useMarkEquipmentReturned()

  const filtered = requests.filter(r => {
    const isReturned = !!(r as any).returned_date
    if (statusFilter === 'active' && isReturned) return false
    if (statusFilter === 'returned' && !isReturned) return false
    if (borrowerFilter) {
      const bt = (r as any).borrower_type || 'employee'
      if (bt !== borrowerFilter) return false
    }
    return true
  })

  const activeCount = requests.filter(r => !(r as any).returned_date).length
  const overdueCount = requests.filter(r => {
    if ((r as any).returned_date) return false
    // Consider overdue if fulfilled more than 30 days ago with no return
    const fulfilled = (r as any).fulfilled_date
    if (!fulfilled) return false
    return new Date(fulfilled) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
            {(r as any).employee
              ? `${(r as any).employee.first_name} ${(r as any).employee.last_name}`
              : 'Employee'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Borrowed Equipment</h1>
          <p className="text-gray-600 mt-1">Track all equipment currently checked out or previously returned</p>
        </div>
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Purpose</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date Borrowed</th>
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
                    fulfilledDate &&
                    new Date(fulfilledDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

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
                      <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">
                        {r.justification || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {fulfilledDate ? formatDate(fulfilledDate) : '—'}
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
