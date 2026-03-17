'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, CheckCircle } from 'lucide-react'
import { Card, Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import {
  useProgramEnrollments,
  useCreateProgramEnrollment,
  useUpdateProgramEnrollment,
  useDeleteProgramEnrollment,
  usePartnerInstitutions,
} from '@/hooks/useInternship'
import { useEmployees } from '@/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import type { ProgramEnrollmentWithRelations, ProgramEnrollmentInsert } from '@/services/internship.service'
import { formatDate } from '@/lib/utils'

type ProgramType = ProgramEnrollmentInsert['program_type']
type EnrollmentStatus = ProgramEnrollmentInsert['status']

const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: 'internship',    label: 'Internship' },
  { value: 'ojt',           label: 'OJT (On-the-Job Training)' },
  { value: 'volunteer',     label: 'Volunteer' },
  { value: 'practicum',     label: 'Practicum' },
  { value: 'apprenticeship',label: 'Apprenticeship' },
]

const STATUS_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'extended',  label: 'Extended' },
  { value: 'dropped',   label: 'Dropped' },
]

const statusColor: Record<EnrollmentStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  extended:  'bg-purple-100 text-purple-800',
  dropped:   'bg-red-100 text-red-800',
}

const defaultForm: ProgramEnrollmentInsert = {
  employee_id: '',
  partner_institution_id: null,
  program_type: 'internship',
  department_id: null,
  supervisor_id: null,
  school_coordinator: null,
  school_coordinator_email: null,
  endorsement_letter_path: null,
  start_date: '',
  end_date: null,
  required_hours: 600,
  rendered_hours: 0,
  status: 'active',
  certificate_issued: false,
  certificate_issued_at: null,
  certificate_file_path: null,
  notes: null,
  created_by: null,
}

export default function EnrollmentsPage() {
  const { data: enrollments = [], isLoading } = useProgramEnrollments()
  const { data: institutions = [] }           = usePartnerInstitutions({ is_active: true })
  const { data: employees = [] }              = useEmployees({ status: 'active' })
  const { data: departments = [] }            = useDepartments()

  const createMutation = useCreateProgramEnrollment()
  const updateMutation = useUpdateProgramEnrollment()
  const deleteMutation = useDeleteProgramEnrollment()

  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [selected, setSelected]         = useState<ProgramEnrollmentWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProgramEnrollmentWithRelations | null>(null)
  const [form, setForm]                 = useState<ProgramEnrollmentInsert>(defaultForm)

  const filtered = enrollments.filter(e => {
    const fullName = `${e.employee?.first_name ?? ''} ${e.employee?.last_name ?? ''}`.toLowerCase()
    const matchSearch = !search || fullName.includes(search.toLowerCase()) ||
      (e.partner_institution?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType   = !typeFilter   || e.program_type === typeFilter
    const matchStatus = !statusFilter || e.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const stats = {
    total:     enrollments.length,
    active:    enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    totalHoursRendered: enrollments.reduce((s, e) => s + (Number(e.rendered_hours) || 0), 0),
  }

  function openAdd() {
    setSelected(null)
    setForm(defaultForm)
    setIsFormOpen(true)
  }

  function openEdit(enr: ProgramEnrollmentWithRelations) {
    setSelected(enr)
    setForm({
      employee_id:             enr.employee_id,
      partner_institution_id:  enr.partner_institution_id,
      program_type:            enr.program_type,
      department_id:           enr.department_id,
      supervisor_id:           enr.supervisor_id,
      school_coordinator:      enr.school_coordinator,
      school_coordinator_email:enr.school_coordinator_email,
      endorsement_letter_path: enr.endorsement_letter_path,
      start_date:              enr.start_date,
      end_date:                enr.end_date,
      required_hours:          enr.required_hours,
      rendered_hours:          enr.rendered_hours,
      status:                  enr.status,
      certificate_issued:      enr.certificate_issued,
      certificate_issued_at:   enr.certificate_issued_at,
      certificate_file_path:   enr.certificate_file_path,
      notes:                   enr.notes,
      created_by:              enr.created_by,
    })
    setIsFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.employee_id || !form.start_date) return
    try {
      if (selected) {
        await updateMutation.mutateAsync({ id: selected.id, data: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      setIsFormOpen(false)
    } catch { /* toast in hook */ }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const progressPct = (rendered: number, required: number) =>
    required > 0 ? Math.min(100, Math.round((rendered / required) * 100)) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Enrollments</h1>
          <p className="text-gray-600 mt-1">Manage intern and volunteer enrollments</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Enrollment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrollments',    value: stats.total,                          color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Users },
          { label: 'Active',               value: stats.active,                         color: 'text-green-600',  bg: 'bg-green-50',  icon: BookOpen },
          { label: 'Completed',            value: stats.completed,                      color: 'text-purple-600', bg: 'bg-purple-50', icon: CheckCircle },
          { label: 'Total Hours Rendered', value: `${stats.totalHoursRendered.toFixed(0)}h`, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by name or institution…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {PROGRAM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Participant', 'Institution', 'Type', 'Period', 'Hours Progress', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No enrollments found.</td></tr>
              ) : filtered.map(enr => {
                const pct = progressPct(Number(enr.rendered_hours), enr.required_hours)
                return (
                  <tr key={enr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {enr.employee ? `${enr.employee.first_name} ${enr.employee.last_name}` : '—'}
                      </div>
                      <div className="text-xs text-gray-500">{enr.employee?.employee_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {enr.partner_institution?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700 capitalize">{enr.program_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(enr.start_date)} → {enr.end_date ? formatDate(enr.end_date) : 'Ongoing'}
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-orange-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {Number(enr.rendered_hours).toFixed(0)}h / {enr.required_hours}h
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[enr.status]}`}>
                        {enr.status.charAt(0).toUpperCase() + enr.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(enr)} className="text-gray-500 hover:text-gray-800">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(enr)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)} size="lg">
        <ModalHeader onClose={() => setIsFormOpen(false)}>
          {selected ? 'Edit Enrollment' : 'Add Enrollment'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Participant *</label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}>
                    <option value="">Select employee…</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.program_type} onChange={e => setForm(p => ({ ...p, program_type: e.target.value as ProgramType }))}>
                    {PROGRAM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partner Institution</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.partner_institution_id ?? ''} onChange={e => setForm(p => ({ ...p, partner_institution_id: e.target.value || null }))}>
                    <option value="">— None / Walk-in —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.department_id ?? ''} onChange={e => setForm(p => ({ ...p, department_id: e.target.value || null }))}>
                    <option value="">— Select —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Supervisor</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.supervisor_id ?? ''} onChange={e => setForm(p => ({ ...p, supervisor_id: e.target.value || null }))}>
                    <option value="">— Select —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Coordinator</label>
                  <Input value={form.school_coordinator ?? ''} onChange={e => setForm(p => ({ ...p, school_coordinator: e.target.value || null }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordinator Email</label>
                  <Input type="email" value={form.school_coordinator_email ?? ''} onChange={e => setForm(p => ({ ...p, school_coordinator_email: e.target.value || null }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <Input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <Input type="date" value={form.end_date ?? ''} onChange={e => setForm(p => ({ ...p, end_date: e.target.value || null }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Hours</label>
                  <Input type="number" min={1} value={form.required_hours} onChange={e => setForm(p => ({ ...p, required_hours: parseInt(e.target.value) || 0 }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rendered Hours</label>
                  <Input type="number" min={0} step={0.5} value={form.rendered_hours} onChange={e => setForm(p => ({ ...p, rendered_hours: parseFloat(e.target.value) || 0 }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as EnrollmentStatus }))}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : selected ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null) } }}
        title="Delete Enrollment"
        message={`Remove enrollment for ${deleteTarget?.employee ? `${deleteTarget.employee.first_name} ${deleteTarget.employee.last_name}` : 'this participant'}?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
