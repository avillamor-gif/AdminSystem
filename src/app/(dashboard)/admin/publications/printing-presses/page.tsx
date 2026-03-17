import { redirect } from 'next/navigation'

export default function PrintingPressesPage() {
  redirect('/admin/publications/setup')
}

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Printer, MapPin, Phone, Mail, Globe, CheckCircle, XCircle } from 'lucide-react'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface PrintingPress {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  specialties: string[] | null
  is_active: boolean | null
  min_order_qty: number | null
  turnaround_days: number | null
  notes: string | null
}

const SPECIALTY_OPTIONS = ['Books', 'Journals', 'Magazines', 'Newspapers', 'Newsletters', 'Reports', 'Manuals', 'Brochures', 'Posters', 'Large Format']

const emptyForm = {
  name: '', contact_person: '', email: '', phone: '', website: '',
  address: '', city: '', country: '', specialties: [] as string[],
  is_active: true, min_order_qty: 1, turnaround_days: 5, notes: '',
}

export default function PrintingPressesPage() {
  const [presses, setPresses] = useState<PrintingPress[]>([])
  const [loading, setLoading] = useState(true)

  const loadPresses = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('printing_presses')
      .select('*')
      .order('name', { ascending: true })
    if (error) { toast.error('Failed to load printing presses'); return }
    setPresses((data ?? []) as unknown as PrintingPress[])
    setLoading(false)
  }

  useEffect(() => { loadPresses() }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PrintingPress | null>(null)
  const [formData, setFormData] = useState<Omit<PrintingPress, 'id'>>(emptyForm)

  const filtered = presses.filter(p =>
    !searchTerm ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.city ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contact_person ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => { setSelectedItem(null); setFormData(emptyForm); setIsModalOpen(true) }
  const openEdit = (item: PrintingPress) => { setSelectedItem(item); setFormData({ ...item }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    if (selectedItem) {
      const { error } = await supabase
        .from('printing_presses')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', selectedItem.id)
      if (error) { toast.error(`Failed to update: ${error.message}`); return }
      toast.success('Printing press updated')
    } else {
      const { error } = await supabase
        .from('printing_presses')
        .insert(formData)
      if (error) { toast.error(`Failed to add: ${error.message}`); return }
      toast.success('Printing press added')
    }
    setIsModalOpen(false)
    loadPresses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this printing press?')) return
    const supabase = createClient()
    const { error } = await supabase.from('printing_presses').delete().eq('id', id)
    if (error) { toast.error(`Failed to delete: ${error.message}`); return }
    toast.success('Printing press removed')
    loadPresses()
  }

  const toggleSpecialty = (s: string) => {
    setFormData(p => ({
      ...p,
      specialties: (p.specialties ?? []).includes(s) ? (p.specialties ?? []).filter(x => x !== s) : [...(p.specialties ?? []), s],
    }))
  }

  const activeCount = presses.filter(p => p.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Printing Presses</h1>
          <p className="text-gray-600 mt-1">Manage printing vendors and press partners</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />Add Printing Press
        </Button>
      </div>

      {/* Stats */}
      {loading && <p className="text-sm text-gray-400">Loading...</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-blue-100 rounded-lg mb-2"><Printer className="w-6 h-6 text-blue-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{presses.length}</p>
          <p className="text-sm text-gray-500">Total Vendors</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-lg mb-2"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-red-100 rounded-lg mb-2"><XCircle className="w-6 h-6 text-red-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{presses.length - activeCount}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-purple-100 rounded-lg mb-2"><Globe className="w-6 h-6 text-purple-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{new Set(presses.map(p => p.city)).size}</p>
          <p className="text-sm text-gray-500">Cities</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input placeholder="Search by name, city, contact..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Printer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No printing presses found</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add First Vendor</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turnaround</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(press => (
                  <tr key={press.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-50 rounded-lg mr-3"><Printer className="w-4 h-4 text-orange-600" /></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{press.name}</div>
                          {press.website && <div className="text-xs text-gray-500">{press.website}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{press.contact_person}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{press.email}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{press.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-400 mr-1" />{press.city}, {press.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(press.specialties ?? []).slice(0, 2).map(s => <Badge key={s} className="bg-blue-100 text-blue-800 text-xs">{s}</Badge>)}
                        {(press.specialties ?? []).length > 2 && <Badge className="bg-gray-100 text-gray-600 text-xs">+{(press.specialties ?? []).length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{press.turnaround_days} day{press.turnaround_days !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={press.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {press.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(press)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(press.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader><h2 className="text-lg font-semibold">{selectedItem ? 'Edit Printing Press' : 'Add Printing Press'}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                <Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Printing press / vendor name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <Input value={formData.contact_person ?? ''} onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))} placeholder="Primary contact name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" value={formData.email ?? ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="contact@vendor.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input value={formData.phone ?? ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+63 2 8xxx xxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <Input value={formData.website ?? ''} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="www.vendor.com" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input value={formData.address ?? ''} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input value={formData.city ?? ''} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <Input value={formData.country ?? ''} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Qty</label>
                  <Input type="number" min={1} value={formData.min_order_qty ?? 1} onChange={e => setFormData(p => ({ ...p, min_order_qty: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turnaround (days)</label>
                  <Input type="number" min={1} value={formData.turnaround_days ?? 5} onChange={e => setFormData(p => ({ ...p, turnaround_days: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${(formData.specialties ?? []).includes(s) ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none" rows={2} value={formData.notes ?? ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes about this vendor..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={formData.is_active ?? true} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600 rounded" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active vendor</label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selectedItem ? 'Save Changes' : 'Add Vendor'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
