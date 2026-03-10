
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'

interface BonusStructure {
  id: string
  name: string
  type: string
  amount: number
  schedule: string
}

const initialBonuses: BonusStructure[] = [
  { id: '1', name: '13th Month Pay', type: 'statutory', amount: 0, schedule: 'December' },
  { id: '2', name: 'Performance Bonus', type: 'performance', amount: 5000, schedule: 'Quarterly' },
  { id: '3', name: 'Christmas Bonus', type: 'other', amount: 3000, schedule: 'December' },
]

const typeOptions = [
  { value: 'statutory', label: 'Statutory' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
]

export default function BonusStructuresPage() {
  const [bonuses, setBonuses] = useState<BonusStructure[]>(initialBonuses)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<BonusStructure | null>(null)

  const handleAdd = () => { setEditData(null); setModalOpen(true) }
  const handleEdit = (b: BonusStructure) => { setEditData(b); setModalOpen(true) }
  const handleDelete = (id: string) => { setBonuses(bs => bs.filter(b => b.id !== id)) }
  const handleSave = (data: any) => {
    if (editData) {
      setBonuses(bs => bs.map(b => b.id === editData.id ? { ...b, ...data } : b))
    } else {
      setBonuses(bs => [...bs, { ...data, id: Date.now().toString() }])
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonus Structures</h1>
        <p className="text-gray-600 mt-1">Manage bonus structures and calculations including 13th month, performance, and other bonuses.</p>
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bonus Structures List</h2>
          <Button variant="primary" onClick={handleAdd}>Add Bonus</Button>
        </div>
        {bonuses.length === 0 ? (
          <p className="text-gray-600">No bonuses defined yet. Start by adding a new bonus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bonuses.map(bonus => (
                  <tr key={bonus.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{bonus.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{bonus.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{bonus.amount ? bonus.amount.toLocaleString() : '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{bonus.schedule}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(bonus)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(bonus.id)}>Delete</Button>
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
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Bonus</h3>
            <form onSubmit={e => { e.preventDefault(); handleSave(editData || form) }} className="space-y-3">
              <Input label="Name" value={editData?.name || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, schedule: '' }), name: e.target.value })} required />
              <Select label="Type" value={editData?.type || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, schedule: '' }), type: e.target.value })} options={typeOptions} required />
              <Input label="Amount (PHP)" type="number" value={editData?.amount || 0} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, schedule: '' }), amount: +e.target.value })} min={0} />
              <Input label="Schedule" value={editData?.schedule || ''} onChange={e => setEditData({ ...(editData || { id: '', name: '', type: '', amount: 0, schedule: '' }), schedule: e.target.value })} required />
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
