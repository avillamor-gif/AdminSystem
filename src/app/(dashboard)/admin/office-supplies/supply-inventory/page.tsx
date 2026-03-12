'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }
interface Vendor { id: string; name: string }
interface Brand { id: string; name: string }
interface SupplyLocation { id: string; name: string }
interface SupplyUnit { id: string; name: string; abbreviation: string | null }
interface Item {
  id: string; name: string; description: string | null; category_id: string | null
  unit: string | null; unit_cost: number | null; quantity_on_hand: number | null; reorder_point: number | null
  max_stock: number | null; location: string | null; location_id: string | null; vendor_id: string | null
  brand_id: string | null; is_active: boolean | null; notes: string | null
  category?: Category; vendor?: Vendor; brand?: Brand; supplyLocation?: SupplyLocation
}

const empty = { name: '', description: '', category_id: '', brand_id: '', unit: 'piece', unit_cost: 0, quantity_on_hand: 0, reorder_point: 5, max_stock: 100, location_id: '', vendor_id: '', is_active: true, notes: '' }

export default function SupplyInventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [locations, setLocations] = useState<SupplyLocation[]>([])
  const [units, setUnits] = useState<SupplyUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Item | null>(null)
  const [form, setForm] = useState(empty)
  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const load = async () => {
    const supabase = createClient()
    const [itemsRes, catsRes, vendorsRes, brandsRes, locsRes, unitsRes] = await Promise.all([
      supabase.from('supply_items').select('*').order('name'),
      supabase.from('supply_categories').select('id, name').eq('is_active', true).order('name'),
      supabase.from('supply_vendors').select('id, name').eq('is_active', true).order('name'),
      supabase.from('supply_brands').select('id, name').eq('is_active', true).order('name'),
      supabase.from('supply_locations').select('id, name').eq('is_active', true).order('name'),
      supabase.from('supply_units' as any).select('id, name, abbreviation').eq('is_active', true).order('name'),
    ])
    if (itemsRes.error) { toast.error('Failed to load inventory'); return }
    const catMap = Object.fromEntries((catsRes.data ?? []).map((c: Category) => [c.id, c]))
    const vendMap = Object.fromEntries((vendorsRes.data ?? []).map((v: Vendor) => [v.id, v]))
    const brandMap = Object.fromEntries((brandsRes.data ?? []).map((b: Brand) => [b.id, b]))
    const locMap = Object.fromEntries((locsRes.data ?? []).map((l: SupplyLocation) => [l.id, l]))
    setItems((itemsRes.data ?? []).map((i: Item) => ({ ...i, category: catMap[i.category_id ?? ''], vendor: vendMap[i.vendor_id ?? ''], brand: brandMap[i.brand_id ?? ''], supplyLocation: locMap[i.location_id ?? ''] })))
    setCategories(catsRes.data ?? [])
    setVendors(vendorsRes.data ?? [])
    setBrands(brandsRes.data ?? [])
    setLocations(locsRes.data ?? [])
    setUnits((unitsRes.data ?? []) as unknown as SupplyUnit[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setSelected(null); setForm(empty); setModalOpen(true) }
  const openEdit = (i: Item) => { setSelected(i); setForm({ name: i.name, description: i.description ?? '', category_id: i.category_id ?? '', brand_id: i.brand_id ?? '', unit: i.unit ?? 'piece', unit_cost: i.unit_cost ?? 0, quantity_on_hand: i.quantity_on_hand ?? 0, reorder_point: i.reorder_point ?? 5, max_stock: i.max_stock ?? 100, location_id: i.location_id ?? '', vendor_id: i.vendor_id ?? '', is_active: i.is_active ?? true, notes: i.notes ?? '' }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const supabase = createClient()
    const payload = { ...form, category_id: form.category_id || null, vendor_id: form.vendor_id || null, brand_id: (form as any).brand_id || null, location_id: (form as any).location_id || null, updated_at: new Date().toISOString() }
    if (selected) {
      const { error } = await supabase.from('supply_items').update(payload).eq('id', selected.id)
      if (error) { toast.error(error.message); return }
      toast.success('Item updated')
    } else {
      const { error } = await supabase.from('supply_items').insert(payload)
      if (error) { toast.error(error.message); return }
      toast.success('Item added')
    }
    setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const supabase = createClient()
    const { error } = await supabase.from('supply_items').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Item deleted'); load()
  }

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.category?.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const lowStock = items.filter(i => (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0) && i.is_active).length
  const totalValue = items.reduce((sum, i) => sum + ((i.unit_cost ?? 0) * (i.quantity_on_hand ?? 0)), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Inventory</h1>
          <p className="text-gray-600 mt-1">Manage office supply stock</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Supply</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center text-center"><Package className="w-6 h-6 text-blue-600 mb-2" /><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-gray-500">Total Items</p></Card>
        <Card className="p-5 flex flex-col items-center text-center"><AlertTriangle className="w-6 h-6 text-red-500 mb-2" /><p className="text-2xl font-bold text-red-600">{lowStock}</p><p className="text-xs text-gray-500">Low Stock</p></Card>
        <Card className="p-5 flex flex-col items-center text-center"><Package className="w-6 h-6 text-green-600 mb-2" /><p className="text-2xl font-bold">{items.reduce((s, i) => s + (i.quantity_on_hand ?? 0), 0)}</p><p className="text-xs text-gray-500">Total Units</p></Card>
        <Card className="p-5 flex flex-col items-center text-center"><Package className="w-6 h-6 text-purple-600 mb-2" /><p className="text-2xl font-bold">₱{totalValue.toLocaleString()}</p><p className="text-xs text-gray-500">Total Value</p></Card>
      </div>

      <Card className="p-4"><Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} /></Card>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No items found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Item', 'Category', 'Unit Cost', 'On Hand', 'Reorder At', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(item => {
                  const isLow = (item.quantity_on_hand ?? 0) <= (item.reorder_point ?? 0)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="font-medium text-gray-900 text-sm">{item.name}</div>{item.supplyLocation && <div className="text-xs text-gray-400">{item.supplyLocation.name}</div>}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">₱{(item.unit_cost ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4"><span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>{item.quantity_on_hand ?? 0} {item.unit ?? ''}{isLow && <span className="ml-1 text-xs text-red-400">(low)</span>}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.reorder_point ?? 0}</td>
                      <td className="px-6 py-4"><Badge className={item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader><h2 className="text-lg font-semibold">{selected ? 'Edit Supply' : 'Add Supply'}</h2></ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><Input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- None --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- None --</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select value={(form as any).brand_id} onChange={e => set('brand_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- None --</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- Select Unit --</option>
                  {units.length > 0
                    ? units.map(u => <option key={u.id} value={u.name.toLowerCase()}>{u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}</option>)
                    : ['Piece','Box','Pack','Ream','Roll','Set','Bottle','Can'].map(u => <option key={u} value={u.toLowerCase()}>{u}</option>)
                  }
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₱)</label><Input type="number" min={0} step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', Number(e.target.value))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Qty on Hand</label><Input type="number" min={0} value={form.quantity_on_hand} onChange={e => set('quantity_on_hand', Number(e.target.value))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label><Input type="number" min={0} value={form.reorder_point} onChange={e => set('reorder_point', Number(e.target.value))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label><Input type="number" min={0} value={form.max_stock} onChange={e => set('max_stock', Number(e.target.value))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select value={(form as any).location_id} onChange={e => set('location_id', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">-- None --</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 text-orange-600" /><label className="text-sm text-gray-700">Active</label></div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selected ? 'Save Changes' : 'Add Supply'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
