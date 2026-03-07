'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Category { id: string; name: string; description: string | null; is_active: boolean | null }

export default function SupplyCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', is_active: true })

  const load = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('supply_categories').select('*').order('name')
    if (error) { toast.error('Failed to load categories'); return }
    setCategories(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setSelected(null); setForm({ name: '', description: '', is_active: true }); setModalOpen(true) }
  const openEdit = (c: Category) => { setSelected(c); setForm({ name: c.name, description: c.description ?? '', is_active: c.is_active ?? true }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const supabase = createClient()
    if (selected) {
      const { error } = await supabase.from('supply_categories').update({ ...form, updated_at: new Date().toISOString() }).eq('id', selected.id)
      if (error) { toast.error(error.message); return }
      toast.success('Category updated')
    } else {
      const { error } = await supabase.from('supply_categories').insert(form)
      if (error) { toast.error(error.message); return }
      toast.success('Category added')
    }
    setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const supabase = createClient()
    const { error } = await supabase.from('supply_categories').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Category deleted'); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Categories</h1>
          <p className="text-gray-600 mt-1">Manage office supply categories</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400 text-sm">Loading...</div> : categories.length === 0 ? (
          <div className="p-12 text-center"><Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No categories yet</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name', 'Description', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.description ?? '—'}</td>
                  <td className="px-6 py-4"><Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader><h2 className="text-lg font-semibold">{selected ? 'Edit Category' : 'Add Category'}</h2></ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="cat_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-orange-600" /><label htmlFor="cat_active" className="text-sm text-gray-700">Active</label></div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selected ? 'Save Changes' : 'Add Category'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
