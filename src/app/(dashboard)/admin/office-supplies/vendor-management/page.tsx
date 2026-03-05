'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Truck } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Vendor {
  id: string; name: string; contact_person: string | null; email: string | null
  phone: string | null; address: string | null; payment_terms: string | null
  is_active: boolean; notes: string | null
}

const empty = { name: '', contact_person: '', email: '', phone: '', address: '', payment_terms: '', is_active: true, notes: '' }

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const load = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('supply_vendors').select('*').order('name')
    if (error) { toast.error('Failed to load vendors'); return }
    setVendors(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setSelected(null); setForm(empty); setModalOpen(true) }
  const openEdit = (v: Vendor) => {
    setSelected(v)
    setForm({ name: v.name, contact_person: v.contact_person ?? '', email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '', payment_terms: v.payment_terms ?? '', is_active: v.is_active, notes: v.notes ?? '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Vendor name is required'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = { name: form.name.trim(), contact_person: form.contact_person || null, email: form.email || null, phone: form.phone || null, address: form.address || null, payment_terms: form.payment_terms || null, is_active: form.is_active, notes: form.notes || null }
    if (selected) {
      const { error } = await supabase.from('supply_vendors').update(payload).eq('id', selected.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Vendor updated')
    } else {
      const { error } = await supabase.from('supply_vendors').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Vendor added')
    }
    setSaving(false); setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return
    const supabase = createClient()
    const { error } = await supabase.from('supply_vendors').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Vendor deleted'); load()
  }

  const filtered = vendors.filter(v => !search ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contact_person ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.email ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage office supply vendors</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Vendor</Button>
      </div>

      <Card className="p-4"><Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} /></Card>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center"><Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No vendors found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Vendor', 'Contact', 'Email', 'Phone', 'Payment Terms', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="font-medium text-gray-900 text-sm">{v.name}</div>{v.address && <div className="text-xs text-gray-400 truncate max-w-xs">{v.address}</div>}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.contact_person ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.email ? <a href={'mailto:' + v.email} className="text-blue-600 hover:underline">{v.email}</a> : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.payment_terms ?? '—'}</td>
                    <td className="px-6 py-4"><Badge className={v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{v.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
          <ModalHeader><h2 className="text-lg font-semibold">{selected ? 'Edit Vendor' : 'Add Vendor'}</h2></ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label><Input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><Input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label><Input value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="Net 30, COD..." /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 text-orange-600" /><label className="text-sm text-gray-700">Active</label></div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">{saving ? 'Saving...' : selected ? 'Save Changes' : 'Add Vendor'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
