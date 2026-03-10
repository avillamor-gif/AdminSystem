
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'

interface Reimbursement {
  id: string
  name: string
  type: string
  amount: number
  taxable: boolean
  status: string
}

const initialReimbursements: Reimbursement[] = [
  { id: '1', name: 'Transportation', type: 'transport', amount: 500, taxable: false, status: 'Approved' },
  { id: '2', name: 'Representation', type: 'representation', amount: 1200, taxable: true, status: 'Pending' },
]

const typeOptions = [
  { value: 'transport', label: 'Transportation' },
  { value: 'representation', label: 'Representation' },
  { value: 'other', label: 'Other' },
]
const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
]

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(initialReimbursements)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Reimbursement | null>(null)

  const handleAdd = () => { setEditData(null); setModalOpen(true) }
  const handleEdit = (r: Reimbursement) => { setEditData(r); setModalOpen(true) }
  const handleDelete = (id: string) => { setReimbursements(rs => rs.filter(r => r.id !== id)) }
  const handleSave = (data: any) => {
    if (editData) {
      setReimbursements(rs => rs.map(r => r.id === editData.id ? { ...r, ...data } : r))
    } else {
      setReimbursements(rs => [...rs, { ...data, id: Date.now().toString() }])
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
        <p className="text-gray-600 mt-1">Configure reimbursement policies, claims, and approval workflow.</p>
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reimbursements List</h2>
          <Button variant="primary" onClick={handleAdd}>Add Reimbursement</Button>
        </div>
        {reimbursements.length === 0 ? (
          <p className="text-gray-600">No reimbursements defined yet. Start by adding a new reimbursement.</p>
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
                    <td className="px-4 py-2 text-sm text-gray-600">{r.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{r.taxable ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{r.status}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(r)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
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
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Reimbursement</h3>
            <form onSubmit={e => { e.preventDefault(); handleSave(editData || form) }} className="space-y-3">
              <Input label="Name" value={editData?.name || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, taxable: false, status: 'Pending' }), name: e.target.value })} required />
              <Select label="Type" value={editData?.type || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, taxable: false, status: 'Pending' }), type: e.target.value })} options={typeOptions} required />
              <Input label="Amount (PHP)" type="number" value={editData?.amount || 0} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, taxable: false, status: 'Pending' }), amount: +e.target.value })} min={0} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editData?.taxable || false} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, taxable: false, status: 'Pending' }), taxable: e.target.checked })} />
                <span>Taxable</span>
              </label>
              <Select label="Status" value={editData?.status || 'Pending'} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, taxable: false, status: 'Pending' }), status: e.target.value })} options={statusOptions} required />
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
