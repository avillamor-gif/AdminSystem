'use client'

import React, { useState, useEffect } from 'react'
import { Package, Clock, Ban } from 'lucide-react'
import { Card, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Request {
  id: string; request_number: string; item_name: string; quantity: number
  purpose: string | null; priority: string | null; status: string | null
  rejection_reason: string | null; created_at: string | null
  approved_at: string | null; fulfilled_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

export default function MySupplyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; req: Request | null }>({ open: false, req: null })
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const empRes = await supabase.from('employees').select('id').eq('email', user.email!).single()
      if (empRes.error || !empRes.data) { toast.error('Employee profile not found'); setLoading(false); return }
      const { data, error } = await supabase
        .from('supply_requests')
        .select('*')
        .eq('employee_id', empRes.data.id)
        .order('created_at', { ascending: false })
      if (error) { toast.error('Failed to load requests'); return }
      setRequests(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const handleWithdraw = async () => {
    const req = withdrawModal.req
    if (!req) return
    setIsWithdrawing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('supply_requests')
        .update({ status: 'cancelled' })
        .eq('id', req.id)
      if (error) throw error
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'cancelled' } : r))
      toast.success('Request withdrawn successfully')
      setWithdrawModal({ open: false, req: null })
    } catch {
      toast.error('Failed to withdraw request')
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Supply Requests</h1>
        <p className="text-gray-600 mt-1">Track the status of your requests</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><p className="text-xl font-bold text-yellow-600">{counts.pending}</p><p className="text-xs text-gray-500">Pending</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold text-blue-600">{counts.approved}</p><p className="text-xs text-gray-500">Approved</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold text-green-600">{counts.fulfilled}</p><p className="text-xs text-gray-500">Fulfilled</p></Card>
        <Card className="p-4 text-center"><p className="text-xl font-bold text-red-600">{counts.rejected}</p><p className="text-xs text-gray-500">Rejected</p></Card>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests yet</p>
            <p className="text-sm text-gray-400 mt-1">Submit a request from the "Request Supplies" tab</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Request #', 'Item', 'Qty', 'Priority', 'Status', 'Date', 'Notes', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{r.request_number}</td>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{r.item_name}</div>{r.purpose && <div className="text-xs text-gray-400 truncate max-w-xs">{r.purpose}</div>}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.quantity}</td>
                    <td className="px-6 py-4"><Badge className={PRIORITY_COLORS[r.priority ?? ''] ?? 'bg-gray-100 text-gray-600'}>{r.priority}</Badge></td>
                    <td className="px-6 py-4"><Badge className={STATUS_COLORS[r.status ?? ''] ?? 'bg-gray-100 text-gray-600'}>{r.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {r.status === 'rejected' && r.rejection_reason && (
                        <span className="text-red-500 text-xs">{r.rejection_reason}</span>
                      )}
                      {r.status === 'fulfilled' && r.fulfilled_at && (
                        <span className="text-green-600 text-xs">Fulfilled {new Date(r.fulfilled_at).toLocaleDateString()}</span>
                      )}
                      {r.status === 'approved' && r.approved_at && (
                        <span className="text-blue-500 text-xs">Approved {new Date(r.approved_at).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 whitespace-nowrap"
                          onClick={() => setWithdrawModal({ open: true, req: r })}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />Withdraw
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* Withdraw Modal */}
      <Modal open={withdrawModal.open} onClose={() => setWithdrawModal({ open: false, req: null })}>
        <ModalHeader>
          <h2 className="text-lg font-semibold text-gray-900">Withdraw Request</h2>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">
            Are you sure you want to withdraw your request for{' '}
            <span className="font-semibold text-gray-900">{withdrawModal.req?.item_name}</span>?
            This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setWithdrawModal({ open: false, req: null })}>Cancel</Button>
          <Button variant="danger" onClick={handleWithdraw} disabled={isWithdrawing}>
            <Ban className="w-4 h-4 mr-1.5" />
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw Request'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
