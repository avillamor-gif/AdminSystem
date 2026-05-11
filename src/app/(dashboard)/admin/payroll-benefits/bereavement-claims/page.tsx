'use client'

import { useState, useMemo } from 'react'
import { Heart, Plus, Search, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, Button, Avatar, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useBereavementClaims, useApproveBereavementClaim, useReleaseBereavementClaim } from '@/hooks'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useEmployees } from '@/hooks/useEmployees'
import { useCreateBereavementClaim } from '@/hooks'
import type { BereavementClaimWithRelations, BereavementRelationship, BereavementClaimStatus } from '@/services'
import { formatDate, localDateStr } from '@/lib/utils'

const STATUS_COLORS: Record<BereavementClaimStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

const RELATIONSHIP_LABELS: Record<BereavementRelationship, string> = {
  parent:  'Parent',
  sibling: 'Sibling',
  spouse:  'Spouse',
  child:   'Child',
  other:   'Other',
}

function NewClaimModal({ onClose }: { onClose: () => void }) {
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateBereavementClaim()

  const [employeeId, setEmployeeId] = useState('')
  const [deceasedName, setDeceasedName] = useState('')
  const [relationship, setRelationship] = useState<BereavementRelationship>('parent')
  const [dateOfDeath, setDateOfDeath] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!employeeId || !deceasedName || !dateOfDeath) return
    await createMutation.mutateAsync({
      employee_id: employeeId,
      deceased_name: deceasedName,
      relationship,
      date_of_death: dateOfDeath,
      amount: 15000,
      notes: notes || null,
      requested_by: currentEmployee?.id ?? null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>New Bereavement Assistance Claim</ModalHeader>
      <ModalBody>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
          Per IBON policy: <strong>PHP 15,000</strong> financial assistance for immediate family (parent, sibling, spouse, or child).
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select employee…</option>
              {(employees as any[]).map((e: any) => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deceased Name *</label>
              <input type="text" value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
              <select value={relationship} onChange={e => setRelationship(e.target.value as BereavementRelationship)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(RELATIONSHIP_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death *</label>
            <input type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}
          disabled={!employeeId || !deceasedName || !dateOfDeath || createMutation.isPending}>
          {createMutation.isPending ? 'Submitting…' : 'Submit Claim'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default function BereavementClaimsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  const { data: claims = [], isLoading } = useBereavementClaims()
  const { data: currentEmployee } = useCurrentEmployee()
  const approveMutation = useApproveBereavementClaim()
  const releaseMutation = useReleaseBereavementClaim()

  const filtered = useMemo(() => {
    return claims.filter(c => {
      const name = c.employee ? `${c.employee.first_name} ${c.employee.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [claims, search, statusFilter])

  const totalReleased = claims.filter(c => c.status === 'released').reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bereavement Assistance Claims</h1>
          <p className="text-sm text-gray-500 mt-1">
            PHP 15,000 financial assistance for immediate family bereavement
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Claim
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-700">{claims.filter(c => c.status === 'pending').length}</div>
          <div className="text-xs text-gray-500 mt-1">Pending</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-green-700">{claims.filter(c => c.status === 'released').length}</div>
          <div className="text-xs text-gray-500 mt-1">Released</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-gray-900">₱{totalReleased.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Total Released</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="released">Released</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No bereavement claims on file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Deceased</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Relationship</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date of Death</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.employee?.avatar_url} firstName={c.employee?.first_name ?? '?'} lastName={c.employee?.last_name ?? ''} size="sm" />
                          <span className="font-medium text-gray-900">
                            {c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.deceased_name}</td>
                      <td className="px-4 py-3 text-gray-600">{RELATIONSHIP_LABELS[c.relationship]}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(c.date_of_death)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">₱{c.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'pending' && (
                            <Button variant="primary" className="text-xs px-2 py-1"
                              onClick={() => approveMutation.mutateAsync({ id: c.id, approverId: currentEmployee?.id ?? '' })}
                              disabled={approveMutation.isPending}>
                              Approve
                            </Button>
                          )}
                          {c.status === 'approved' && (
                            <Button variant="primary" className="text-xs px-2 py-1"
                              onClick={() => releaseMutation.mutateAsync(c.id)}
                              disabled={releaseMutation.isPending}>
                              Release ₱15,000
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showNew && <NewClaimModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
