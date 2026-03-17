'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Package, Clock, Filter } from 'lucide-react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { notifyRequesterOfDecision } from '@/services/requestNotification.helper'
import { logAction } from '@/services/auditLog.service'
import toast from 'react-hot-toast'

interface Request {
  id: string; request_number: string; employee_id: string | null; item_name: string
  quantity: number; purpose: string | null; priority: string | null; status: string | null
  rejection_reason: string | null; notes: string | null; created_at: string | null
  approved_at: string | null; fulfilled_at: string | null
  employee?: { first_name: string; last_name: string } | null
  item?: { name: string; unit: string | null; quantity_on_hand: number | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

export default function SupplyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Request | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data: reqs, error } = await supabase
      .from('supply_requests').select('*').order('created_at', { ascending: false })
    if (error) { toast.error(error.message || 'Failed to load requests'); return }
    const empIds = [...new Set((reqs ?? []).map((r: Request) => r.employee_id).filter((id): id is string => Boolean(id)))]
    const itemIds = [...new Set((reqs ?? []).map((r: any) => r.item_id).filter((id): id is string => Boolean(id)))]
    const [empRes, itemRes] = await Promise.all([
      empIds.length ? supabase.from('employees').select('id, first_name, last_name').in('id', empIds) : Promise.resolve({ data: [] }),
      itemIds.length ? supabase.from('supply_items').select('id, name, unit, quantity_on_hand').in('id', itemIds) : Promise.resolve({ data: [] }),
    ])
    const empMap = Object.fromEntries((empRes.data ?? []).map((e: any) => [e.id, e]))
    const itemMap = Object.fromEntries((itemRes.data ?? []).map((i: any) => [i.id, i]))
    setRequests((reqs ?? []).map((r: any) => ({ ...r, employee: empMap[r.employee_id] ?? null, item: itemMap[r.item_id] ?? null })))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleAction = async (action: 'approved' | 'rejected' | 'fulfilled') => {
    if (!selected) return
    if (action === 'rejected' && !rejectReason.trim()) { toast.error('Please provide a rejection reason'); return }
    setActionLoading(true)
    const supabase = createClient()
    const updates: any = { status: action }

    if (action === 'approved') {
      updates.approved_at = new Date().toISOString()
      // Decrement stock immediately on approval to reserve items
      if ((selected as any).item_id && selected.item) {
        const newQty = Math.max(0, (selected.item.quantity_on_hand ?? 0) - selected.quantity)
        const { error: stockErr } = await supabase
          .from('supply_items')
          .update({ quantity_on_hand: newQty })
          .eq('id', (selected as any).item_id)
        if (stockErr) { toast.error('Failed to update stock: ' + stockErr.message); setActionLoading(false); return }
        // Warn if stock hit reorder point
        const itemRes = await supabase.from('supply_items').select('quantity_on_hand, reorder_point, name').eq('id', (selected as any).item_id).single()
        if (itemRes.data && (itemRes.data.quantity_on_hand ?? 0) <= (itemRes.data.reorder_point ?? 0)) {
          toast(`⚠️ ${itemRes.data.name} is now low on stock (${itemRes.data.quantity_on_hand ?? 0} remaining)`, { icon: '🔴', duration: 5000 })
        }
      }
    }

    if (action === 'rejected') {
      updates.rejection_reason = rejectReason
      updates.approved_at = new Date().toISOString()
    }

    if (action === 'fulfilled') {
      updates.fulfilled_at = new Date().toISOString()
      // Stock was already decremented at approval — no further change needed
    }

    const { error } = await supabase.from('supply_requests').update(updates).eq('id', selected.id)
    if (error) { toast.error(error.message); setActionLoading(false); return }
    // Log the admin action
    if (selected.employee_id) {
      const actionLabel = action === 'approved' ? 'Supply Request Approved'
        : action === 'rejected' ? 'Supply Request Rejected'
        : 'Supply Request Fulfilled'
      const detail = action === 'rejected'
        ? `${actionLabel}: ${selected.item_name} (ref: ${selected.request_number}) — reason: ${rejectReason}`
        : `${actionLabel}: ${selected.item_name} (qty: ${selected.quantity}, ref: ${selected.request_number})`
      logAction({ employee_id: selected.employee_id, action: actionLabel, details: detail })
    }
    // Notify the requester of the decision
    if (action === 'approved' || action === 'rejected' || action === 'fulfilled') {
      const decisionTitle = action === 'approved' ? 'Supply Request Approved' : action === 'rejected' ? 'Supply Request Rejected' : 'Supply Request Fulfilled'
      const decisionMsg = action === 'approved'
        ? `Your supply request for ${selected.item_name} has been approved.`
        : action === 'rejected'
        ? `Your supply request for ${selected.item_name} has been rejected.${rejectReason ? ' Reason: ' + rejectReason : ''}`
        : `Your supply request for ${selected.item_name} has been fulfilled.`
      notifyRequesterOfDecision(
        'supply_request_notifications',
        'supply_requests',
        selected.id,
        action === 'fulfilled' ? 'fulfilled' : action,
        decisionTitle,
        decisionMsg,
        selected.request_number
      ).catch(() => {})
    }
    toast.success('Request ' + action)
    setActionLoading(false); setDetailOpen(false); setRejectReason(''); load()
  }

  const filtered = requests.filter(r => statusFilter === 'all' || r.status === statusFilter)
  const counts = { pending: requests.filter(r => r.status === 'pending').length, approved: requests.filter(r => r.status === 'approved').length, fulfilled: requests.filter(r => r.status === 'fulfilled').length, rejected: requests.filter(r => r.status === 'rejected').length }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supply Requests</h1>
        <p className="text-gray-600 mt-1">Review and manage employee supply requests</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer hover:border-yellow-400 border-2" onClick={() => setStatusFilter('pending')}><Clock className="w-6 h-6 text-yellow-500 mb-2" /><p className="text-2xl font-bold text-yellow-600">{counts.pending}</p><p className="text-xs text-gray-500">Pending</p></Card>
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 border-2" onClick={() => setStatusFilter('approved')}><CheckCircle className="w-6 h-6 text-blue-500 mb-2" /><p className="text-2xl font-bold text-blue-600">{counts.approved}</p><p className="text-xs text-gray-500">Approved</p></Card>
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer hover:border-green-400 border-2" onClick={() => setStatusFilter('fulfilled')}><Package className="w-6 h-6 text-green-500 mb-2" /><p className="text-2xl font-bold text-green-600">{counts.fulfilled}</p><p className="text-xs text-gray-500">Fulfilled</p></Card>
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer hover:border-red-400 border-2" onClick={() => setStatusFilter('rejected')}><XCircle className="w-6 h-6 text-red-500 mb-2" /><p className="text-2xl font-bold text-red-600">{counts.rejected}</p><p className="text-xs text-gray-500">Rejected</p></Card>
      </div>

      <Card className="p-4 flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
        {statusFilter !== 'all' && <button onClick={() => setStatusFilter('all')} className="text-xs text-orange-600 hover:underline">Clear filter</button>}
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No requests found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Request #', 'Employee', 'Item', 'Qty', 'Priority', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{r.request_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.employee ? r.employee.first_name + ' ' + r.employee.last_name : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.item_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.quantity}</td>
                    <td className="px-6 py-4"><Badge className={PRIORITY_COLORS[r.priority ?? ''] ?? 'bg-gray-100 text-gray-600'}>{r.priority}</Badge></td>
                    <td className="px-6 py-4"><Badge className={STATUS_COLORS[r.status ?? ''] ?? 'bg-gray-100 text-gray-600'}>{r.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(r); setRejectReason(''); setDetailOpen(true) }}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <Modal open={detailOpen} onClose={() => setDetailOpen(false)} size="lg">
          <ModalHeader><h2 className="text-lg font-semibold">Request {selected.request_number}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Employee:</span> <span className="font-medium">{selected.employee ? selected.employee.first_name + ' ' + selected.employee.last_name : '—'}</span></div>
                <div><span className="text-gray-500">Status:</span> <Badge className={STATUS_COLORS[selected.status ?? ''] ?? ''}>{selected.status}</Badge></div>
                <div><span className="text-gray-500">Item:</span> <span className="font-medium">{selected.item_name}</span></div>
                <div><span className="text-gray-500">Quantity:</span> <span className="font-medium">{selected.quantity}</span></div>
                <div><span className="text-gray-500">Priority:</span> <Badge className={PRIORITY_COLORS[selected.priority ?? ''] ?? ''}>{selected.priority}</Badge></div>
                {selected.item && <div><span className="text-gray-500">Stock available:</span> <span className="font-medium">{selected.item.quantity_on_hand ?? 0} {selected.item.unit ?? ''}</span></div>}
              </div>
              {selected.purpose && <div><span className="text-gray-500">Purpose:</span><p className="mt-1 text-gray-700">{selected.purpose}</p></div>}
              {selected.rejection_reason && <div className="bg-red-50 p-3 rounded"><span className="text-red-600 font-medium">Rejection reason:</span><p className="mt-1 text-red-700">{selected.rejection_reason}</p></div>}
              {selected.status === 'rejected' || selected.status === 'fulfilled' ? null : (
                selected.status === 'approved' ? null : (
                  <div><label className="block text-gray-500 mb-1">Rejection reason (if rejecting):</label>
                    <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Required if rejecting..." />
                  </div>
                )
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
            {selected.status === 'pending' && <>
              <Button variant="danger" disabled={actionLoading} onClick={() => handleAction('rejected')}>Reject</Button>
              <Button disabled={actionLoading} onClick={() => handleAction('approved')}>Approve</Button>
            </>}
            {selected.status === 'approved' && (
              <Button disabled={actionLoading} onClick={() => handleAction('fulfilled')}>Mark Fulfilled</Button>
            )}
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
