'use client'

import React, { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { notifySupervisorsAndAdmins } from '@/services/requestNotification.helper'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }
interface Item { id: string; name: string; unit: string; quantity_on_hand: number; category_id: string | null }

const empty = { item_id: '', item_name: '', category_id: '', quantity: 1, purpose: '', priority: 'normal', notes: '' }

export default function RequestSuppliesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastReqNum, setLastReqNum] = useState('')
  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('supply_items').select('id, name, unit, quantity_on_hand, category_id').eq('is_active', true).gt('quantity_on_hand', 0).order('name'),
        supabase.from('supply_categories').select('id, name').eq('is_active', true).order('name'),
      ])
      setItems(itemsRes.data ?? [])
      setCategories(catsRes.data ?? [])
    }
    load()
  }, [])

  const selectItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) set('item_id', itemId)
    else set('item_id', '')
  }

  const selectedItem = items.find(i => i.id === form.item_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_id && !form.item_name.trim()) { toast.error('Please select or enter an item'); return }
    if (form.quantity < 1) { toast.error('Quantity must be at least 1'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSubmitting(false); return }
    const empRes = await supabase.from('employees').select('id, first_name, last_name').eq('email', user.email!).single()
    if (empRes.error || !empRes.data) { toast.error('Employee profile not found'); setSubmitting(false); return }
    const item = items.find(i => i.id === form.item_id)
    const reqNum = 'SR-' + Date.now().toString().slice(-8)
    const { data: insertedReq, error } = await supabase.from('supply_requests').insert({
      request_number: reqNum,
      employee_id: empRes.data.id,
      item_id: form.item_id || null,
      item_name: item?.name ?? form.item_name,
      category_id: (item?.category_id ?? form.category_id) || null,
      quantity: form.quantity,
      purpose: form.purpose || null,
      priority: form.priority,
      status: 'pending',
      notes: form.notes || null,
    }).select('id').single()
    if (error) { toast.error(error.message); setSubmitting(false); return }
    // Notify supervisors and admins
    if (insertedReq?.id) {
      const requesterName = `${empRes.data.first_name} ${empRes.data.last_name}`
      notifySupervisorsAndAdmins(
        'supply_request_notifications',
        empRes.data.id,
        insertedReq.id,
        'New Supply Request',
        `{name} has submitted a supply request for ${item?.name ?? form.item_name}.`,
        requesterName,
        reqNum
      ).catch(() => {})
    }
    setLastReqNum(reqNum)
    setForm(empty)
    setSubmitting(false)
    setSuccessOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Supplies</h1>
        <p className="text-gray-600 mt-1">Submit a request for office supplies</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
            <select value={form.item_id} onChange={e => selectItem(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">-- Select a supply item --</option>
              {categories.map(cat => {
                const catItems = items.filter(i => i.category_id === cat.id)
                if (!catItems.length) return null
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    {catItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity_on_hand} {i.unit} available)</option>)}
                  </optgroup>
                )
              })}
              {items.filter(i => !i.category_id).map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity_on_hand} {i.unit} available)</option>)}
            </select>
            {!form.item_id && <p className="text-xs text-gray-400 mt-1">Can't find the item? Type it below:</p>}
            {!form.item_id && <Input className="mt-1" placeholder="Or type item name..." value={form.item_name} onChange={e => set('item_name', e.target.value)} />}
          </div>

          {selectedItem && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
              Available stock: <span className="font-medium text-gray-700">{selectedItem.quantity_on_hand} {selectedItem.unit}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <Input type="number" min={1} max={selectedItem ? selectedItem.quantity_on_hand : 9999} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Justification</label>
            <textarea rows={3} value={form.purpose} onChange={e => set('purpose', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Why do you need this item?" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Any other details..." />
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700">
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </Card>

      <Modal open={successOpen} onClose={() => setSuccessOpen(false)}>
        <ModalHeader><h2 className="text-lg font-semibold text-green-700">Request Submitted!</h2></ModalHeader>
        <ModalBody>
          <p className="text-gray-600">Your supply request <span className="font-mono font-semibold text-gray-800">{lastReqNum}</span> has been submitted successfully.</p>
          <p className="text-sm text-gray-500 mt-2">You will be notified once it is approved or fulfilled.</p>
        </ModalBody>
        <ModalFooter>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setSuccessOpen(false)}>OK</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
