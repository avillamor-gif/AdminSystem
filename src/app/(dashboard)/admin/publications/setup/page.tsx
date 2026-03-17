'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus, Edit, Trash2, Search, Printer, MapPin, Phone, Mail, Globe,
  CheckCircle, XCircle, Users, Tag, BookOpen,
} from 'lucide-react'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  usePublicationCategories,
  useCreatePublicationCategory,
  useUpdatePublicationCategory,
  useDeletePublicationCategory,
  type PublicationCategory,
} from '@/hooks/usePublications'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface DistributionList {
  id: string
  name: string
  description: string
  recipients: string[]
  publicationType: string
  isActive: boolean
  frequency: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SPECIALTY_OPTIONS = ['Books', 'Journals', 'Magazines', 'Newspapers', 'Newsletters', 'Reports', 'Manuals', 'Brochures', 'Posters', 'Large Format']
const FREQUENCY_OPTIONS = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'on-demand']
const PUBLICATION_TYPES = ['All', 'Books', 'Journals', 'Newsletters', 'Reports', 'Manuals', 'Magazines']

const emptyPressForm = {
  name: '', contact_person: '', email: '', phone: '', website: '',
  address: '', city: '', country: '', specialties: [] as string[],
  is_active: true, min_order_qty: 1, turnaround_days: 5, notes: '',
}

const emptyListForm: Omit<DistributionList, 'id'> = {
  name: '', description: '', recipients: [], publicationType: 'All', isActive: true, frequency: 'monthly',
}

type TabType = 'printing-presses' | 'categories' | 'distribution-lists'

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PublicationsSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>('printing-presses')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publications Setup</h1>
        <p className="text-gray-600 mt-1">Manage printing presses, publication categories, and distribution lists</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {([
            { id: 'printing-presses', label: 'Printing Presses', icon: Printer },
            { id: 'categories',       label: 'Categories',       icon: BookOpen },
            { id: 'distribution-lists', label: 'Distribution Lists', icon: Users },
          ] as { id: TabType; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-orange text-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'printing-presses'   && <PrintingPressesTab />}
      {activeTab === 'categories'          && <CategoriesTab />}
      {activeTab === 'distribution-lists'  && <DistributionListsTab />}
    </div>
  )
}

// ─── Printing Presses Tab ─────────────────────────────────────────────────────

function PrintingPressesTab() {
  const [presses, setPresses] = useState<PrintingPress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PrintingPress | null>(null)
  const [formData, setFormData] = useState<Omit<PrintingPress, 'id'>>(emptyPressForm)

  const loadPresses = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('printing_presses').select('*').order('name', { ascending: true })
    if (error) { toast.error('Failed to load printing presses'); return }
    setPresses((data ?? []) as unknown as PrintingPress[])
    setLoading(false)
  }

  useEffect(() => { loadPresses() }, [])

  const filtered = presses.filter(p =>
    !searchTerm ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.city ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contact_person ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => { setSelectedItem(null); setFormData(emptyPressForm); setIsModalOpen(true) }
  const openEdit = (item: PrintingPress) => { setSelectedItem(item); setFormData({ ...item }); setIsModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    if (selectedItem) {
      const { error } = await supabase.from('printing_presses').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', selectedItem.id)
      if (error) { toast.error(`Failed to update: ${error.message}`); return }
      toast.success('Printing press updated')
    } else {
      const { error } = await supabase.from('printing_presses').insert(formData)
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
      specialties: (p.specialties ?? []).includes(s)
        ? (p.specialties ?? []).filter(x => x !== s)
        : [...(p.specialties ?? []), s],
    }))
  }

  const activeCount = presses.filter(p => p.is_active).length

  return (
    <div className="space-y-4">
      {/* Stats */}
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

      {/* Search + Add */}
      <div className="flex items-center justify-between gap-4">
        <Card className="p-3 flex-1 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input placeholder="Search by name, city, contact..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </Card>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Printing Press</Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
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
                        <MapPin className="w-3 h-3 text-gray-400 mr-1" />{press.city}{press.country ? `, ${press.country}` : ''}
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
          <ModalHeader onClose={() => setIsModalOpen(false)}>{selectedItem ? 'Edit Printing Press' : 'Add Printing Press'}</ModalHeader>
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
                <input type="checkbox" id="pressActive" checked={formData.is_active ?? true} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600 rounded" />
                <label htmlFor="pressActive" className="text-sm font-medium text-gray-700">Active vendor</label>
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

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const { data: categories = [], isLoading } = usePublicationCategories()
  const createMutation = useCreatePublicationCategory()
  const updateMutation = useUpdatePublicationCategory()
  const deleteMutation = useDeletePublicationCategory()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PublicationCategory | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', is_active: true })

  const filtered = categories.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => {
    setSelectedItem(null)
    setFormData({ name: '', description: '', icon: '', is_active: true })
    setIsModalOpen(true)
  }

  const openEdit = (item: PublicationCategory) => {
    setSelectedItem(item)
    setFormData({ name: item.name, description: item.description ?? '', icon: item.icon ?? '', is_active: item.is_active })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      setIsModalOpen(false)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try { await deleteMutation.mutateAsync(id) } catch {}
  }

  const activeCount = categories.filter(c => c.is_active).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-blue-100 rounded-lg mb-2"><BookOpen className="w-6 h-6 text-blue-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-sm text-gray-500">Total Categories</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-lg mb-2"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-gray-100 rounded-lg mb-2"><XCircle className="w-6 h-6 text-gray-500" /></div>
          <p className="text-2xl font-bold text-gray-500">{categories.length - activeCount}</p>
          <p className="text-sm text-gray-500">Inactive</p>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex items-center justify-between gap-4">
        <Card className="p-3 flex-1 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input placeholder="Search categories..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </Card>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories found</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add First Category</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-2xl">{cat.icon || '📁'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '—'}</td>
                    <td className="px-6 py-4">
                      <Badge className={cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
          <ModalHeader onClose={() => setIsModalOpen(false)}>{selectedItem ? 'Edit Category' : 'Add Category'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Newsletter, Book, Journal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                <Input value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} placeholder="📚" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="catActive" checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600 rounded" />
                <label htmlFor="catActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {selectedItem ? 'Save Changes' : 'Add Category'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// ─── Distribution Lists Tab ───────────────────────────────────────────────────

function DistributionListsTab() {
  const [lists, setLists] = useState<DistributionList[]>([
    { id: '1', name: 'HR Department', description: 'All HR staff members', recipients: ['hr@company.com', 'hrmanager@company.com'], publicationType: 'All', isActive: true, frequency: 'monthly' },
    { id: '2', name: 'Finance Team', description: 'Finance and accounting team', recipients: ['finance@company.com'], publicationType: 'Reports', isActive: true, frequency: 'quarterly' },
  ])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DistributionList | null>(null)
  const [formData, setFormData] = useState<Omit<DistributionList, 'id'>>(emptyListForm)
  const [recipientInput, setRecipientInput] = useState('')

  const filtered = lists.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setSelectedItem(null); setFormData(emptyListForm); setRecipientInput(''); setIsModalOpen(true) }
  const openEdit = (item: DistributionList) => { setSelectedItem(item); setFormData({ ...item }); setRecipientInput(''); setIsModalOpen(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItem) {
      setLists(prev => prev.map(l => l.id === selectedItem.id ? { ...formData, id: selectedItem.id } : l))
      toast.success('Distribution list updated')
    } else {
      setLists(prev => [...prev, { ...formData, id: String(Date.now()) }])
      toast.success('Distribution list created')
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this distribution list?')) {
      setLists(prev => prev.filter(l => l.id !== id))
      toast.success('Distribution list deleted')
    }
  }

  const addRecipient = () => {
    const email = recipientInput.trim()
    if (email && !formData.recipients.includes(email)) {
      setFormData(p => ({ ...p, recipients: [...p.recipients, email] }))
      setRecipientInput('')
    }
  }

  const removeRecipient = (email: string) => setFormData(p => ({ ...p, recipients: p.recipients.filter(r => r !== email) }))

  const activeCount = lists.filter(l => l.isActive).length
  const totalRecipients = lists.reduce((acc, l) => acc + l.recipients.length, 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-blue-100 rounded-lg mb-2"><Tag className="w-6 h-6 text-blue-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{lists.length}</p>
          <p className="text-sm text-gray-500">Total Lists</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-green-100 rounded-lg mb-2"><Users className="w-6 h-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-purple-100 rounded-lg mb-2"><Mail className="w-6 h-6 text-purple-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{totalRecipients}</p>
          <p className="text-sm text-gray-500">Recipients</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-2 bg-orange-100 rounded-lg mb-2"><Tag className="w-6 h-6 text-orange-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{new Set(lists.map(l => l.publicationType)).size}</p>
          <p className="text-sm text-gray-500">Pub. Types</p>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex items-center justify-between gap-4">
        <Card className="p-3 flex-1 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input placeholder="Search lists..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </Card>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New List</Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No distribution lists found</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create First List</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publication Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(list => (
                  <tr key={list.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{list.name}</div>
                      {list.description && <div className="text-xs text-gray-500">{list.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{list.publicationType}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{list.recipients.length} recipient{list.recipients.length !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{list.frequency}</td>
                    <td className="px-6 py-4">
                      <Badge className={list.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {list.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(list)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(list.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
          <ModalHeader onClose={() => setIsModalOpen(false)}>{selectedItem ? 'Edit Distribution List' : 'New Distribution List'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
                <Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. HR Department" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this list" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.publicationType} onChange={e => setFormData(p => ({ ...p, publicationType: e.target.value }))}>
                    {PUBLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={formData.frequency} onChange={e => setFormData(p => ({ ...p, frequency: e.target.value }))}>
                    {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Recipients</label>
                <div className="flex gap-2">
                  <Input
                    value={recipientInput}
                    onChange={e => setRecipientInput(e.target.value)}
                    placeholder="email@company.com"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                  />
                  <Button type="button" variant="secondary" onClick={addRecipient}>Add</Button>
                </div>
                {formData.recipients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.recipients.map(email => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {email}
                        <button type="button" onClick={() => removeRecipient(email)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="listActive" checked={formData.isActive} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-orange-600 rounded" />
                <label htmlFor="listActive" className="text-sm font-medium text-gray-700">Active list</label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selectedItem ? 'Save Changes' : 'Create List'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
