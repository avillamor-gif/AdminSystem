'use client'

import { useState } from 'react'
import { Shield, Heart, Plus, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useMyBenefitsEnrollments, useMyBereavementClaims, useCreateBereavementClaim } from '@/hooks'
import type { BereavementRelationship } from '@/services'
import { formatDate } from '@/lib/utils'

const RELATIONSHIP_LABELS: Record<BereavementRelationship, string> = {
  parent:  'Parent',
  sibling: 'Sibling',
  spouse:  'Spouse',
  child:   'Child',
  other:   'Other',
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

function BereavementClaimForm({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const createMutation = useCreateBereavementClaim()
  const [deceasedName, setDeceasedName] = useState('')
  const [relationship, setRelationship] = useState<BereavementRelationship>('parent')
  const [dateOfDeath, setDateOfDeath] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!deceasedName || !dateOfDeath) return
    await createMutation.mutateAsync({
      employee_id: employeeId,
      deceased_name: deceasedName,
      relationship,
      date_of_death: dateOfDeath,
      amount: 15000,
      notes: notes || null,
      requested_by: employeeId,
    })
    setDone(true)
  }

  if (done) return (
    <Modal open onClose={onClose} size="sm">
      <ModalBody>
        <div className="py-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Claim Submitted</h3>
          <p className="text-sm text-gray-500">
            Your bereavement assistance claim of <strong>₱15,000</strong> has been submitted. HR will process it shortly.
          </p>
        </div>
      </ModalBody>
      <ModalFooter><Button variant="primary" onClick={onClose}>Done</Button></ModalFooter>
    </Modal>
  )

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>File Bereavement Assistance Claim</ModalHeader>
      <ModalBody>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800 mb-4">
          IBON provides <strong>₱15,000</strong> financial assistance for immediate family bereavement (parent, sibling, spouse, or child).
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deceased Name *</label>
            <input type="text" value={deceasedName} onChange={e => setDeceasedName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
              <select value={relationship} onChange={e => setRelationship(e.target.value as BereavementRelationship)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(RELATIONSHIP_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death *</label>
              <input type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}
          disabled={!deceasedName || !dateOfDeath || createMutation.isPending}>
          {createMutation.isPending ? 'Submitting…' : 'Submit Claim'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default function MyBenefitsPage() {
  const { data: currentEmployee, isLoading: empLoading } = useCurrentEmployee()
  const employeeId = currentEmployee?.id ?? ''
  const { data: enrollments = [], isLoading: enrollLoading } = useMyBenefitsEnrollments(employeeId)
  const { data: claims = [], isLoading: claimsLoading } = useMyBereavementClaims(employeeId)
  const [showClaimForm, setShowClaimForm] = useState(false)

  if (empLoading || enrollLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading your benefits…</div>
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Benefits Enrollments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle>My Benefits Enrollments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {(enrollments as any[]).length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No active benefits enrollments on file. Please contact HR.</p>
          ) : (
            <div className="space-y-3">
              {(enrollments as any[]).map((e: any) => (
                <div key={e.id} className={`flex items-center justify-between p-3 rounded-lg border ${e.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{e.plan?.plan_name ?? '—'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Coverage: {e.coverage_type ?? '—'} · Employee share: ₱{e.employee_share?.toLocaleString() ?? '0'}/mo
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Enrolled {formatDate(e.enrollment_date)}</div>
                  </div>
                  <Badge className={e.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {e.is_active ? 'Active' : 'Ended'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bereavement Claims */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <CardTitle>Bereavement Assistance</CardTitle>
            </div>
            <Button variant="secondary" onClick={() => setShowClaimForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> File a Claim
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm text-rose-700 mb-4">
            IBON provides <strong>₱15,000</strong> financial assistance upon the death of an immediate family member.
          </div>
          {claimsLoading ? <p className="text-sm text-gray-400 py-4 text-center">Loading…</p> :
           (claims as any[]).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No bereavement claims on file.</p>
          ) : (
            <div className="space-y-2">
              {(claims as any[]).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.deceased_name}</div>
                    <div className="text-xs text-gray-500">
                      {RELATIONSHIP_LABELS[c.relationship as BereavementRelationship]} · {formatDate(c.date_of_death)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">₱{c.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showClaimForm && employeeId && (
        <BereavementClaimForm employeeId={employeeId} onClose={() => setShowClaimForm(false)} />
      )}
    </div>
  )
}
