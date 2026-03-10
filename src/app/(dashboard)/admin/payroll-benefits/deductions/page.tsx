
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import {
  useDeductions,
  useCreateDeduction,
  useUpdateDeduction,
  useDeleteDeduction,
} from '@/hooks/useDeductions'
import type { Deduction, DeductionInsert } from '@/services/deduction.service'

const typeOptions = [
  { value: 'sss', label: 'SSS (Social Security System)' },
  { value: 'philhealth', label: 'PhilHealth' },
  { value: 'pagibig', label: 'Pag-IBIG / HDMF' },
  { value: 'bir_withholding', label: 'BIR Withholding Tax' },
  { value: 'company', label: 'Company Deduction' },
  { value: 'other', label: 'Other' },
]

// Read-only reference: Philippine mandatory government contribution rates (2025)
const govtContributions = [
  {
    name: 'SSS',
    ee: '4.5%',
    er: '9.5%',
    basis: 'Monthly Salary Credit (MSC), max ₱30,000',
    note: 'Total 14%. EE max ₱1,350/mo; ER max ₱2,850/mo at ceiling.',
  },
  {
    name: 'PhilHealth',
    ee: '2.5%',
    er: '2.5%',
    basis: 'Basic monthly salary, max ₱100,000',
    note: 'Total 5%. Premium capped at ₱2,500/mo per party.',
  },
  {
    name: 'Pag-IBIG (HDMF)',
    ee: '1–2%',
    er: '2%',
    basis: 'Monthly compensation',
    note: 'EE: 1% if ≤₱1,500; 2% if >₱1,500. ER contribution capped at ₱100/mo.',
  },
]

type FormState = {
  name: string
  type: Deduction['type']
  amount: number
  recurring: boolean
}

const emptyForm: FormState = { name: '', type: 'company', amount: 0, recurring: false }

export default function DeductionsPage() {
  const { data: deductions = [], isLoading } = useDeductions()
  const createDeduction = useCreateDeduction()
  const updateDeduction = useUpdateDeduction()
  const deleteDeduction = useDeleteDeduction()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Deduction | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const handleAdd = () => {
    setEditData(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  const handleEdit = (d: Deduction) => {
    setEditData(d)
    setForm({ name: d.name, type: d.type, amount: d.amount, recurring: d.recurring })
    setModalOpen(true)
  }
  const handleDelete = (id: string) => { deleteDeduction.mutate(id) }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: DeductionInsert = {
      name: form.name,
      type: form.type,
      amount: form.amount,
      recurring: form.recurring,
      is_active: true,
    }
    if (editData) {
      await updateDeduction.mutateAsync({ id: editData.id, data: payload })
    } else {
      await createDeduction.mutateAsync(payload)
    }
    setModalOpen(false)
  }
  const isPending = createDeduction.isPending || updateDeduction.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deductions</h1>
        <p className="text-gray-600 mt-1">Configure payroll deductions including mandatory government contributions and company deductions.</p>
      </div>

      {/* Government Contribution Reference Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Mandatory Government Contributions (2025 Reference)</h2>
        <p className="text-sm text-gray-500 mb-4">
          These rates apply to all employees including those of non-stock, non-profit organizations (IBON International). For reference only.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contribution</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee Share</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employer Share</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Basis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {govtContributions.map(c => (
                <tr key={c.name}>
                  <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-gray-700">{c.ee}</td>
                  <td className="px-4 py-2 text-gray-700">{c.er}</td>
                  <td className="px-4 py-2 text-gray-600">{c.basis}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Configurable Deductions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Deduction Definitions</h2>
          <Button variant="primary" onClick={handleAdd}>Add Deduction</Button>
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading…</p>
        ) : deductions.length === 0 ? (
          <p className="text-gray-600">No deductions defined yet. Start by adding a new deduction.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurring</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deductions.map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{d.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{typeOptions.find(t => t.value === d.type)?.label ?? d.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">₱{d.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{d.recurring ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-sm">{d.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(d)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(d.id)} disabled={deleteDeduction.isPending}>Delete</Button>
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
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Deduction</h3>
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
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Deduction['type'] }))}
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                />
                <span>Recurring (deducted every payroll run)</span>
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
