
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
        <p className="text-gray-600 mt-1">Configure BIR TRAIN Law tax brackets and view mandatory government contribution rates (SSS, PhilHealth, Pag-IBIG).</p>
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

      {/* SSS Contribution Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">SSS Contribution Table (2025)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Total rate: <strong>14%</strong> (EE 4.5% + ER 9.5%). Monthly Salary Credit (MSC) range: ₱4,000–₱30,000.
          Mandatory for all employees including NGO staff.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly Salary Range</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MSC</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EE Share (4.5%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ER Share (9.5%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {[
                { range: 'Below ₱4,250', msc: 4000, ee: 180, er: 380, total: 560 },
                { range: '₱4,250 – ₱4,749.99', msc: 4500, ee: 202.5, er: 427.5, total: 630 },
                { range: '₱7,750 – ₱8,249.99', msc: 8000, ee: 360, er: 760, total: 1120 },
                { range: '₱14,750 – ₱15,249.99', msc: 15000, ee: 675, er: 1425, total: 2100 },
                { range: '₱19,750 – ₱20,249.99', msc: 20000, ee: 900, er: 1900, total: 2800 },
                { range: '₱24,750 – ₱25,249.99', msc: 25000, ee: 1125, er: 2375, total: 3500 },
                { range: '₱29,750 and above', msc: 30000, ee: 1350, er: 2850, total: 4200 },
              ].map(row => (
                <tr key={row.msc}>
                  <td className="px-4 py-2 text-gray-700">{row.range}</td>
                  <td className="px-4 py-2 text-gray-700">₱{row.msc.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-700">₱{row.ee.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-700">₱{row.er.toLocaleString()}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">₱{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Showing selected salary brackets. Refer to SSS circular for full schedule.</p>
      </Card>

      {/* PhilHealth Contribution Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">PhilHealth Contribution (2025)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Rate: <strong>5%</strong> of basic monthly salary (EE 2.5% + ER 2.5%). Salary ceiling: ₱100,000.
          Minimum monthly contribution: ₱500 (based on ₱10,000 floor).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Basic Monthly Salary</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EE Share (2.5%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ER Share (2.5%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Monthly Premium</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {[
                { salary: '₱10,000 (minimum)', ee: 250, er: 250, total: 500 },
                { salary: '₱15,000', ee: 375, er: 375, total: 750 },
                { salary: '₱20,000', ee: 500, er: 500, total: 1000 },
                { salary: '₱30,000', ee: 750, er: 750, total: 1500 },
                { salary: '₱50,000', ee: 1250, er: 1250, total: 2500 },
                { salary: '₱100,000 (ceiling)', ee: 2500, er: 2500, total: 5000 },
              ].map(row => (
                <tr key={row.salary}>
                  <td className="px-4 py-2 text-gray-700">{row.salary}</td>
                  <td className="px-4 py-2 text-gray-700">₱{row.ee.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-700">₱{row.er.toLocaleString()}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">₱{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pag-IBIG Contribution */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Pag-IBIG (HDMF) Contribution (2025)</h2>
        <p className="text-sm text-gray-500 mb-4">
          EE: 1% if monthly compensation ≤ ₱1,500; 2% if &gt; ₱1,500.
          ER: 2% of monthly compensation, capped at <strong>₱100/month</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly Compensation</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EE Rate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EE Share</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ER Share (capped ₱100)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              <tr>
                <td className="px-4 py-2 text-gray-700">₱1,500 and below</td>
                <td className="px-4 py-2 text-gray-700">1%</td>
                <td className="px-4 py-2 text-gray-700">₱15 max</td>
                <td className="px-4 py-2 text-gray-700">₱30 max</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-700">Above ₱1,500</td>
                <td className="px-4 py-2 text-gray-700">2%</td>
                <td className="px-4 py-2 text-gray-700">2% of salary</td>
                <td className="px-4 py-2 text-gray-700">₱100 (max)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Employees may opt to contribute more than the mandatory minimum.</p>
      </Card>
    </div>
  )
}
