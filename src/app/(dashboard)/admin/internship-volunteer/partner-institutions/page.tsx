'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, FileText, ExternalLink, AlertTriangle, Building2, CheckCircle, Clock } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import {
  usePartnerInstitutions,
  useCreatePartnerInstitution,
  useUpdatePartnerInstitution,
  useDeletePartnerInstitution,
  useUploadMoaFile,
} from '@/hooks/useInternship'
import type { PartnerInstitution, PartnerInstitutionInsert } from '@/services/internship.service'
import { partnerInstitutionService } from '@/services/internship.service'
import { formatDate } from '@/lib/utils'

type InstitutionType = PartnerInstitution['type']
type MoaStatus = PartnerInstitution['moa_status']

const TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: 'university',  label: 'University' },
  { value: 'college',     label: 'College' },
  { value: 'technical',   label: 'Technical School' },
  { value: 'ngo',         label: 'NGO' },
  { value: 'government',  label: 'Government Agency' },
  { value: 'other',       label: 'Other' },
]

const MOA_STATUS_OPTIONS: { value: MoaStatus; label: string }[] = [
  { value: 'active',     label: 'Active' },
  { value: 'pending',    label: 'Pending' },
  { value: 'expired',    label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
]

const defaultForm: PartnerInstitutionInsert = {
  name: '',
  short_name: null,
  type: 'university',
  contact_person: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  city: null,
  country: 'Philippines',
  moa_number: null,
  moa_signed_date: null,
  moa_expiry_date: null,
  moa_status: 'pending',
  moa_file_path: null,
  max_slots_per_term: 5,
  notes: null,
  is_active: true,
}

function moaStatusBadge(status: MoaStatus) {
  const map: Record<MoaStatus, string> = {
    active:     'bg-green-100 text-green-800',
    pending:    'bg-yellow-100 text-yellow-800',
    expired:    'bg-red-100 text-red-800',
    terminated: 'bg-gray-100 text-gray-600',
  }
  return map[status]
}

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

export default function PartnerInstitutionsPage() {
  const { data: institutions = [], isLoading } = usePartnerInstitutions()
  const createMutation  = useCreatePartnerInstitution()
  const updateMutation  = useUpdatePartnerInstitution()
  const deleteMutation  = useDeletePartnerInstitution()
  const uploadMoaMutation = useUploadMoaFile()

  const [search, setSearch]             = useState('')
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [selected, setSelected]         = useState<PartnerInstitution | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartnerInstitution | null>(null)
  const [form, setForm]                 = useState<PartnerInstitutionInsert>(defaultForm)
  const [moaFile, setMoaFile]           = useState<File | null>(null)

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.moa_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.city ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const stats = {
    total:   institutions.length,
    active:  institutions.filter(i => i.moa_status === 'active').length,
    expiringSoon: institutions.filter(i => {
      const d = daysUntilExpiry(i.moa_expiry_date)
      return d !== null && d >= 0 && d <= 60
    }).length,
    expired: institutions.filter(i => i.moa_status === 'expired').length,
  }

  function openAdd() {
    setSelected(null)
    setForm(defaultForm)
    setMoaFile(null)
    setIsFormOpen(true)
  }

  function openEdit(inst: PartnerInstitution) {
    setSelected(inst)
    setForm({
      name: inst.name,
      short_name: inst.short_name,
      type: inst.type,
      contact_person: inst.contact_person,
      contact_email: inst.contact_email,
      contact_phone: inst.contact_phone,
      address: inst.address,
      city: inst.city,
      country: inst.country,
      moa_number: inst.moa_number,
      moa_signed_date: inst.moa_signed_date,
      moa_expiry_date: inst.moa_expiry_date,
      moa_status: inst.moa_status,
      moa_file_path: inst.moa_file_path,
      max_slots_per_term: inst.max_slots_per_term,
      notes: inst.notes,
      is_active: inst.is_active,
    })
    setMoaFile(null)
    setIsFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (selected) {
        await updateMutation.mutateAsync({ id: selected.id, data: form })
        if (moaFile) await uploadMoaMutation.mutateAsync({ file: moaFile, institutionId: selected.id, institutionName: form.name })
      } else {
        const created = await createMutation.mutateAsync(form)
        if (moaFile) await uploadMoaMutation.mutateAsync({ file: moaFile, institutionId: created.id, institutionName: form.name })
      }
      setIsFormOpen(false)
    } catch { /* toast already shown in hook */ }
  }

  async function handleViewMoa(inst: PartnerInstitution) {
    if (!inst.moa_file_path) return
    const url = await partnerInstitutionService.getMoaUrl(inst.moa_file_path)
    window.open(url, '_blank')
  }

  const isPending = createMutation.isPending || updateMutation.isPending || uploadMoaMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Institutions</h1>
          <p className="text-gray-600 mt-1">Manage partner schools and MOA details</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Institution
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Partners', value: stats.total,         color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Building2 },
          { label: 'Active MOAs',    value: stats.active,        color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
          { label: 'Expiring Soon',  value: stats.expiringSoon,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
          { label: 'Expired',        value: stats.expired,       color: 'text-red-600',    bg: 'bg-red-50',    icon: AlertTriangle },
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

      {/* Search */}
      <Input
        placeholder="Search by name, MOA number, or city…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Institution', 'Type', 'MOA Number', 'MOA Period', 'Slots', 'Status', 'MOA File', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No institutions found.</td></tr>
              ) : filtered.map(inst => {
                const days = daysUntilExpiry(inst.moa_expiry_date)
                return (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{inst.name}</div>
                      {inst.short_name && <div className="text-xs text-gray-500">{inst.short_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{inst.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{inst.moa_number ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inst.moa_signed_date ? formatDate(inst.moa_signed_date) : '—'}
                      {' → '}
                      {inst.moa_expiry_date ? (
                        <span className={days !== null && days <= 60 && days >= 0 ? 'text-yellow-600 font-medium' : days !== null && days < 0 ? 'text-red-600 font-medium' : ''}>
                          {formatDate(inst.moa_expiry_date)}
                          {days !== null && days >= 0 && days <= 60 && <span className="ml-1 text-xs">({days}d)</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inst.max_slots_per_term ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${moaStatusBadge(inst.moa_status)}`}>
                        {inst.moa_status.charAt(0).toUpperCase() + inst.moa_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inst.moa_file_path ? (
                        <button
                          onClick={() => handleViewMoa(inst)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          View
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(inst)} className="text-gray-500 hover:text-gray-800">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(inst)} className="text-red-400 hover:text-red-600">
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
          {selected ? 'Edit Partner Institution' : 'Add Partner Institution'}
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name *</label>
                  <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. University of Santo Tomas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name / Acronym</label>
                  <Input value={form.short_name ?? ''} onChange={e => setForm(p => ({ ...p, short_name: e.target.value || null }))} placeholder="e.g. UST" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as InstitutionType }))}>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <Input value={form.contact_person ?? ''} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value || null }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <Input type="email" value={form.contact_email ?? ''} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value || null }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <Input value={form.contact_phone ?? ''} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value || null }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input value={form.city ?? ''} onChange={e => setForm(p => ({ ...p, city: e.target.value || null }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <Input value={form.country ?? ''} onChange={e => setForm(p => ({ ...p, country: e.target.value || null }))} />
                </div>
              </div>

              <hr className="border-gray-200" />
              <p className="text-sm font-semibold text-gray-700">MOA Details</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MOA Number</label>
                  <Input value={form.moa_number ?? ''} onChange={e => setForm(p => ({ ...p, moa_number: e.target.value || null }))} placeholder="MOA-2025-UST-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    value={form.moa_status} onChange={e => setForm(p => ({ ...p, moa_status: e.target.value as MoaStatus }))}>
                    {MOA_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Signed</label>
                  <Input type="date" value={form.moa_signed_date ?? ''} onChange={e => setForm(p => ({ ...p, moa_signed_date: e.target.value || null }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <Input type="date" value={form.moa_expiry_date ?? ''} onChange={e => setForm(p => ({ ...p, moa_expiry_date: e.target.value || null }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Slots / Term</label>
                  <Input type="number" min={1} value={form.max_slots_per_term ?? ''} onChange={e => setForm(p => ({ ...p, max_slots_per_term: e.target.value ? parseInt(e.target.value) : null }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload MOA Document (PDF)</label>
                <input type="file" accept=".pdf,.doc,.docx"
                  onChange={e => setMoaFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                {selected?.moa_file_path && !moaFile && (
                  <p className="text-xs text-gray-500 mt-1">A file is already uploaded. Upload a new file to replace it.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value || null }))} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
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
        title="Delete Partner Institution"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
