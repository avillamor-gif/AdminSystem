
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
  { value: 'government', label: 'Government' },
  { value: 'health', label: 'Health/HMO' },
  { value: 'leave', label: 'Leave Credit' },
  { value: 'other', label: 'Other' },
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
        <p className="text-gray-600 mt-1">Manage employee benefits plans including SSS, PhilHealth, Pag-IBIG, HMO, and leave credits.</p>
      </div>
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
