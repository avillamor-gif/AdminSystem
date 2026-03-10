
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'

interface Deduction {
  id: string
  name: string
  type: string
  amount: number
  recurring: boolean
}

const initialDeductions: Deduction[] = [
  { id: '1', name: 'SSS', type: 'government', amount: 600, recurring: true },
  { id: '2', name: 'PhilHealth', type: 'government', amount: 400, recurring: true },
  { id: '3', name: 'Pag-IBIG', type: 'government', amount: 100, recurring: true },
  { id: '4', name: 'Company Loan', type: 'company', amount: 2000, recurring: false },
  { id: '5', name: 'Absence', type: 'other', amount: 500, recurring: false },
]

const typeOptions = [
  { value: 'government', label: 'Government' },
  { value: 'company', label: 'Company' },
  { value: 'other', label: 'Other' },
]

export default function DeductionsPage() {
  const [deductions, setDeductions] = useState<Deduction[]>(initialDeductions)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Deduction | null>(null)

  const handleAdd = () => { setEditData(null); setModalOpen(true) }
  const handleEdit = (d: Deduction) => { setEditData(d); setModalOpen(true) }
  const handleDelete = (id: string) => { setDeductions(ds => ds.filter(d => d.id !== id)) }
  const handleSave = (data: any) => {
    if (editData) {
      setDeductions(ds => ds.map(d => d.id === editData.id ? { ...d, ...data } : d))
    } else {
      setDeductions(ds => [...ds, { ...data, id: Date.now().toString() }])
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deductions</h1>
        <p className="text-gray-600 mt-1">Configure payroll deductions including government, company, and other deductions.</p>
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Deductions List</h2>
          <Button variant="primary" onClick={handleAdd}>Add Deduction</Button>
        </div>
        {deductions.length === 0 ? (
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
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deductions.map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{d.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{d.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{d.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{d.recurring ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(d)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(d.id)}>Delete</Button>
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
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Deduction</h3>
            <form onSubmit={e => { e.preventDefault(); handleSave(editData || form) }} className="space-y-3">
              <Input label="Name" value={editData?.name || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, recurring: false }), name: e.target.value })} required />
              <Select label="Type" value={editData?.type || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, recurring: false }), type: e.target.value })} options={typeOptions} required />
              <Input label="Amount (PHP)" type="number" value={editData?.amount || 0} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, recurring: false }), amount: +e.target.value })} min={0} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editData?.recurring || false} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, recurring: false }), recurring: e.target.checked })} />
                <span>Recurring</span>
              </label>
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
