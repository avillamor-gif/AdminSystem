'use client'


import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { PayComponentForm } from '@/components/admin/payroll/PayComponentForm'
import {
  usePayComponents,
  useCreatePayComponent,
  useUpdatePayComponent,
  useDeletePayComponent,
} from '@/hooks/usePayComponents'


export default function PayComponentsPage() {
  const { data: components = [], isLoading } = usePayComponents()
  const createMutation = useCreatePayComponent()
  const updateMutation = useUpdatePayComponent()
  const deleteMutation = useDeletePayComponent()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }
  const handleEdit = (comp: any) => {
    setEditData(comp)
    setModalOpen(true)
  }
  const handleSave = async (data: any) => {
    if (editData && editData.id) {
      await updateMutation.mutateAsync({ id: editData.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    setModalOpen(false)
  }
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pay Components</h1>
        <p className="text-gray-600 mt-1">
          Define and manage pay components such as salary, allowances, RATA, overtime, and more.
        </p>
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Component List</h2>
          <Button variant="primary" onClick={handleAdd} disabled={createMutation.isPending || updateMutation.isPending}>
            Add Pay Component
          </Button>
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : components.length === 0 ? (
          <p className="text-gray-600">No pay components defined yet. Start by adding a new component.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (PHP)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taxable</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {components.map((comp: any) => (
                  <tr key={comp.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{comp.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{comp.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{Number(comp.amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm">{comp.taxable ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(comp)} className="mr-2" disabled={updateMutation.isPending}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(comp.id)} disabled={deleteMutation.isPending}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <PayComponentForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
