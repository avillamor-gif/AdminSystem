'use client'

import { useState } from 'react'
import { Building2, UserCheck, Eye, CalendarDays, CheckCircle2 } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  useAssetRequests,
  useApproveAssetRequest,
  useRejectAssetRequest,
  useFulfillAssetRequest,
  useAssets,
} from '@/hooks/useAssets'
import { useCurrentEmployee, useEmployees } from '@/hooks/useEmployees'
import type { AssetRequest } from '@/services/asset.service'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  fulfilled: 'Fulfilled',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-green-100 text-green-800',
}

export default function EquipmentRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | 'employee' | 'external'>('')
  const [rejectModal, setRejectModal] = useState<{ open: boolean; req: AssetRequest | null }>({ open: false, req: null })
  const [rejectReason, setRejectReason] = useState('')
  const [viewModal, setViewModal] = useState<{ open: boolean; req: AssetRequest | null }>({ open: false, req: null })
  const [fulfillModal, setFulfillModal] = useState<{ open: boolean; req: AssetRequest | null }>({ open: false, req: null })

  const { data: requests = [], isLoading } = useAssetRequests(statusFilter ? { status: statusFilter } : {})
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: employees = [] } = useEmployees()

  // Map employee records onto requests (avoids aliased FK join which breaks Supabase schema cache)
  const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]))
  const enrichedRequests = requests.map(r => ({
    ...r,
    employee: r.employee_id ? (employeeMap[r.employee_id] ?? null) : null,
  }))
  const approveMutation = useApproveAssetRequest()
  const rejectMutation = useRejectAssetRequest()
  const fulfillMutation = useFulfillAssetRequest()
  // Available assets for the fulfill modal asset lookup
  const { data: allAssets = [] } = useAssets({})

  const filtered = enrichedRequests.filter(r => {
    if (!typeFilter) return true
    const bt = (r as any).borrower_type || 'employee'
    return bt === typeFilter
  })

  function borrowerDisplay(r: AssetRequest) {
    const bt = (r as any).borrower_type || 'employee'
    if (bt === 'external') {
      return (
        <div className="flex items-start gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{(r as any).external_borrower_name || '—'}</p>
            <p className="text-xs text-gray-500">{(r as any).external_borrower_org || ''}</p>
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
              : '—'}
          </p>
          <p className="text-xs text-gray-500">Internal</p>
        </div>
      </div>
    )
  }

  async function handleApprove(r: AssetRequest) {
    if (!currentEmployee?.id) return
    await approveMutation.mutateAsync({ id: r.id, approvedBy: currentEmployee.id })
  }

  async function handleRejectConfirm() {
    if (!rejectModal.req || !currentEmployee?.id) return
    await rejectMutation.mutateAsync({ id: rejectModal.req.id, approvedBy: currentEmployee.id, reason: rejectReason })
    setRejectModal({ open: false, req: null })
    setRejectReason('')
  }

  async function handleFulfill(r: AssetRequest) {
    // assigned_asset_id may or may not be set; service handles both cases safely
    await fulfillMutation.mutateAsync({ id: r.id, assetId: r.assigned_asset_id ?? undefined })
    setFulfillModal({ open: false, req: null })
  }

  const pendingCount = enrichedRequests.filter(r => r.status === 'pending').length
  const externalCount = enrichedRequests.filter(r => (r as any).borrower_type === 'external').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage equipment checkout requests</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 font-medium">
            {pendingCount} Pending
          </div>
          {externalCount > 0 && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
              {externalCount} External
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as '' | 'employee' | 'external')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Borrowers</option>
          <option value="employee">Employee</option>
          <option value="external">External / Partner</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Borrower</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Equipment</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Purpose</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Borrow Period</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => {
                  const bt = (r as any).borrower_type || 'employee'
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {borrowerDisplay(r)}
                          {bt === 'external' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">
                              External
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{r.item_description}</td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{r.justification || '—'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {r.borrow_start_date ? (
                          <div className="flex items-center gap-1 text-xs text-gray-700">
                            <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{r.borrow_start_date}</span>
                            <span className="text-gray-400">→</span>
                            <span>{r.borrow_end_date ?? 'TBD'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{r.requested_date}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[r.status ?? 'pending'] ?? r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewModal({ open: true, req: r })}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'pending' && (
                            <>
                              <Button
                                variant="secondary"
                                className="text-xs py-1 px-3 h-auto"
                                disabled={approveMutation.isPending}
                                onClick={() => handleApprove(r)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="text-xs py-1 px-3 h-auto"
                                onClick={() => { setRejectModal({ open: true, req: r }); setRejectReason('') }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <Button
                              variant="primary"
                              className="text-xs py-1 px-3 h-auto"
                              disabled={fulfillMutation.isPending}
                              onClick={() => setFulfillModal({ open: true, req: r })}
                            >
                              Mark Fulfilled
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

      {/* View Detail Modal */}
      {viewModal.open && viewModal.req && (
        <Modal open onClose={() => setViewModal({ open: false, req: null })}>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
          </ModalHeader>
          <ModalBody>
            {(() => {
              const r = viewModal.req!
              const bt = (r as any).borrower_type || 'employee'
              return (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-2">
                    {bt === 'external' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        <Building2 className="w-3.5 h-3.5" /> External / Partner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> Employee
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status ?? 'pending']}`}>
                      {STATUS_LABELS[r.status ?? 'pending']}
                    </span>
                  </div>

                  {bt === 'external' ? (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div><p className="text-gray-500 text-xs">Name</p><p className="font-medium text-gray-900">{(r as any).external_borrower_name || '—'}</p></div>
                      <div><p className="text-gray-500 text-xs">Organization</p><p className="font-medium text-gray-900">{(r as any).external_borrower_org || '—'}</p></div>
                      <div><p className="text-gray-500 text-xs">Contact</p><p className="font-medium text-gray-900">{(r as any).external_borrower_contact || '—'}</p></div>
                      <div><p className="text-gray-500 text-xs">Position</p><p className="font-medium text-gray-900">{(r as any).external_borrower_position || '—'}</p></div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 text-xs mb-1">Employee</p>
                      <p className="font-medium text-gray-900">
                        {(r as any).employee
                          ? `${(r as any).employee.first_name} ${(r as any).employee.last_name}`
                          : '(Employee record not loaded)'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-gray-500 text-xs">Equipment</p><p className="font-medium text-gray-900">{r.item_description}</p></div>
                    <div><p className="text-gray-500 text-xs">Priority</p><p className="font-medium text-gray-900 capitalize">{r.priority}</p></div>
                    <div><p className="text-gray-500 text-xs">Purpose</p><p className="font-medium text-gray-900">{r.justification || '—'}</p></div>
                    <div><p className="text-gray-500 text-xs">Requested Date</p><p className="font-medium text-gray-900">{r.requested_date}</p></div>
                  </div>

                  {r.notes && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">{r.notes}</p>
                    </div>
                  )}

                  {r.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                      <p className="text-red-800 text-sm">{r.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setViewModal({ open: false, req: null })}>Close</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Fulfill Confirmation Modal */}
      {fulfillModal.open && fulfillModal.req && (() => {
        const r = fulfillModal.req!
        const linkedAsset = allAssets.find(a => a.id === (r as any).asset_id)
        return (
          <Modal open onClose={() => setFulfillModal({ open: false, req: null })}>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Fulfillment</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4 text-sm">
                <p className="text-gray-600">
                  You are about to mark this request as <span className="font-semibold text-green-700">Fulfilled</span>. The equipment will be recorded as handed out.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div><span className="text-gray-500 text-xs">Item Requested</span><p className="font-medium text-gray-900">{r.item_description}</p></div>
                  {linkedAsset && (
                    <div><span className="text-gray-500 text-xs">Asset Record</span>
                      <p className="font-medium text-gray-900">{linkedAsset.name}{linkedAsset.asset_tag ? ` · ${linkedAsset.asset_tag}` : ''}</p>
                    </div>
                  )}
                  {r.borrow_start_date && (
                    <div><span className="text-gray-500 text-xs">Borrow Period</span>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {r.borrow_start_date} → {r.borrow_end_date ?? 'TBD'}
                      </p>
                    </div>
                  )}
                </div>
                {!linkedAsset && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No specific asset was linked to this request. Asset availability will not be automatically updated.
                  </p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setFulfillModal({ open: false, req: null })}>Cancel</Button>
              <Button
                variant="primary"
                disabled={fulfillMutation.isPending}
                onClick={() => handleFulfill(r)}
              >
                {fulfillMutation.isPending ? 'Marking…' : 'Confirm Fulfilled'}
              </Button>
            </ModalFooter>
          </Modal>
        )
      })()}

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <Modal open onClose={() => setRejectModal({ open: false, req: null })}>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-gray-900">Reject Request</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason for rejecting <strong>{rejectModal.req?.item_description}</strong>.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, req: null })}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={handleRejectConfirm}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject Request'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
