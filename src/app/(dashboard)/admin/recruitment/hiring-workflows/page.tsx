'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, GitBranch } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useHiringWorkflows, useCreateHiringWorkflow, useUpdateHiringWorkflow, useDeleteHiringWorkflow } from '@/hooks'
import type { HiringWorkflow, HiringWorkflowInsert } from '@/services'

const DEFAULT_STAGES = [
  { name: 'Applied', order: 1 }, { name: 'Screening', order: 2 }, { name: 'Interview', order: 3 },
  { name: 'Assessment', order: 4 }, { name: 'Offer', order: 5 }, { name: 'Hired', order: 6 },
]

export default function HiringWorkflowsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<HiringWorkflow | null>(null)
  const [form, setForm] = useState<Partial<HiringWorkflowInsert>>({ name: '', description: '', stages: DEFAULT_STAGES, is_active: true, is_default: false })
  const [stagesText, setStagesText] = useState(DEFAULT_STAGES.map(s => s.name).join('\n'))

  const { data: workflows = [], isLoading } = useHiringWorkflows()
  const createMutation = useCreateHiringWorkflow()
  const updateMutation = useUpdateHiringWorkflow()
  const deleteMutation = useDeleteHiringWorkflow()

  function openCreate() {
    setSelected(null)
    const s = DEFAULT_STAGES
    setForm({ name: '', description: '', stages: s, is_active: true, is_default: false })
    setStagesText(s.map((st: any) => st.name).join('\n'))
    setModalOpen(true)
  }
  function openEdit(w: HiringWorkflow) {
    setSelected(w)
    const stages = Array.isArray(w.stages) ? w.stages : []
    setForm({ name: w.name, description: w.description ?? '', stages, is_active: w.is_active ?? true, is_default: w.is_default ?? false })
    setStagesText(stages.map((s: any) => s.name ?? s).join('\n'))
    setModalOpen(true)
  }
  async function handleSubmit() {
    const stages = stagesText.split('\n').filter(Boolean).map((name, i) => ({ name: name.trim(), order: i + 1 }))
    const payload = { ...form, stages }
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: payload })
    else await createMutation.mutateAsync(payload as HiringWorkflowInsert)
    setModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Hiring Workflows</h1><p className="text-sm text-gray-500 mt-1">Define recruitment pipeline templates</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Workflow</Button>
      </div>

      {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
      workflows.length === 0 ? (
        <div className="py-16 text-center"><GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No workflows defined yet</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workflows.map(w => (
            <Card key={w.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {w.name}
                      {w.is_default && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
                      {!w.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </CardTitle>
                    {w.description && <p className="text-sm text-gray-500 mt-0.5">{w.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => openEdit(w)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(w.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(w.stages) ? w.stages : []).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s.name ?? s}</span>
                      {i < (w.stages.length - 1) && <span className="text-gray-300 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>{selected ? 'Edit Workflow' : 'New Workflow'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name *</label><Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stages (one per line)</label>
              <textarea rows={8} value={stagesText} onChange={e => setStagesText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Applied&#10;Screening&#10;Interview&#10;Offer&#10;Hired" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-green-600" />Active</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_default ?? false} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="accent-green-600" />Set as Default</label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.name}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Save Changes' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Delete Workflow" message="Delete this hiring workflow?" confirmText="Delete" isLoading={deleteMutation.isPending} />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hiring Workflows</h1>
        <p className="text-gray-600 mt-1">
          Configure hiring approval workflows
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Hiring Workflows configuration coming soon...</p>
      </Card>
    </div>
  )
}
