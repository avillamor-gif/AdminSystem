'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/useGovernance'
import type { Member } from '@/services/governance.service'
import { localDateStr } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  regular:       'bg-blue-100 text-blue-700',
  associate:     'bg-purple-100 text-purple-700',
  honorary:      'bg-amber-100 text-amber-700',
  institutional: 'bg-teal-100 text-teal-700',
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-orange-100 text-orange-700',
  lapsed:    'bg-yellow-100 text-yellow-700',
  deceased:  'bg-red-100 text-red-700',
}

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', country: 'Philippines',
  member_number: '', membership_type: 'regular' as Member['membership_type'],
  status: 'active' as Member['status'], date_admitted: '', notes: '', avatar_url: '',
}

export default function MembersPage() {
  const [statusFilter, setStatusFilter]   = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [search, setSearch]               = useState('')
  const [modal, setModal]                 = useState(false)
  const [selected, setSelected]           = useState<Member | null>(null)
  const [form, setForm]                   = useState(emptyForm)

  const { data: members = [], isLoading } = useMembers(
    statusFilter || typeFilter
      ? { status: statusFilter || undefined, membership_type: typeFilter || undefined }
      : undefined
  )
  const createMutation = useCreateMember()
  const updateMutation = useUpdateMember()
  const deleteMutation = useDeleteMember()

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.member_number?.toLowerCase().includes(q)
    )
  })

  const stats = {
    total:   members.length,
    active:  members.filter(m => m.status === 'active').length,
    regular: members.filter(m => m.membership_type === 'regular').length,
  }

  function openModal(m?: Member) {
    setSelected(m || null)
    setForm(m ? {
      first_name: m.first_name, last_name: m.last_name,
      email: m.email || '', phone: m.phone || '',
      address: m.address || '', city: m.city || '',
      country: m.country || 'Philippines',
      member_number: m.member_number || '',
      membership_type: m.membership_type, status: m.status,
      date_admitted: m.date_admitted || '', notes: m.notes || '', avatar_url: m.avatar_url || '',
    } : emptyForm)
    setModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      member_number: form.member_number || null,
      date_admitted: form.date_admitted || null,
      notes: form.notes || null,
      avatar_url: form.avatar_url || null,
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
          <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
          <p className="text-gray-600 mt-1">Registry of organizational members eligible to vote at General Assemblies</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active',        value: stats.active, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Regular',       value: stats.regular, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <Users className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, number…"
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 w-60"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="lapsed">Lapsed</option>
          <option value="deceased">Deceased</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Types</option>
          <option value="regular">Regular</option>
          <option value="associate">Associate</option>
          <option value="honorary">Honorary</option>
          <option value="institutional">Institutional</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date Admitted</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-gray-500">{m.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{m.member_number || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[m.membership_type]}`}>
                        {m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{m.date_admitted || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(m)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remove ${m.first_name} ${m.last_name}?`)) deleteMutation.mutate(m.id) }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Member Modal */}
      <Modal open={modal} onClose={() => setModal(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setModal(false)}>
            {selected ? 'Edit Member' : 'Add Member'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                <input required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input required value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Number</label>
                <input value={form.member_number} onChange={e => setForm(p => ({ ...p, member_number: e.target.value }))}
                  placeholder="e.g. MBR-001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Admitted</label>
                <input type="date" value={form.date_admitted} onChange={e => setForm(p => ({ ...p, date_admitted: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <select value={form.membership_type} onChange={e => setForm(p => ({ ...p, membership_type: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="regular">Regular</option>
                  <option value="associate">Associate</option>
                  <option value="honorary">Honorary</option>
                  <option value="institutional">Institutional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
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
              {selected ? 'Save Changes' : 'Add Member'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
