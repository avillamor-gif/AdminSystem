'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Users, CalendarDays, CheckSquare, Square } from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from '@/components/ui'
import {
  useGeneralAssemblies, useCreateGeneralAssembly, useUpdateGeneralAssembly, useDeleteGeneralAssembly,
  useMembers,
  useGaAttendees, useBulkAddGaAttendees, useRemoveGaAttendee,
} from '@/hooks/useGovernance'
import type { GeneralAssembly } from '@/services/governance.service'

const STATUS_COLORS: Record<string, string> = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const emptyForm = {
  assembly_number: '', title: '', date: '', location: '', quorum_met: false,
  status: 'upcoming' as GeneralAssembly['status'], agenda: '', minutes_url: '', notes: '',
}

function AttendancePanel({ ga }: { ga: GeneralAssembly }) {
  const { data: members = [] } = useMembers({ status: 'active' })
  const { data: attendees = [] } = useGaAttendees(ga.id)
  const bulkAdd    = useBulkAddGaAttendees()
  const removeAtt  = useRemoveGaAttendee()

  const attendeeSet = new Set(attendees.map(a => a.member_id))

  function toggle(memberId: string) {
    if (attendeeSet.has(memberId)) {
      const record = attendees.find(a => a.member_id === memberId)
      if (record) removeAtt.mutate({ gaId: ga.id, attendeeId: record.id })
    } else {
      bulkAdd.mutate({ gaId: ga.id, memberIds: [memberId] })
    }
  }

  function toggleAll() {
    const notYet = members.filter(m => !attendeeSet.has(m.id)).map(m => m.id)
    if (notYet.length) {
      bulkAdd.mutate({ gaId: ga.id, memberIds: notYet })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Attendance — {attendees.length} / {members.length} present
        </p>
        {members.length > 0 && (
          <button onClick={toggleAll} className="text-xs text-amber-700 hover:underline">
            Mark all present
          </button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto space-y-1">
        {members.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No active members found.</p>
        )}
        {members.map(m => {
          const present = attendeeSet.has(m.id)
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                present ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              {present
                ? <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              <span className={present ? 'font-medium text-green-700' : 'text-gray-700'}>
                {m.first_name} {m.last_name}
              </span>
              {m.member_number && (
                <span className="text-xs text-gray-400 ml-auto">{m.member_number}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GeneralAssembliesPage() {
  const [modal, setModal]         = useState(false)
  const [selected, setSelected]   = useState<GeneralAssembly | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [attendGa, setAttendGa]   = useState<GeneralAssembly | null>(null)

  const { data: assemblies = [], isLoading } = useGeneralAssemblies()
  const createMutation = useCreateGeneralAssembly()
  const updateMutation = useUpdateGeneralAssembly()
  const deleteMutation = useDeleteGeneralAssembly()

  function openModal(ga?: GeneralAssembly) {
    setSelected(ga || null)
    setForm(ga ? {
      assembly_number: ga.assembly_number || '',
      title: ga.title, date: ga.date, location: ga.location || '',
      quorum_met: ga.quorum_met ?? false,
      status: ga.status, agenda: ga.agenda || '',
      minutes_url: ga.minutes_url || '', notes: ga.notes || '',
    } : emptyForm)
    setModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      assembly_number: form.assembly_number || null,
      location: form.location || null,
      agenda: form.agenda || null,
      minutes_url: form.minutes_url || null,
      notes: form.notes || null,
    }
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload as any)
    }
    setModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Assemblies</h1>
          <p className="text-gray-600 mt-1">Track sessions, quorum, and member attendance</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          New Assembly
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : assemblies.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No general assemblies recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {assemblies.map(ga => (
            <Card key={ga.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{ga.title}</h3>
                      {ga.assembly_number && (
                        <span className="text-xs text-gray-400">#{ga.assembly_number}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ga.status]}`}>
                        {ga.status.charAt(0).toUpperCase() + ga.status.slice(1)}
                      </span>
                      {ga.quorum_met && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Quorum Met</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {ga.date}
                      {ga.location && <> · {ga.location}</>}
                    </p>
                    {ga.agenda && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ga.agenda}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{(ga as any).attendee_count ?? 0} attendees</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="secondary" onClick={() => setAttendGa(ga === attendGa ? null : ga)}>
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Attendance
                  </Button>
                  <button onClick={() => openModal(ga)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${ga.title}"?`)) deleteMutation.mutate(ga.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {attendGa?.id === ga.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <AttendancePanel ga={ga} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* GA Modal */}
      <Modal open={modal} onClose={() => setModal(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setModal(false)}>
            {selected ? 'Edit Assembly' : 'New General Assembly'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. 42nd General Assembly"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assembly Number</label>
                <input value={form.assembly_number} onChange={e => setForm(p => ({ ...p, assembly_number: e.target.value }))}
                  placeholder="e.g. 42"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" id="quorum" checked={form.quorum_met}
                  onChange={e => setForm(p => ({ ...p, quorum_met: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                <label htmlFor="quorum" className="text-sm font-medium text-gray-700">Quorum was met</label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                <textarea rows={3} value={form.agenda} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))}
                  placeholder="Topics to be discussed…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutes URL</label>
                <input type="url" value={form.minutes_url} onChange={e => setForm(p => ({ ...p, minutes_url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {selected ? 'Save Changes' : 'Create Assembly'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
