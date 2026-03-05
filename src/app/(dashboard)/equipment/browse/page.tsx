'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Package, Search, X } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useAssets, useAssetCategories } from '@/hooks/useAssets'
import type { Asset } from '@/services/asset.service'

const today = new Date().toISOString().split('T')[0]

export default function BrowseEquipmentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: assets = [], isLoading } = useAssets({ status: 'available' })
  const { data: categories = [] } = useAssetCategories()

  // Filter assets for the table
  const filtered = assets.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a as any).category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || (a as any).category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  function goToCheckout(asset: Asset) {
    router.push(`/equipment/checkout?asset=${asset.id}`)
  }

  const conditionColors: Record<string, string> = {
    new: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Equipment</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all available equipment and submit a request.
        </p>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
          <p className="text-sm text-gray-500 mt-1">Available Items</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Search className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          <p className="text-sm text-gray-500 mt-1">Matching Results</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, tag or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {(searchQuery || categoryFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('') }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Available Equipment</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading equipment...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Monitor className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No available equipment found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Asset Tag', 'Name', 'Category', 'Brand / Model', 'Condition', 'Location', ''].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((asset) => {
                  const a = asset as any
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {asset.asset_tag || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {a.category?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {[a.brand?.name, asset.model].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.condition ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${conditionColors[asset.condition] || 'bg-gray-100 text-gray-700'}`}
                          >
                            {asset.condition}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asset.location || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => goToCheckout(asset)}
                          className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                        >
                          Checkout
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>


    </div>
  )
}
