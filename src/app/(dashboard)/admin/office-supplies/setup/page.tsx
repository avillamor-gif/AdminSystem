'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag, Truck, Star, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplyCategory {
  id: string; name: string; description: string | null; is_active: boolean | null
}
interface SupplyVendor {
  id: string; name: string; contact_person: string | null; email: string | null
  phone: string | null; address: string | null; payment_terms: string | null
  is_active: boolean | null; notes: string | null
}
interface SupplyBrand {
  id: string; name: string; description: string | null; is_active: boolean | null
}
interface SupplyLocation {
  id: string; name: string; description: string | null; is_active: boolean | null
}

type TabType = 'categories' | 'vendors' | 'brands' | 'locations'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyCategory = { name: '', description: '', is_active: true }
const emptyVendor = { name: '', contact_person: '', email: '', phone: '', address: '', payment_terms: '', is_active: true, notes: '' }
const emptyBrand = { name: '', description: '', is_active: true }
const emptyLocation = { name: '', description: '', is_active: true }

function stats<T extends { is_active: boolean | null }>(items: T[]) {
  return { total: items.length, active: items.filter(i => i.is_active).length, inactive: items.filter(i => !i.is_active).length }
}

function StatCards({ icon: Icon, color, s, label }: { icon: React.ElementType; color: string; s: ReturnType<typeof stats>; label: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {([
        { n: s.total, l: `Total ${label}`, bg: `bg-${color}-100`, text: `text-${color}-600`, iconBg: `bg-${color}-100` },
        { n: s.active, l: 'Active', bg: 'bg-green-100', text: 'text-green-600', iconBg: 'bg-green-100' },
        { n: s.inactive, l: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-500', iconBg: 'bg-gray-100' },
      ] as const).map(({ n, l, bg, text, iconBg }) => (
        <Card key={l} className="p-6 flex flex-col items-center text-center">
          <div className={`p-3 ${iconBg} rounded-xl mb-3`}>
            <Icon className={`w-6 h-6 ${text}`} />
          </div>
          <p className={`text-3xl font-bold ${text} mb-1`}>{n}</p>
          <p className="text-sm text-gray-500">{l}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OfficeSuppliesSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Data
  const [categories, setCategories] = useState<SupplyCategory[]>([])
  const [vendors, setVendors] = useState<SupplyVendor[]>([])
  const [brands, setBrands] = useState<SupplyBrand[]>([])
  const [locations, setLocations] = useState<SupplyLocation[]>([])
  const [loading, setLoading] = useState(true)

  // Search (vendors only)
  const [vendorSearch, setVendorSearch] = useState('')

  // Forms
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [vendorForm, setVendorForm] = useState(emptyVendor)
  const [brandForm, setBrandForm] = useState(emptyBrand)
  const [locationForm, setLocationForm] = useState(emptyLocation)

  // ── Load all ──────────────────────────────────────────────────────────────

  const load = async () => {
    const supabase = createClient()
    const sb = supabase as any
    const [cat, ven, bra, loc] = await Promise.all([
      supabase.from('supply_categories').select('*').order('name'),
      supabase.from('supply_vendors').select('*').order('name'),
      sb.from('supply_brands').select('*').order('name'),
      sb.from('supply_locations').select('*').order('name'),
    ])
    if (cat.error) toast.error('Failed to load categories')
    else setCategories(cat.data ?? [])
    if (ven.error) toast.error('Failed to load vendors')
    else setVendors(ven.data ?? [])
    if (bra.error) toast.error('Failed to load brands')
    else setBrands((bra.data ?? []) as SupplyBrand[])
    if (loc.error) toast.error('Failed to load locations')
    else setLocations((loc.data ?? []) as SupplyLocation[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Open modal ────────────────────────────────────────────────────────────

  const handleOpenModal = (item?: any) => {
    setSelectedItem(item ?? null)
    if (activeTab === 'categories') {
      setCategoryForm(item ? { name: item.name, description: item.description ?? '', is_active: item.is_active ?? true } : emptyCategory)
    } else if (activeTab === 'vendors') {
      setVendorForm(item ? {
        name: item.name, contact_person: item.contact_person ?? '', email: item.email ?? '',
        phone: item.phone ?? '', address: item.address ?? '', payment_terms: item.payment_terms ?? '',
        is_active: item.is_active ?? true, notes: item.notes ?? ''
      } : emptyVendor)
    } else if (activeTab === 'brands') {
      setBrandForm(item ? { name: item.name, description: item.description ?? '', is_active: item.is_active ?? true } : emptyBrand)
    } else if (activeTab === 'locations') {
      setLocationForm(item ? { name: item.name, description: item.description ?? '', is_active: item.is_active ?? true } : emptyLocation)
    }
    setShowModal(true)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    try {
      if (activeTab === 'categories') {
        if (!categoryForm.name.trim()) { toast.error('Name is required'); return }
        const payload = { ...categoryForm, name: categoryForm.name.trim() }
        const { error } = selectedItem
          ? await supabase.from('supply_categories').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', selectedItem.id)
          : await supabase.from('supply_categories').insert(payload)
        if (error) { toast.error(error.message); return }
        toast.success(selectedItem ? 'Category updated' : 'Category added')
      } else if (activeTab === 'vendors') {
        if (!vendorForm.name.trim()) { toast.error('Vendor name is required'); return }
        const payload = {
          name: vendorForm.name.trim(),
          contact_person: vendorForm.contact_person || null,
          email: vendorForm.email || null,
          phone: vendorForm.phone || null,
          address: vendorForm.address || null,
          payment_terms: vendorForm.payment_terms || null,
          is_active: vendorForm.is_active,
          notes: vendorForm.notes || null,
        }
        const { error } = selectedItem
          ? await supabase.from('supply_vendors').update(payload).eq('id', selectedItem.id)
          : await supabase.from('supply_vendors').insert(payload)
        if (error) { toast.error(error.message); return }
        toast.success(selectedItem ? 'Vendor updated' : 'Vendor added')
      } else if (activeTab === 'brands') {
        if (!brandForm.name.trim()) { toast.error('Name is required'); return }
        const payload = { ...brandForm, name: brandForm.name.trim() }
        const sb = supabase as any
        const { error } = selectedItem
          ? await sb.from('supply_brands').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', selectedItem.id)
          : await sb.from('supply_brands').insert(payload)
        if (error) { toast.error(error.message); return }
        toast.success(selectedItem ? 'Brand updated' : 'Brand added')
      } else if (activeTab === 'locations') {
        if (!locationForm.name.trim()) { toast.error('Name is required'); return }
        const payload = { ...locationForm, name: locationForm.name.trim() }
        const sb = supabase as any
        const { error } = selectedItem
          ? await sb.from('supply_locations').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', selectedItem.id)
          : await sb.from('supply_locations').insert(payload)
        if (error) { toast.error(error.message); return }
        toast.success(selectedItem ? 'Location updated' : 'Location added')
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const label = activeTab === 'categories' ? 'category' : activeTab === 'vendors' ? 'vendor' : activeTab === 'brands' ? 'brand' : 'location'
    if (!confirm(`Delete this ${label}?`)) return
    const supabase = createClient()
    const table = activeTab === 'categories' ? 'supply_categories' : activeTab === 'vendors' ? 'supply_vendors' : activeTab === 'brands' ? 'supply_brands' : 'supply_locations'
    const { error } = await supabase.from(table as any).delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted`)
    load()
  }

  // ── Tab renders ───────────────────────────────────────────────────────────

  const renderCategories = () => (
    <div className="space-y-4">
      <StatCards icon={Tag} color="blue" s={stats(categories)} label="Categories" />
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Supply Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No categories yet. Click &quot;Add Category&quot; to get started.</td></tr>
              ) : categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.description ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(c)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderVendors = () => {
    const filtered = vendors.filter(v => !vendorSearch ||
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.contact_person ?? '').toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.email ?? '').toLowerCase().includes(vendorSearch.toLowerCase()))
    return (
      <div className="space-y-4">
        <StatCards icon={Truck} color="purple" s={stats(vendors)} label="Vendors" />
        <Card className="p-4">
          <Input placeholder="Search vendors..." value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
        </Card>
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Supply Vendors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Vendor', 'Contact', 'Email', 'Phone', 'Payment Terms', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">No vendors found.</td></tr>
                ) : filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900">{v.name}</div>
                      {v.address && <div className="text-xs text-gray-400 truncate max-w-xs">{v.address}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{v.contact_person ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{v.email ? <a href={`mailto:${v.email}`} className="text-blue-600 hover:underline">{v.email}</a> : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{v.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{v.payment_terms ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={v.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{v.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenModal(v)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  const renderBrands = () => (
    <div className="space-y-4">
      <StatCards icon={Star} color="yellow" s={stats(brands)} label="Brands" />
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Supply Brands</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No brands yet. Click &quot;Add Brand&quot; to get started.</td></tr>
              ) : brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{b.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.description ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={b.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(b)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderLocations = () => (
    <div className="space-y-4">
      <StatCards icon={MapPin} color="green" s={stats(locations)} label="Locations" />
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Supply Locations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No locations yet. Click &quot;Add Location&quot; to get started.</td></tr>
              ) : locations.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{l.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.description ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={l.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{l.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(l)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(l.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  // ── Tabs config ───────────────────────────────────────────────────────────

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'brands', label: 'Brands', icon: Star },
    { id: 'locations', label: 'Locations', icon: MapPin },
  ]

  const addLabel = activeTab === 'categories' ? 'Category' : activeTab === 'vendors' ? 'Vendor' : activeTab === 'brands' ? 'Brand' : 'Location'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setup</h1>
          <p className="text-gray-600 mt-1">Manage supply categories, vendors, brands, and locations</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add {addLabel}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'brands' && renderBrands()}
          {activeTab === 'locations' && renderLocations()}
        </>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} size={activeTab === 'vendors' ? 'lg' : 'md'}>
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setShowModal(false)}>
            {selectedItem ? 'Edit' : 'Add'} {addLabel}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">

              {/* Categories */}
              {activeTab === 'categories' && (
                <>
                  <Input label="Name" required value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={2} value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="cat_active" checked={categoryForm.is_active} onChange={e => setCategoryForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600" />
                    <label htmlFor="cat_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </>
              )}

              {/* Vendors */}
              {activeTab === 'vendors' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label><Input required value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><Input value={vendorForm.contact_person} onChange={e => setVendorForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><Input type="email" value={vendorForm.email} onChange={e => setVendorForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><Input value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label><Input value={vendorForm.payment_terms} onChange={e => setVendorForm(p => ({ ...p, payment_terms: e.target.value }))} placeholder="Net 30, COD..." /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} value={vendorForm.address} onChange={e => setVendorForm(p => ({ ...p, address: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={vendorForm.notes} onChange={e => setVendorForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={vendorForm.is_active} onChange={e => setVendorForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600" /><label className="text-sm text-gray-700">Active</label></div>
                </div>
              )}

              {/* Brands */}
              {activeTab === 'brands' && (
                <>
                  <Input label="Name" required value={brandForm.name} onChange={e => setBrandForm(p => ({ ...p, name: e.target.value }))} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={2} value={brandForm.description} onChange={e => setBrandForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="brand_active" checked={brandForm.is_active} onChange={e => setBrandForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600" />
                    <label htmlFor="brand_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </>
              )}

              {/* Locations */}
              {activeTab === 'locations' && (
                <>
                  <Input label="Name" required value={locationForm.name} onChange={e => setLocationForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Storage Room A, Main Office" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={2} value={locationForm.description} onChange={e => setLocationForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Optional description of this location" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="loc_active" checked={locationForm.is_active} onChange={e => setLocationForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600" />
                    <label htmlFor="loc_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </>
              )}

            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : selectedItem ? 'Save Changes' : `Add ${addLabel}`}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
