
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import {
  useReimbursements,
  useCreateReimbursement,
  useUpdateReimbursement,
  useDeleteReimbursement,
} from '@/hooks/useReimbursements'
import type { Reimbursement, ReimbursementInsert } from '@/services/reimbursement.service'

const typeOptions = [
  { value: 'transport', label: 'Transportation' },
  { value: 'per_diem', label: 'Per Diem (Daily Subsistence)' },
  { value: 'field_work', label: 'Field Work Allowance' },
  { value: 'communication', label: 'Communication Allowance' },
  { value: 'representation', label: 'Representation Allowance' },
  { value: 'medical', label: 'Medical / Emergency' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
]

type FormState = {
  name: string
  type: Reimbursement['type']
  amount: number
  taxable: boolean
  status: Reimbursement['status']
}

const emptyForm: FormState = { name: '', type: 'transport', amount: 0, taxable: false, status: 'Pending' }

export default function ReimbursementsPage() {
  const { data: reimbursements = [], isLoading } = useReimbursements()
  const createReimbursement = useCreateReimbursement()
  const updateReimbursement = useUpdateReimbursement()
  const deleteReimbursement = useDeleteReimbursement()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Reimbursement | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const handleAdd = () => {
    setEditData(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  const handleEdit = (r: Reimbursement) => {
    setEditData(r)
    setForm({ name: r.name, type: r.type, amount: r.amount, taxable: r.taxable, status: r.status })
    setModalOpen(true)
  }
  const handleDelete = (id: string) => { deleteReimbursement.mutate(id) }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: ReimbursementInsert = {
      name: form.name,
      type: form.type,
      amount: form.amount,
      taxable: form.taxable,
      status: form.status,
      is_active: true,
    }
    if (editData) {
      await updateReimbursement.mutateAsync({ id: editData.id, data: payload })
    } else {
      await createReimbursement.mutateAsync(payload)
    }
    setModalOpen(false)
  }
  const isPending = createReimbursement.isPending || updateReimbursement.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
        <p className="text-gray-600 mt-1">Configure reimbursement types and policies for field work, per diem, communication, and other allowances.</p>
      </div>

      {/* NGO Reimbursement Note */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>De Minimis / Tax-Free Allowances:</strong> Transportation reimbursements for actual costs and reasonable per diem for field assignments are generally not taxable under BIR regulations. Communication and representation allowances are partially taxable above de minimis limits.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reimbursement Types</h2>
          <Button variant="primary" onClick={handleAdd}>Add Reimbursement</Button>
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading…</p>
        ) : reimbursements.length === 0 ? (
          <p className="text-gray-600">No reimbursement types defined yet. Start by adding one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taxable</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reimbursements.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{typeOptions.find(t => t.value === r.type)?.label ?? r.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">₱{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{r.taxable ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        r.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(r)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)} disabled={deleteReimbursement.isPending}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Reimbursement</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <Input
                label="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Select
                label="Type"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Reimbursement['type'] }))}
                options={typeOptions}
                required
              />
              <Input
                label="Amount (PHP)"
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                min={0}
              />
              <Select
                label="Status"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Reimbursement['status'] }))}
                options={statusOptions}
                required
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.taxable}
                  onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))}
                />
                <span>Taxable (subject to withholding tax)</span>
              </label>
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
