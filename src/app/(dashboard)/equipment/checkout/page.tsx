'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Monitor, Search, X, CheckCircle } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useAssets, useAssetCategories, useCreateAssetRequest } from '@/hooks/useAssets'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import type { Asset } from '@/services/asset.service'
import toast from 'react-hot-toast'

interface CheckoutFormData {
  asset_id: string
  purpose: string
  borrowed_date: string
  expected_return_date: string
  notes: string
}

const today = new Date().toISOString().split('T')[0]

function CheckoutPageInner() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('asset') ?? ''

  const [formData, setFormData] = useState<CheckoutFormData>({
    asset_id: preselectedId,
    purpose: '',
    borrowed_date: today,
    expected_return_date: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  // If the URL changes (e.g. user navigates from browse with a different asset)
  useEffect(() => {
    if (preselectedId) {
      setFormData(p => ({ ...p, asset_id: preselectedId }))
    }
  }, [preselectedId])

  const { data: assets = [] } = useAssets({ status: 'available' })
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateAssetRequest()

  const employeeName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
    : '—'

  const selectedAsset = assets.find(a => a.id === formData.asset_id) as
    | (Asset & { category?: { name: string }; brand?: { name: string } })
    | undefined

  function resetForm() {
    setFormData({ asset_id: '', purpose: '', borrowed_date: today, expected_return_date: '', notes: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentEmployee?.id) { toast.error('Could not determine your employee profile.'); return }
    if (!formData.asset_id) { toast.error('Please select an equipment item.'); return }
    if (!formData.purpose.trim()) { toast.error('Please provide a purpose.'); return }
    if (!formData.expected_return_date) { toast.error('Please provide an expected return date.'); return }

    const notesText = [`Expected return: ${formData.expected_return_date}`, formData.notes.trim()]
      .filter(Boolean).join('\n')

    await createMutation.mutateAsync({
      employee_id: currentEmployee.id,
      category_id: (selectedAsset as any)?.category_id || undefined,
      item_description: selectedAsset?.name || formData.asset_id,
      justification: formData.purpose.trim(),
      requested_date: formData.borrowed_date,
      notes: notesText || undefined,
      priority: 'normal',
      status: 'pending',
    })
    resetForm()
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Equipment Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Request to borrow a piece of equipment</p>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Checkout request submitted successfully</p>
            <p className="text-xs text-green-600 mt-0.5">Your request is pending approval.</p>
          </div>
          <button className="ml-auto text-green-500 hover:text-green-700 text-xs" onClick={() => setSubmitted(false)}>Dismiss</button>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-5 border border-gray-200 rounded-xl space-y-5 bg-gray-50/40">

            {/* Row 1: Employee + Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Name</label>
                <input
                  type="text"
                  value={employeeName}
                  disabled
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Equipment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.asset_id}
                  onChange={e => setFormData(p => ({ ...p, asset_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select Equipment --</option>
                  {assets.map(a => {
                    const cat = (a as any).category?.name
                    const cond = a.condition ? `- ${a.condition.charAt(0).toUpperCase() + a.condition.slice(1)}` : ''
                    return (
                      <option key={a.id} value={a.id}>
                        {[a.name, cat ? `(${cat})` : '', cond].filter(Boolean).join(' ')}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Selected asset details */}
            {selectedAsset && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-gray-500">Category: </span><span className="font-medium text-gray-800">{(selectedAsset as any).category?.name || '—'}</span></div>
                <div><span className="text-gray-500">Location: </span><span className="font-medium text-gray-800">{selectedAsset.location || '—'}</span></div>
                <div><span className="text-gray-500">Condition: </span><span className="font-medium text-gray-800 capitalize">{selectedAsset.condition || '—'}</span></div>
                <div><span className="text-gray-500">Quantity Available: </span><span className="font-medium text-gray-800">1</span></div>
              </div>
            )}

            {/* Row 2: Purpose + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))}
                  placeholder="e.g., Business presentation"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Borrowed Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.borrowed_date}
                  onChange={e => setFormData(p => ({ ...p, borrowed_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expected Return Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={e => setFormData(p => ({ ...p, expected_return_date: e.target.value }))}
                  required
                  min={formData.borrowed_date || today}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any special requirements or notes..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-gray-500">* Required fields</p>
            <Button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white px-6">
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function EquipmentCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 text-sm">Loading...</div>}>
      <CheckoutPageInner />
    </Suspense>
  )
}
