'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, Search, X, ChevronDown } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { notifySupervisorsAndAdmins } from '@/services/requestNotification.helper'
import { logAction } from '@/services/auditLog.service'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }
interface Item { id: string; name: string; unit: string | null; quantity_on_hand: number | null; category_id: string | null }

const empty = { item_id: '', item_name: '', category_id: '', quantity: 1, purpose: '', priority: 'normal', notes: '' }

export default function RequestSuppliesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastReqNum, setLastReqNum] = useState('')
  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  // Supply item searchable combobox
  const [itemSearch, setItemSearch] = useState('')
  const [itemOpen, setItemOpen] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const { data: currentEmployee } = useCurrentEmployee()
  const employeeName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
    : '—'

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setItemOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedItem = items.find(i => i.id === form.item_id)

  // Sync search label when item is selected
  useEffect(() => {
    if (selectedItem) setItemSearch(selectedItem.name)
  }, [selectedItem?.id])

  const filteredItems = items.filter(i => {
    const q = itemSearch.toLowerCase()
    const cat = categories.find(c => c.id === i.category_id)
    return (
      i.name.toLowerCase().includes(q) ||
      cat?.name.toLowerCase().includes(q)
    )
  })

  function selectItem(i: Item) {
    set('item_id', i.id)
    set('item_name', '')
    setItemSearch(i.name)
    setItemOpen(false)
  }

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
    if (insertedReq?.id) {
      const requesterName = `${empRes.data.first_name} ${empRes.data.last_name}`
      notifySupervisorsAndAdmins(
        'supply_request_notifications',
        empRes.data.id,
        insertedReq.id,
        'New Supply Request',
        `{name} has submitted a supply request for ${item?.name ?? form.item_name}.`,
        requesterName,
        reqNum,
        'admin_resources'
      ).catch(() => {})
      logAction({
        employee_id: empRes.data.id,
        action: 'Supply Request Submitted',
        details: `Requested ${form.quantity}x ${item?.name ?? form.item_name} (priority: ${form.priority}, ref: ${reqNum})`,
      })
    }
    setLastReqNum(reqNum)
    setForm(empty)
    setItemSearch('')
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Supplies</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a request for office supplies</p>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Supply request <span className="font-mono">{lastReqNum}</span> submitted successfully</p>
            <p className="text-xs text-green-600 mt-0.5">You will be notified once it is approved or fulfilled.</p>
          </div>
          <button className="ml-auto text-green-500 hover:text-green-700 text-xs" onClick={() => setSubmitted(false)}>Dismiss</button>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-5 border border-gray-200 rounded-xl space-y-5 bg-gray-50/40">

            {/* Row 1: Employee + Item */}
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
              <div ref={itemRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Supply Item <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => { setItemSearch(e.target.value); setItemOpen(true); if (!e.target.value) set('item_id', '') }}
                    onFocus={() => setItemOpen(true)}
                    placeholder="Search by name or category..."
                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {itemSearch ? (
                    <button type="button" onClick={() => { setItemSearch(''); set('item_id', ''); setItemOpen(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {itemOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No items found</div>
                    ) : filteredItems.map(i => {
                      const cat = categories.find(c => c.id === i.category_id)
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => selectItem(i)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex items-center justify-between gap-2 ${
                            form.item_id === i.id ? 'bg-orange-50 font-medium text-orange-700' : 'text-gray-800'
                          }`}
                        >
                          <span>{i.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {[cat?.name, `${i.quantity_on_hand} ${i.unit ?? ''} available`.trim()].filter(Boolean).join(' · ')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected item details */}
            {selectedItem && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-gray-500">Unit: </span><span className="font-medium text-gray-800">{selectedItem.unit || '—'}</span></div>
                <div><span className="text-gray-500">Available Stock: </span><span className="font-medium text-gray-800">{selectedItem.quantity_on_hand} {selectedItem.unit}</span></div>
              </div>
            )}

            {/* Row 2: Available Stock + Request Quantity + Priority + Purpose */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Stock</label>
                <input
                  type="text"
                  value={
                    selectedItem
                      ? `${Math.max(0, (selectedItem.quantity_on_hand ?? 0) - form.quantity)} ${selectedItem.unit ?? ''}`.trim()
                      : '—'
                  }
                  disabled
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg cursor-not-allowed ${
                    selectedItem && (selectedItem.quantity_on_hand ?? 0) - form.quantity < 0
                      ? 'border-red-300 bg-red-50 text-red-700 font-medium'
                      : selectedItem && (selectedItem.quantity_on_hand ?? 0) - form.quantity === 0
                      ? 'border-yellow-300 bg-yellow-50 text-yellow-700 font-medium'
                      : 'border-gray-200 bg-gray-100 text-gray-600'
                  }`}
                />
                {selectedItem && (selectedItem.quantity_on_hand ?? 0) - form.quantity < 0 && (
                  <p className="text-xs text-red-600 mt-1">Exceeds available stock</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Request Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedItem ? (selectedItem.quantity_on_hand ?? 9999) : 9999}
                  value={form.quantity}
                  onChange={e => set('quantity', Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={e => set('purpose', e.target.value)}
                  placeholder="e.g., Weekly office use"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any special requirements or additional details..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-gray-500">* Required fields</p>
            <Button type="submit" disabled={submitting} className="px-6">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
