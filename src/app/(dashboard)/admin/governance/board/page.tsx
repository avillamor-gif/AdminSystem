'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Crown, UserCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import {
  useBoardTrustees, useCreateBoardTrustee, useUpdateBoardTrustee, useDeleteBoardTrustee,
  useBoardTerms, useCreateBoardTerm, useUpdateBoardTerm, useDeleteBoardTerm,
} from '@/hooks/useGovernance'
import type { BoardTrustee, BoardTerm } from '@/services/governance.service'
import { localDateStr } from '@/lib/utils'

const POSITIONS = ['Chairperson', 'Vice Chairperson', 'Secretary', 'Treasurer', 'Trustee'] as const

const POSITION_COLORS: Record<string, string> = {
  'Chairperson':       'bg-amber-100 text-amber-800',
  'Vice Chairperson':  'bg-orange-100 text-orange-800',
  'Secretary':         'bg-blue-100 text-blue-800',
  'Treasurer':         'bg-green-100 text-green-800',
  'Trustee':           'bg-gray-100 text-gray-700',
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  deceased: 'bg-red-100 text-red-700',
}

const emptyTrustee = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', country: 'Philippines',
  trustee_number: '', notes: '', status: 'active' as const, avatar_url: '',
}

const emptyTerm = {
  trustee_id: '', position: 'Trustee' as const,
  term_start: localDateStr(new Date()), term_end: '', is_current: true, notes: '',
}

export default function BoardPage() {
  const { data: trustees = [], isLoading } = useBoardTrustees()
  const { data: allTerms = [] } = useBoardTerms()

  const createTrustee = useCreateBoardTrustee()
  const updateTrustee = useUpdateBoardTrustee()
  const deleteTrustee = useDeleteBoardTrustee()
  const createTerm    = useCreateBoardTerm()
  const updateTerm    = useUpdateBoardTerm()
  const deleteTerm    = useDeleteBoardTerm()

  // Trustee modal
  const [trusteeModal, setTrusteeModal] = useState(false)
  const [selectedTrustee, setSelectedTrustee] = useState<BoardTrustee | null>(null)
  const [trusteeForm, setTrusteeForm] = useState(emptyTrustee)

  // Term modal
  const [termModal, setTermModal] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<BoardTerm | null>(null)
  const [termForm, setTermForm] = useState(emptyTerm)

  // Expanded rows (trustee id → show terms)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Build map: trustee_id → terms[]
  const termsByTrustee = allTerms.reduce<Record<string, BoardTerm[]>>((acc, t) => {
    if (!acc[t.trustee_id]) acc[t.trustee_id] = []
    acc[t.trustee_id].push(t)
    return acc
  }, {})

  // Current board composition
  const currentTerms = allTerms.filter(t => t.is_current)
  const currentTrusteeIds = new Set(currentTerms.map(t => t.trustee_id))

  function openTrustee(t?: BoardTrustee) {
    setSelectedTrustee(t || null)
    setTrusteeForm(t ? {
      first_name: t.first_name, last_name: t.last_name,
      email: t.email || '', phone: t.phone || '',
      address: t.address || '', city: t.city || '',
      country: t.country || 'Philippines',
      trustee_number: t.trustee_number || '',
      notes: t.notes || '', status: t.status, avatar_url: t.avatar_url || '',
    } : emptyTrustee)
    setTrusteeModal(true)
  }

  function openTerm(trusteeId: string, t?: BoardTerm) {
    setSelectedTerm(t || null)
    setTermForm(t ? {
      trustee_id: t.trustee_id, position: t.position,
      term_start: t.term_start, term_end: t.term_end || '',
      is_current: t.is_current, notes: t.notes || '',
    } : { ...emptyTerm, trustee_id: trusteeId })
    setTermModal(true)
  }

  async function handleSaveTrustee(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...trusteeForm,
      email: trusteeForm.email || null,
      phone: trusteeForm.phone || null,
      address: trusteeForm.address || null,
      city: trusteeForm.city || null,
      trustee_number: trusteeForm.trustee_number || null,
      notes: trusteeForm.notes || null,
      avatar_url: trusteeForm.avatar_url || null,
    }
    if (selectedTrustee) {
      await updateTrustee.mutateAsync({ id: selectedTrustee.id, data: payload })
    } else {
      await createTrustee.mutateAsync(payload as any)
    }
    setTrusteeModal(false)
  }

  async function handleSaveTerm(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...termForm,
      term_end: termForm.term_end || null,
      notes: termForm.notes || null,
    }
    if (selectedTerm) {
      await updateTerm.mutateAsync({ id: selectedTerm.id, data: payload })
    } else {
      await createTerm.mutateAsync(payload as any)
    }
    setTermModal(false)
  }

  const currentBoard = POSITIONS.map(pos => ({
    position: pos,
    term: currentTerms.find(t => t.position === pos) || null,
    trustee: currentTerms.find(t => t.position === pos)
      ? trustees.find(tr => tr.id === currentTerms.find(t => t.position === pos)!.trustee_id) || null
      : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board of Trustees</h1>
          <p className="text-gray-600 mt-1">Track BoT composition, terms, and history</p>
        </div>
        <Button onClick={() => openTrustee()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Trustee
        </Button>
      </div>

      {/* Current Board Composition */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-900">Current Board Composition</h2>
          <span className="text-xs text-gray-400 ml-1">(is_current = true)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {currentBoard.map(({ position, trustee, term }) => (
            <div key={position} className={`rounded-lg p-4 border ${trustee ? 'border-amber-200 bg-amber-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
              <p className={`text-xs font-semibold mb-1 ${POSITION_COLORS[position]?.replace('bg-', 'text-').split(' ')[0] || 'text-gray-500'}`}>
                {position}
              </p>
              {trustee ? (
                <>
                  <p className="text-sm font-medium text-gray-900">{trustee.first_name} {trustee.last_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Since {term?.term_start}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Vacant</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Trustees List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Trustees</h2>
          <span className="text-sm text-gray-400">{trustees.length} records</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : trustees.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No trustees yet. Add one to get started.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {trustees.map(tr => {
              const terms = termsByTrustee[tr.id] || []
              const currentTerm = terms.find(t => t.is_current)
              const isExpanded = expanded[tr.id]
              return (
                <div key={tr.id}>
                  <div className="px-6 py-4 hover:bg-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{tr.first_name} {tr.last_name}</p>
                        {currentTerm && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POSITION_COLORS[currentTerm.position]}`}>
                            {currentTerm.position}
                          </span>
                        )}
                        {currentTrusteeIds.has(tr.id) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Current</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[tr.status]}`}>{tr.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[tr.email, tr.phone].filter(Boolean).join(' · ')}
                        {terms.length > 0 && ` · ${terms.length} term${terms.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openTerm(tr.id)}
                        className="text-xs px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium"
                        title="Add term"
                      >
                        + Term
                      </button>
                      <button onClick={() => openTrustee(tr)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${tr.first_name} ${tr.last_name}?`)) deleteTrustee.mutate(tr.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [tr.id]: !e[tr.id] }))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Expanded terms */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-2">Term History</p>
                      {terms.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No terms recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {terms.map(term => (
                            <div key={term.id} className="flex items-center gap-3 text-sm bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POSITION_COLORS[term.position]}`}>{term.position}</span>
                              <span className="text-gray-700">{term.term_start} → {term.term_end || 'Present'}</span>
                              {term.is_current && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">Current</span>}
                              <div className="ml-auto flex gap-1">
                                <button onClick={() => openTerm(tr.id, term)} className="p-1 text-gray-400 hover:text-gray-600">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { if (confirm('Remove this term?')) deleteTerm.mutate(term.id) }} className="p-1 text-gray-400 hover:text-red-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Trustee Modal */}
      <Modal open={trusteeModal} onClose={() => setTrusteeModal(false)} size="lg">
        <form onSubmit={handleSaveTrustee}>
          <ModalHeader onClose={() => setTrusteeModal(false)}>
            {selectedTrustee ? 'Edit Trustee' : 'Add Trustee'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input required value={trusteeForm.first_name} onChange={e => setTrusteeForm(p => ({ ...p, first_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input required value={trusteeForm.last_name} onChange={e => setTrusteeForm(p => ({ ...p, last_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trustee Number</label>
                <input value={trusteeForm.trustee_number} onChange={e => setTrusteeForm(p => ({ ...p, trustee_number: e.target.value }))}
                  placeholder="e.g. BOT-001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={trusteeForm.status} onChange={e => setTrusteeForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={trusteeForm.email} onChange={e => setTrusteeForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={trusteeForm.phone} onChange={e => setTrusteeForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={trusteeForm.city} onChange={e => setTrusteeForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input value={trusteeForm.country} onChange={e => setTrusteeForm(p => ({ ...p, country: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={trusteeForm.notes} onChange={e => setTrusteeForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setTrusteeModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createTrustee.isPending || updateTrustee.isPending}>
              {selectedTrustee ? 'Save Changes' : 'Add Trustee'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Term Modal */}
      <Modal open={termModal} onClose={() => setTermModal(false)}>
        <form onSubmit={handleSaveTerm}>
          <ModalHeader onClose={() => setTermModal(false)}>
            {selectedTerm ? 'Edit Term' : 'Record Term'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position <span className="text-red-500">*</span></label>
                <select required value={termForm.position} onChange={e => setTermForm(p => ({ ...p, position: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term Start <span className="text-red-500">*</span></label>
                  <input type="date" required value={termForm.term_start} onChange={e => setTermForm(p => ({ ...p, term_start: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term End</label>
                  <input type="date" value={termForm.term_end} onChange={e => setTermForm(p => ({ ...p, term_end: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={termForm.is_current} onChange={e => setTermForm(p => ({ ...p, is_current: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
                <span className="text-sm text-gray-700">Current / Active term</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={termForm.notes} onChange={e => setTermForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setTermModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createTerm.isPending || updateTerm.isPending}>
              {selectedTerm ? 'Save Changes' : 'Record Term'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
