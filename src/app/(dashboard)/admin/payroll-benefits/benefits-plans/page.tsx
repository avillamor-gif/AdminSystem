
'use client'


import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import {
  useBenefitsPlans,
  useCreateBenefitsPlan,
  useUpdateBenefitsPlan,
  useDeleteBenefitsPlan,
  type BenefitsPlan
} from '@/hooks/useBenefitsPlans'

const typeOptions = [
  { value: 'government', label: 'Government Benefit (SSS/PhilHealth/Pag-IBIG)' },
  { value: 'health', label: 'Health / HMO Insurance' },
  { value: 'leave', label: 'Leave Credit / Monetization' },
  { value: 'rice', label: 'Rice Subsidy (De Minimis — ₱2,000/mo)' },
  { value: 'clothing', label: 'Clothing / Uniform Allowance (De Minimis — ₱6,000/yr)' },
  { value: 'laundry', label: 'Laundry Allowance (De Minimis — ₱300/mo)' },
  { value: 'medical_cash', label: 'Medical Cash Allowance (De Minimis — ₱750/mo)' },
  { value: 'meal', label: 'Meal Subsidy (De Minimis — ₱2,000/mo)' },
  { value: 'other', label: 'Other' },
]

// BIR de minimis benefit limits (2025)
const deMinimisLimits = [
  { name: 'Rice Subsidy', limit: '₱2,000 / month', note: 'In cash or kind' },
  { name: 'Clothing / Uniform Allowance', limit: '₱6,000 / year', note: 'Includes laundry' },
  { name: 'Laundry Allowance', limit: '₱300 / month', note: 'Actual laundry' },
  { name: 'Medical Cash Allowance', limit: '₱750 / month', note: 'To dependents' },
  { name: 'Meal Subsidy', limit: '₱2,000 / month', note: 'Not to exceed 25% of min. wage' },
  { name: 'Gifts (Christmas / Anniversary)', limit: '₱5,000 / year', note: 'In cash or kind' },
  { name: 'Daily Meal Allowance — OT', limit: '25% of daily min. wage', note: 'For overtime only' },
]


export default function BenefitsPlansPage() {
  const { data: plans = [], isLoading } = useBenefitsPlans()
  const createPlan = useCreateBenefitsPlan()
  const updatePlan = useUpdateBenefitsPlan()
  const deletePlan = useDeleteBenefitsPlan()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<BenefitsPlan> | null>(null)

  const handleAdd = () => { setEditData({}); setModalOpen(true) }
  const handleEdit = (plan: BenefitsPlan) => { setEditData(plan); setModalOpen(true) }
  const handleDelete = (id: string) => { deletePlan.mutate(id) }
  const handleSave = (data: Partial<BenefitsPlan>) => {
    if (editData && editData.id) {
      updatePlan.mutate({ id: editData.id, data })
    } else {
      createPlan.mutate(data)
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Benefits Plans</h1>
        <p className="text-gray-600 mt-1">Manage employee benefits plans including SSS, PhilHealth, Pag-IBIG, HMO, de minimis benefits, and leave credits.</p>
      </div>

      {/* De Minimis Reference Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">BIR De Minimis Benefit Limits (Tax-Exempt)</h2>
        <p className="text-sm text-gray-500 mb-4">Benefits within these limits are exempt from income tax and withholding tax for employees.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Benefit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax-Free Limit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {deMinimisLimits.map(d => (
                <tr key={d.name}>
                  <td className="px-4 py-2 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-2 text-gray-700">{d.limit}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Benefit Plans List</h2>
          <Button variant="primary" onClick={handleAdd}>Add Benefit Plan</Button>
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : plans.length === 0 ? (
          <p className="text-gray-600">No benefit plans defined yet. Start by adding a new plan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map(plan => (
                  <tr key={plan.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{plan.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{plan.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{plan.amount ? plan.amount.toLocaleString() : '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{plan.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(plan)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* Modal for add/edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">{editData && editData.id ? 'Edit' : 'Add'} Benefit Plan</h3>
            <form onSubmit={e => { e.preventDefault(); handleSave(editData || {}) }} className="space-y-3">
              <Input label="Name" value={editData?.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} required />
              <Select label="Type" value={editData?.type || ''} onChange={e => setEditData({ ...editData, type: e.target.value })} options={typeOptions} required />
              <Input label="Amount (PHP)" type="number" value={editData?.amount || 0} onChange={e => setEditData({ ...editData, amount: +e.target.value })} min={0} />
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={createPlan.isPending || updatePlan.isPending}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
