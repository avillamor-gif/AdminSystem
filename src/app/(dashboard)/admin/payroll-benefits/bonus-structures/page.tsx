
'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import {
  useBonusStructures,
  useCreateBonusStructure,
  useUpdateBonusStructure,
  useDeleteBonusStructure,
} from '@/hooks/useBonusStructures'
import type { BonusStructure, BonusStructureInsert } from '@/services/bonusStructure.service'

const typeOptions = [
  { value: 'statutory', label: 'Statutory (13th Month Pay)' },
  { value: 'mid_year', label: 'Mid-Year Bonus' },
  { value: 'year_end', label: 'Year-End / Christmas Bonus' },
  { value: 'performance', label: 'Performance Incentive' },
  { value: 'project_based', label: 'Project-Based Incentive' },
  { value: 'other', label: 'Other' },
]

const scheduleOptions = [
  { value: 'January', label: 'January' },
  { value: 'June', label: 'June (Mid-Year)' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Semi-Annual', label: 'Semi-Annual' },
  { value: 'Upon Completion', label: 'Upon Project Completion' },
  { value: 'Annual', label: 'Annual' },
]

type FormState = {
  name: string
  type: BonusStructure['type']
  amount: number
  schedule: string
}

const emptyForm: FormState = { name: '', type: 'statutory', amount: 0, schedule: 'December' }

export default function BonusStructuresPage() {
  const { data: bonuses = [], isLoading } = useBonusStructures()
  const createBonus = useCreateBonusStructure()
  const updateBonus = useUpdateBonusStructure()
  const deleteBonus = useDeleteBonusStructure()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<BonusStructure | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const handleAdd = () => {
    setEditData(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  const handleEdit = (b: BonusStructure) => {
    setEditData(b)
    setForm({ name: b.name, type: b.type, amount: b.amount, schedule: b.schedule })
    setModalOpen(true)
  }
  const handleDelete = (id: string) => { deleteBonus.mutate(id) }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: BonusStructureInsert = {
      name: form.name,
      type: form.type,
      amount: form.amount,
      schedule: form.schedule,
      is_active: true,
    }
    if (editData) {
      await updateBonus.mutateAsync({ id: editData.id, data: payload })
    } else {
      await createBonus.mutateAsync(payload)
    }
    setModalOpen(false)
  }
  const isPending = createBonus.isPending || updateBonus.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonus Structures</h1>
        <p className="text-gray-600 mt-1">Manage bonus and incentive structures including the mandatory 13th Month Pay and NGO-specific incentive programs.</p>
      </div>

      {/* Statutory Note */}
      <Card className="p-4 bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Philippine Law (RA 6686 / PD 851):</strong> All rank-and-file employees who have worked at least one month are entitled to 13th Month Pay equivalent to 1/12 of their total basic salary for the year, paid on or before December 24. This applies to NGOs.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bonus Structures</h2>
          <Button variant="primary" onClick={handleAdd}>Add Bonus</Button>
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading…</p>
        ) : bonuses.length === 0 ? (
          <p className="text-gray-600">No bonuses defined yet. Start by adding a new bonus structure.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bonuses.map(bonus => (
                  <tr key={bonus.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{bonus.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{typeOptions.find(t => t.value === bonus.type)?.label ?? bonus.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{bonus.amount ? `₱${bonus.amount.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{bonus.schedule}</td>
                    <td className="px-4 py-2 text-sm">{bonus.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(bonus)} className="mr-2">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(bonus.id)} disabled={deleteBonus.isPending}>Delete</Button>
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
            <h3 className="font-semibold mb-4">{editData ? 'Edit' : 'Add'} Bonus</h3>
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
                onChange={e => setForm(f => ({ ...f, type: e.target.value as BonusStructure['type'] }))}
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
                label="Schedule"
                value={form.schedule}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                options={scheduleOptions}
                required
              />
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
