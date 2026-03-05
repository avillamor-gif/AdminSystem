'use client'

import React, { useState } from 'react'
import { Plus, Edit, Trash2, Search, Users, Mail, Tag } from 'lucide-react'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import toast from 'react-hot-toast'

interface DistributionList {
  id: string
  name: string
  description: string
  recipients: string[]
  publicationType: string
  isActive: boolean
  frequency: string
}

const FREQUENCY_OPTIONS = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'on-demand']
const PUBLICATION_TYPES = ['All', 'Books', 'Journals', 'Newsletters', 'Reports', 'Manuals', 'Magazines']

const SAMPLE_LISTS: DistributionList[] = [
  { id: '1', name: 'HR Department', description: 'All HR staff members', recipients: ['hr@company.com', 'hrmanager@company.com'], publicationType: 'All', isActive: true, frequency: 'monthly' },
  { id: '2', name: 'Finance Team', description: 'Finance and accounting team', recipients: ['finance@company.com'], publicationType: 'Reports', isActive: true, frequency: 'quarterly' },
]

const emptyForm: Omit<DistributionList, 'id'> = {
  name: '', description: '', recipients: [], publicationType: 'All', isActive: true, frequency: 'monthly',
}

export default function DistributionListsPage() {
  const [lists, setLists] = useState<DistributionList[]>(SAMPLE_LISTS)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DistributionList | null>(null)
  const [formData, setFormData] = useState<Omit<DistributionList, 'id'>>(emptyForm)
  const [recipientInput, setRecipientInput] = useState('')

  const filtered = lists.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setSelectedItem(null); setFormData(emptyForm); setRecipientInput(''); setIsModalOpen(true) }
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

  const removeRecipient = (email: string) => {
    setFormData(p => ({ ...p, recipients: p.recipients.filter(r => r !== email) }))
  }

  const activeCount = lists.filter(l => l.isActive).length
  const totalRecipients = lists.reduce((acc, l) => acc + l.recipients.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribution Lists</h1>
          <p className="text-gray-600 mt-1">Manage publication distribution groups</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />New List
        </Button>
      </div>

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

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input placeholder="Search lists..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No distribution lists found</p>
            <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create First List</Button>
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
          <ModalHeader><h2 className="text-lg font-semibold">{selectedItem ? 'Edit Distribution List' : 'New Distribution List'}</h2></ModalHeader>
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
                  <Input value={recipientInput} onChange={e => setRecipientInput(e.target.value)} placeholder="email@company.com" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())} />
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
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">{selectedItem ? 'Save Changes' : 'Create List'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
