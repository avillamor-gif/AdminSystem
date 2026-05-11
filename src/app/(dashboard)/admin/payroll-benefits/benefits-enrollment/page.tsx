'use client'

import { useState, useMemo } from 'react'
import { Shield, Plus, Search } from 'lucide-react'
import { Card, CardContent, Button, Avatar, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useBenefitsEnrollments, useEnrollBenefit, useTerminateBenefit } from '@/hooks'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useEmployees } from '@/hooks/useEmployees'
import { useBenefitsPlans } from '@/hooks/useBenefitsPlans'
import type { EnrollmentWithRelations } from '@/services'
import { formatDate, localDateStr } from '@/lib/utils'

function EnrollModal({ onClose }: { onClose: () => void }) {
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const { data: plans = [] } = useBenefitsPlans()
  const { data: currentEmployee } = useCurrentEmployee()
  const enrollMutation = useEnrollBenefit()

  const [employeeId, setEmployeeId] = useState('')
  const [planId, setPlanId] = useState('')
  const [coverageType, setCoverageType] = useState<'employee_only' | 'with_dependents'>('employee_only')
  const [enrollmentDate, setEnrollmentDate] = useState(localDateStr(new Date()))
  const [effectivityDate, setEffectivityDate] = useState('')

  const selectedPlan = (plans as any[]).find((p: any) => p.id === planId)
  const totalPremium = selectedPlan?.amount ?? 0
  const employeeShare = parseFloat((totalPremium * 0.5).toFixed(2))
  const employerShare = parseFloat((totalPremium * 0.5).toFixed(2))

  const handleSubmit = async () => {
    if (!employeeId || !planId) return
    await enrollMutation.mutateAsync({
      employee_id: employeeId,
      benefits_plan_id: planId,
      enrollment_date: enrollmentDate,
      effectivity_date: effectivityDate || null,
      coverage_type: coverageType,
      employee_share: employeeShare,
      employer_share: employerShare,
      total_premium: totalPremium,
      enrolled_by: currentEmployee?.id ?? null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>Enroll Employee in Benefit</ModalHeader>
      <ModalBody>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Plan *</label>
            <select value={planId} onChange={e => setPlanId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select plan…</option>
              {(plans as any[]).filter((p: any) => p.is_active).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} — ₱{p.amount?.toLocaleString()}/mo</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coverage</label>
            <select value={coverageType} onChange={e => setCoverageType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="employee_only">Employee Only (50/50 cost share)</option>
              <option value="with_dependents">With Dependents (additional at employee's cost)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <input type="date" value={enrollmentDate} onChange={e => setEnrollmentDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effectivity Date</label>
              <input type="date" value={effectivityDate} onChange={e => setEffectivityDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          {selectedPlan && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium text-blue-900">Cost Split (50/50)</div>
              <div className="text-blue-700">Employee share: ₱{employeeShare.toLocaleString()}/mo</div>
              <div className="text-blue-700">Employer share: ₱{employerShare.toLocaleString()}/mo</div>
              <div className="text-blue-600">Total premium: ₱{totalPremium.toLocaleString()}/mo</div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!employeeId || !planId || enrollMutation.isPending}>
          {enrollMutation.isPending ? 'Enrolling…' : 'Enroll'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default function BenefitsEnrollmentPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('active')
  const [showEnroll, setShowEnroll] = useState(false)
  const { data: enrollments = [], isLoading } = useBenefitsEnrollments()
  const terminateMutation = useTerminateBenefit()

  const filtered = useMemo(() => {
    return enrollments.filter(e => {
      const name = e.employee ? `${e.employee.first_name} ${e.employee.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchActive = activeFilter === 'all' || (activeFilter === 'active' ? e.is_active : !e.is_active)
      return matchSearch && matchActive
    })
  }, [enrollments, search, activeFilter])

  const handleTerminate = async (e: EnrollmentWithRelations) => {
    const endDate = prompt('Enter end date (YYYY-MM-DD):')
    if (!endDate) return
    await terminateMutation.mutateAsync({ id: e.id, endDate })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benefits Enrollment</h1>
          <p className="text-sm text-gray-500 mt-1">HMO and benefit plan enrollment — 50/50 cost share per IBON policy</p>
        </div>
        <Button variant="primary" onClick={() => setShowEnroll(true)}>
          <Plus className="w-4 h-4 mr-2" /> Enroll Employee
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="active">Active</option>
          <option value="inactive">Ended</option>
          <option value="all">All</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No enrollments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Coverage</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee Share</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Enrolled</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={e.employee?.avatar_url} firstName={e.employee?.first_name ?? '?'} lastName={e.employee?.last_name ?? ''} size="sm" />
                          <span className="font-medium text-gray-900">
                            {e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.benefits_plan?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {e.coverage_type === 'employee_only' ? 'Employee Only' : 'With Dependents'}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {e.employee_share != null ? `₱${e.employee_share.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(e.enrollment_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                          {e.is_active ? 'Active' : 'Ended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.is_active && (
                          <Button variant="ghost" onClick={() => handleTerminate(e)} className="text-xs text-gray-400">
                            End
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showEnroll && <EnrollModal onClose={() => setShowEnroll(false)} />}
    </div>
  )
}
