'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useJobBoards, useCreateJobBoard, useUpdateJobBoard, useDeleteJobBoard } from '@/hooks'
import type { JobBoard, JobBoardInsert } from '@/services'

export default function JobBoardsIntegrationPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<JobBoard | null>(null)
  const [form, setForm] = useState<Partial<JobBoardInsert>>({ name: '', url: '', api_key: '', is_active: true, auto_post: false, notes: '' })

  const { data: boards = [], isLoading } = useJobBoards()
  const createMutation = useCreateJobBoard()
  const updateMutation = useUpdateJobBoard()
  const deleteMutation = useDeleteJobBoard()

  function openCreate() { setSelected(null); setForm({ name: '', url: '', api_key: '', is_active: true, auto_post: false }); setModalOpen(true) }
  function openEdit(b: JobBoard) {
    setSelected(b)
    setForm({ name: b.name, url: b.url ?? '', api_key: b.api_key ?? '', is_active: b.is_active ?? true, auto_post: b.auto_post ?? false, notes: b.notes ?? '' })
    setModalOpen(true)
  }
  async function handleSubmit() {
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: form })
    else await createMutation.mutateAsync(form as JobBoardInsert)
    setModalOpen(false)
  }
  async function toggleActive(b: JobBoard) {
    await updateMutation.mutateAsync({ id: b.id, data: { is_active: !b.is_active } })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Job Boards Integration</h1><p className="text-sm text-gray-500 mt-1">Connect and manage external job board platforms</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Job Board</Button>
      </div>

      {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
      boards.length === 0 ? (
        <div className="py-16 text-center"><Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No job boards configured</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map(b => (
            <Card key={b.id} className={`overflow-hidden ${!b.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.name}</h3>
                    {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{b.url}</a>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'Active' : 'Inactive'}</span>
                  {b.auto_post && <span className="px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Auto-post</span>}
                  {b.api_key && <span className="px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">API Connected</span>}
                </div>
                {b.notes && <p className="mt-2 text-xs text-gray-500">{b.notes}</p>}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button onClick={() => toggleActive(b)} className="text-xs text-gray-600 hover:text-green-700 transition-colors">
                    {b.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>{selected ? 'Edit Job Board' : 'Add Job Board'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. LinkedIn Jobs" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">URL</label><Input value={form.url ?? ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">API Key</label><Input type="password" value={form.api_key ?? ''} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder="Enter API key..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={2} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-green-600" />Active</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.auto_post ?? false} onChange={e => setForm(f => ({ ...f, auto_post: e.target.checked }))} className="accent-green-600" />Auto-post new openings</label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.name}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Save Changes' : 'Add Board'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Remove Job Board" message="Remove this job board integration?" confirmText="Remove" isLoading={deleteMutation.isPending} />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Boards Integration</h1>
        <p className="text-gray-600 mt-1">
          Integrate with external job boards
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Job Boards Integration configuration coming soon...</p>
      </Card>
    </div>
  )
}
