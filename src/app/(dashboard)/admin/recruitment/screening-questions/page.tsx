'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useScreeningQuestions, useCreateScreeningQuestion, useUpdateScreeningQuestion, useDeleteScreeningQuestion } from '@/hooks'
import type { ScreeningQuestion, ScreeningQuestionInsert } from '@/services'

const TYPES = ['text', 'yes_no', 'multiple_choice', 'rating', 'number']
const TYPE_LABELS: Record<string, string> = { text: 'Text', yes_no: 'Yes/No', multiple_choice: 'Multiple Choice', rating: 'Rating', number: 'Number' }

export default function ScreeningQuestionsPage() {
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ScreeningQuestion | null>(null)
  const [form, setForm] = useState<Partial<ScreeningQuestionInsert>>({ question: '', question_type: 'text', is_required: false, is_knockout: false, is_global: true })

  const { data: questions = [], isLoading } = useScreeningQuestions(scopeFilter === 'global' ? { is_global: true } : undefined)
  const createMutation = useCreateScreeningQuestion()
  const updateMutation = useUpdateScreeningQuestion()
  const deleteMutation = useDeleteScreeningQuestion()

  function openCreate() { setSelected(null); setForm({ question: '', question_type: 'text', is_required: false, is_knockout: false, is_global: true }); setModalOpen(true) }
  function openEdit(q: ScreeningQuestion) {
    setSelected(q)
    setForm({ question: q.question, question_type: q.question_type, is_required: q.is_required ?? false, is_knockout: q.is_knockout ?? false, knockout_answer: q.knockout_answer ?? '', is_global: q.is_global ?? true })
    setModalOpen(true)
  }
  async function handleSubmit() {
    if (selected) await updateMutation.mutateAsync({ id: selected.id, data: form })
    else await createMutation.mutateAsync(form as ScreeningQuestionInsert)
    setModalOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Screening Questions</h1><p className="text-sm text-gray-500 mt-1">Define pre-screening questions for applicants</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Question</Button>
      </div>

      <div className="flex gap-2">
        {[['all', 'All Questions'], ['global', 'Global Only']].map(([val, label]) => (
          <button key={val} onClick={() => setScopeFilter(val as any)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${scopeFilter === val ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Questions ({questions.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          questions.length === 0 ? (
            <div className="py-16 text-center"><HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No screening questions yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Question</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Required</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Knockout</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Scope</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs truncate">{q.question}</td>
                    <td className="px-5 py-3.5 text-gray-600">{TYPE_LABELS[q.question_type] ?? q.question_type}</td>
                    <td className="px-5 py-3.5">{q.is_required ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                    <td className="px-5 py-3.5">{q.is_knockout ? <span className="text-red-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${q.is_global ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{q.is_global ? 'Global' : 'Per Job'}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(q)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(q.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>{selected ? 'Edit Question' : 'Add Question'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Question *</label><textarea rows={3} value={form.question ?? ''} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select value={form.question_type ?? 'text'} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            {form.is_knockout && <div><label className="block text-sm font-medium text-gray-700 mb-1">Knockout Answer</label><Input value={form.knockout_answer ?? ''} onChange={e => setForm(f => ({ ...f, knockout_answer: e.target.value }))} placeholder="e.g. No" /></div>}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_required ?? false} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} className="accent-green-600" />Required</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_knockout ?? false} onChange={e => setForm(f => ({ ...f, is_knockout: e.target.checked }))} className="accent-green-600" />Knockout Question</label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.is_global ?? true} onChange={e => setForm(f => ({ ...f, is_global: e.target.checked }))} className="accent-green-600" />Global (all jobs)</label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.question}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selected ? 'Save Changes' : 'Add Question'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) } }}
        title="Delete Question" message="Delete this screening question?" confirmText="Delete" isLoading={deleteMutation.isPending} />
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Screening Questions</h1>
        <p className="text-gray-600 mt-1">
          Configure application screening questions
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Screening Questions configuration coming soon...</p>
      </Card>
    </div>
  )
}
