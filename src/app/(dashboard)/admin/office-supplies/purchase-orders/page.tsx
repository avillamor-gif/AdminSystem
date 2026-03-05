'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ShoppingCart, Eye } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Vendor { id: string; name: string }
interface Item { id: string; name: string; unit: string | null; unit_cost: number | null }
interface POItem { item_id: string | null; item_name: string; quantity: number; unit_cost: number | null }
interface PO {
  id: string; po_number: string; vendor_id: string | null; vendor_name: string | null
  status: string | null; order_date: string | null; expected_date: string | null; received_date: string | null
  total_amount: number | null; notes: string | null; created_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const emptyPO = { vendor_id: '', vendor_name: '', status: 'draft', order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' }
const emptyLineItem = { item_id: '', item_name: '', quantity: 1, unit_cost: 0 }

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<PO | null>(null)
  const [poItems, setPoItems] = useState<POItem[]>([])
  const [viewItems, setViewItems] = useState<POItem[]>([])
  const [form, setForm] = useState(emptyPO)
  const [saving, setSaving] = useState(false)
  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const load = async () => {
    const supabase = createClient()
    const [poRes, vendRes, itemRes] = await Promise.all([
      supabase.from('supply_purchase_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('supply_vendors').select('id, name').eq('is_active', true).order('name'),
      supabase.from('supply_items').select('id, name, unit, unit_cost').eq('is_active', true).order('name'),
    ])
    if (poRes.error) { toast.error('Failed to load purchase orders'); return }
    setOrders(poRes.data ?? [])
    setVendors(vendRes.data ?? [])
    setItems(itemRes.data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setSelected(null); setForm(emptyPO); setPoItems([emptyLineItem]); setModalOpen(true) }
  const openEdit = (po: PO) => { setSelected(po); setForm({ vendor_id: po.vendor_id ?? '', vendor_name: po.vendor_name ?? '', status: po.status ?? 'draft', order_date: po.order_date?.split('T')[0] ?? '', expected_date: po.expected_date?.split('T')[0] ?? '', notes: po.notes ?? '' }); setPoItems([]); setModalOpen(true) }
  
  const openView = async (po: PO) => {
    setSelected(po)
    const supabase = createClient()
    const { data } = await supabase.from('supply_po_items').select('*').eq('po_id', po.id)
    setViewItems(data ?? [])
    setViewOpen(true)
  }

  const addLine = () => setPoItems(p => [...p, { ...emptyLineItem }])
  const removeLine = (i: number) => setPoItems(p => p.filter((_, idx) => idx !== i))
  const setLine = (i: number, f: string, v: any) => setPoItems(p => p.map((l, idx) => idx === i ? { ...l, [f]: v } : l))
  const setLineItem = (i: number, itemId: string) => {
    const item = items.find(it => it.id === itemId)
    if (item) setPoItems(p => p.map((l, idx) => idx === i ? { ...l, item_id: itemId, item_name: item.name, unit_cost: item.unit_cost } : l))
  }

  const total = poItems.reduce((sum, l) => sum + (l.quantity * (l.unit_cost ?? 0)), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_id && !form.vendor_name.trim()) { toast.error('Select or enter a vendor'); return }
    setSaving(true)
    const supabase = createClient()
    const vendor = vendors.find(v => v.id === form.vendor_id)
    const payload: any = { vendor_id: form.vendor_id || null, vendor_name: vendor?.name ?? form.vendor_name, status: form.status, order_date: form.order_date, expected_date: form.expected_date || null, total_amount: selected ? undefined : total, notes: form.notes || null }
    if (!selected) delete payload.total_amount
    let poId = selected?.id
    if (selected) {
      const { error } = await supabase.from('supply_purchase_orders').update({ ...payload, total_amount: total }).eq('id', selected.id)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const now = new Date()
      const datePart = `${String(now.getFullYear()).slice(2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
      const randPart = Math.floor(100 + Math.random() * 900)
      const po_number = `PO-${datePart}-${randPart}`
      const { data, error } = await supabase.from('supply_purchase_orders').insert({ ...payload, po_number, total_amount: total }).select('id').single()
      if (error) { toast.error(error.message); setSaving(false); return }
      poId = data.id
      if (poItems.length > 0) {
        const linePayload = poItems.filter(l => l.item_id || l.item_name).map(l => ({ po_id: poId, item_id: l.item_id || null, item_name: l.item_name, quantity: l.quantity, unit_cost: l.unit_cost }))
        if (linePayload.length) await supabase.from('supply_po_items').insert(linePayload)
      }
    }
    toast.success(selected ? 'PO updated' : 'PO created')
    setSaving(false); setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase order?')) return
    const supabase = createClient()
    await supabase.from('supply_po_items').delete().eq('po_id', id)
    const { error } = await supabase.from('supply_purchase_orders').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('PO deleted'); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage supply purchase orders</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New PO</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['draft','ordered','received','cancelled'] as const).map(s => (
          <Card key={s} className="p-5 flex flex-col items-center text-center">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === s).length}</p>
            <Badge className={STATUS_COLORS[s] + ' mt-1'}>{s}</Badge>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : orders.length === 0 ? (
          <div className="p-12 text-center"><ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No purchase orders yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['PO #', 'Vendor', 'Status', 'Order Date', 'Expected', 'Total', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{po.po_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.vendor_name}</td>
                    <td className="px-6 py-4"><Badge className={STATUS_COLORS[po.status ?? 'draft'] ?? ''}>{po.status ?? 'draft'}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">₱{Number(po.total_amount ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openView(po)}><Eye className="w-4 h-4" /></Button>
                        {po.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => openEdit(po)}><Edit className="w-4 h-4" /></Button>}
                        {po.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => handleDelete(po.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader><h2 className="text-lg font-semibold">{selected ? 'Edit PO' : 'New Purchase Order'}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <select value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">-- Select Vendor --</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['draft','ordered','received','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label><Input type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label><Input type="date" value={form.expected_date} onChange={e => set('expected_date', e.target.value)} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              </div>
              {!selected && (
                <div>
                  <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-semibold text-gray-700">Line Items</h3><Button type="button" variant="ghost" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-1" />Add Line</Button></div>
                  <div className="space-y-2">
                    {poItems.map((line, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <select value={line.item_id ?? ''} onChange={e => setLineItem(i, e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                            <option value="">-- Select Item --</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2"><Input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', Number(e.target.value))} placeholder="Qty" className="text-xs" /></div>
                        <div className="col-span-3"><Input type="number" min={0} step="0.01" value={line.unit_cost ?? 0} onChange={e => setLine(i, 'unit_cost', Number(e.target.value))} placeholder="Unit cost" className="text-xs" /></div>
                        <div className="col-span-1 text-xs text-gray-600 text-right">₱{(line.quantity * (line.unit_cost ?? 0)).toFixed(0)}</div>
                        <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}><Trash2 className="w-3 h-3 text-red-400" /></Button></div>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-3 font-semibold text-gray-700">Total: ₱{total.toLocaleString()}</div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">{saving ? 'Saving...' : selected ? 'Save Changes' : 'Create PO'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {selected && (
        <Modal open={viewOpen} onClose={() => setViewOpen(false)} size="lg">
          <ModalHeader><h2 className="text-lg font-semibold">PO: {selected.po_number}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Vendor:</span> <span className="font-medium">{selected.vendor_name}</span></div>
                <div><span className="text-gray-500">Status:</span> <Badge className={STATUS_COLORS[selected.status ?? 'draft'] ?? ''}>{selected.status ?? 'draft'}</Badge></div>
                <div><span className="text-gray-500">Order Date:</span> {selected.order_date ? new Date(selected.order_date).toLocaleDateString() : '—'}</div>
                {selected.expected_date && <div><span className="text-gray-500">Expected:</span> {new Date(selected.expected_date as string).toLocaleDateString()}</div>}
                {selected.received_date && <div><span className="text-gray-500">Received:</span> {new Date(selected.received_date as string).toLocaleDateString()}</div>}
                <div><span className="text-gray-500">Total:</span> <span className="font-bold">₱{Number(selected.total_amount ?? 0).toLocaleString()}</span></div>
              </div>
              {selected.notes && <div><span className="text-gray-500">Notes:</span><p className="mt-1">{selected.notes}</p></div>}
              {viewItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Line Items</h3>
                  <table className="w-full text-xs border border-gray-200 rounded">
                    <thead className="bg-gray-50"><tr>{['Item','Qty','Unit Cost','Total'].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewItems.map((l: any, i: number) => <tr key={i}><td className="px-3 py-2">{l.item_name}</td><td className="px-3 py-2">{l.quantity}</td><td className="px-3 py-2">₱{Number(l.unit_cost).toFixed(2)}</td><td className="px-3 py-2 font-medium">₱{Number(l.total_cost ?? l.quantity * l.unit_cost).toFixed(2)}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter><Button variant="secondary" onClick={() => setViewOpen(false)}>Close</Button></ModalFooter>
        </Modal>
      )}
    </div>
  )
}
