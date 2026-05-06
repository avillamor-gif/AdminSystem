'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Users, X, UserPlus, UserMinus, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { toast } from 'sonner'
import {
  useCommittees,
  useCreateCommittee,
  useUpdateCommittee,
  useDeleteCommittee,
  useAddCommitteeMember,
  useUpdateCommitteeMemberRole,
  useRemoveCommitteeMember,
} from '@/hooks/useCommittees'
import { useEmployees } from '@/hooks/useEmployees'
import type { CommitteeWithMembers, CommitteeMember } from '@/services/committee.service'

const COMMITTEE_TYPES = [
  { value: 'standing',  label: 'Standing Committee' },
  { value: 'ad_hoc',    label: 'Ad Hoc Committee' },
  { value: 'technical', label: 'Technical Committee' },
  { value: 'advisory',  label: 'Advisory Committee' },
]

const MEMBER_ROLES = [
  { value: 'chair',     label: 'Chairperson' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'member',    label: 'Member' },
]

const ROLE_COLORS: Record<string, string> = {
  chair:     'bg-orange-100 text-orange-700',
  secretary: 'bg-blue-100 text-blue-700',
  member:    'bg-gray-100 text-gray-700',
}

const TYPE_COLORS: Record<string, string> = {
  standing:  'bg-green-100 text-green-700',
  ad_hoc:    'bg-yellow-100 text-yellow-700',
  technical: 'bg-purple-100 text-purple-700',
  advisory:  'bg-blue-100 text-blue-700',
}

interface CommitteeFormData {
  name: string
  description: string
  type: 'standing' | 'ad_hoc' | 'technical' | 'advisory'
  formed_at: string
  is_active: boolean
}

function CommitteeCard({ committee }: { committee: CommitteeWithMembers }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [newMemberId, setNewMemberId]   = useState('')
  const [newMemberRole, setNewMemberRole] = useState<CommitteeMember['role']>('member')

  const { data: employees = [] } = useEmployees({})
  const addMember    = useAddCommitteeMember()
  const updateRole   = useUpdateCommitteeMemberRole()
  const removeMember = useRemoveCommitteeMember()

  const memberEmployeeIds = new Set(committee.members.map(m => m.employee_id))
  const availableEmployees = employees.filter(e => !memberEmployeeIds.has(e.id))

  const handleAddMember = async () => {
    if (!newMemberId) { toast.error('Select an employee'); return }
    await addMember.mutateAsync({ committeeId: committee.id, employeeId: newMemberId, role: newMemberRole })
    setNewMemberId('')
    setNewMemberRole('member')
    setAddingMember(false)
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{committee.name}</p>
            {committee.description && (
              <p className="text-xs text-gray-500 mt-0.5">{committee.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`text-xs ${TYPE_COLORS[committee.type]}`}>
            {COMMITTEE_TYPES.find(t => t.value === committee.type)?.label}
          </Badge>
          <Badge className="text-xs bg-gray-100 text-gray-700">
            {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
          </Badge>
          {!committee.is_active && (
            <Badge className="text-xs bg-red-100 text-red-600">Inactive</Badge>
          )}
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-4">
          {/* Members list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Members</h4>
              <Button size="sm" variant="secondary" onClick={() => setAddingMember(a => !a)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Add Member
              </Button>
            </div>

            {addingMember && (
              <div className="flex items-end gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={newMemberId}
                    onChange={e => setNewMemberId(e.target.value)}
                  >
                    <option value="">Select employee…</option>
                    {availableEmployees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value as CommitteeMember['role'])}
                  >
                    {MEMBER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <Button size="sm" onClick={handleAddMember} disabled={addMember.isPending}>
                  {addMember.isPending ? 'Adding…' : 'Add'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingMember(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {committee.members.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No members yet. Add members above.</p>
            ) : (
              <div className="space-y-2">
                {committee.members.map(member => {
                  const emp = member.employee
                  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'
                  return (
                    <div key={member.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-700">
                          {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fullName}</p>
                          <p className="text-xs text-gray-400">
                            {(emp as any)?.job_title?.title ?? ''}{(emp as any)?.department?.name ? ` · ${(emp as any).department.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none ${ROLE_COLORS[member.role]}`}
                          value={member.role}
                          onChange={e => updateRole.mutate({ memberId: member.id, role: e.target.value as CommitteeMember['role'] })}
                        >
                          {MEMBER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button
                          onClick={() => removeMember.mutate(member.id)}
                          className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default function CommitteesPage() {
  const [isFormOpen, setIsFormOpen]   = useState(false)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [formData, setFormData]       = useState<CommitteeFormData>({
    name: '', description: '', type: 'standing', formed_at: '', is_active: true,
  })

  const { data: committees = [], isLoading } = useCommittees()
  const createMutation = useCreateCommittee()
  const updateMutation = useUpdateCommittee()
  const deleteMutation = useDeleteCommittee()

  const handleAdd = () => {
    setSelectedId(null)
    setFormData({ name: '', description: '', type: 'standing', formed_at: '', is_active: true })
    setIsFormOpen(true)
  }

  const handleEdit = (c: CommitteeWithMembers) => {
    setSelectedId(c.id)
    setFormData({
      name: c.name,
      description: c.description ?? '',
      type: c.type,
      formed_at: c.formed_at ?? '',
      is_active: c.is_active,
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (c: CommitteeWithMembers) => {
    if (!confirm(`Delete "${c.name}"? All member records will be removed.`)) return
    await deleteMutation.mutateAsync(c.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      formed_at: formData.formed_at || null,
      is_active: formData.is_active,
    }
    if (selectedId) {
      await updateMutation.mutateAsync({ id: selectedId, data: payload })
    } else {
      await createMutation.mutateAsync(payload as any)
    }
    setIsFormOpen(false)
  }

  const active   = committees.filter(c => c.is_active)
  const inactive = committees.filter(c => !c.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committees</h1>
          <p className="text-gray-600 mt-1">Manage standing, ad hoc, and technical committees and their members</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          New Committee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Committees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{committees.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{active.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Members</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {committees.reduce((sum, c) => sum + c.members.length, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{inactive.length}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : committees.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No committees yet</h3>
          <p className="text-gray-500 mb-4">Create your first committee and add members to it</p>
          <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" />New Committee</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {committees.map(c => (
            <div key={c.id} className="relative group">
              <CommitteeCard committee={c} />
              <div className="absolute top-4 right-14 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Committee Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedId ? 'Edit Committee' : 'New Committee'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., PME, Finance Committee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the committee's purpose"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as CommitteeFormData['type'] })}
                    >
                      {COMMITTEE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Formed</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.formed_at}
                      onChange={e => setFormData({ ...formData, formed_at: e.target.value })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Active committee</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving…' : selectedId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
