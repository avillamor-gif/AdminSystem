
'use client'


import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import {
  useTaxConfigurations,
  useCreateTaxConfiguration,
  useUpdateTaxConfiguration,
  useDeleteTaxConfiguration,
} from '@/hooks/useTaxConfigurations'


export default function TaxConfigurationPage() {
  const { data: brackets = [], isLoading } = useTaxConfigurations()
  const createMutation = useCreateTaxConfiguration()
  const updateMutation = useUpdateTaxConfiguration()
  const deleteMutation = useDeleteTaxConfiguration()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const handleEdit = (b: any) => { setEditing(b); setModalOpen(true) }
  const handleAdd = () => { setEditing({ min_income: 0, max_income: null, rate: 0, base_tax: 0 }); setModalOpen(true) }
  const handleSave = async (data: any) => {
    if (editing && editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    setModalOpen(false)
    setEditing(null)
  }
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Configuration</h1>
        <p className="text-gray-600 mt-1">Configure BIR tax tables. (SSS, PhilHealth, Pag-IBIG coming soon.)</p>
      </div>
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">BIR Tax Brackets (Monthly)</h2>
          <Button variant="primary" onClick={handleAdd} disabled={createMutation.isPending || updateMutation.isPending}>Add Bracket</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate (%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base Tax</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500">Loading...</td></tr>
              ) : brackets.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500">No tax brackets defined.</td></tr>
              ) : (
                brackets.map((b: any) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2">₱{Number(b.min_income).toLocaleString()}</td>
                    <td className="px-4 py-2">{b.max_income !== null ? `₱${Number(b.max_income).toLocaleString()}` : 'and up'}</td>
                    <td className="px-4 py-2">{b.rate}%</td>
                    <td className="px-4 py-2">₱{Number(b.base_tax).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(b)} className="mr-2" disabled={updateMutation.isPending}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)} disabled={deleteMutation.isPending}>Delete</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Modal for editing/adding brackets */}
        {modalOpen && editing && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="font-semibold mb-4">{editing.id ? 'Edit' : 'Add'} Tax Bracket</h3>
              <form onSubmit={e => { e.preventDefault(); handleSave(editing) }} className="space-y-3">
                <Input label="Min" type="number" value={editing.min_income} onChange={e => setEditing({ ...editing, min_income: +e.target.value })} required />
                <Input label="Max" type="number" value={editing.max_income ?? ''} onChange={e => setEditing({ ...editing, max_income: e.target.value ? +e.target.value : null })} />
                <Input label="Rate (%)" type="number" value={editing.rate} onChange={e => setEditing({ ...editing, rate: +e.target.value })} required />
                <Input label="Base Tax" type="number" value={editing.base_tax} onChange={e => setEditing({ ...editing, base_tax: +e.target.value })} required />
                <div className="flex gap-2 justify-end mt-4">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
      {/* SSS, PhilHealth, Pag-IBIG coming soon */}
    </div>
  )
}
