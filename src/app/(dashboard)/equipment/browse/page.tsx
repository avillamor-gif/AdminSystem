'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Package, Search, X, CalendarX, CalendarCheck } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useAssets, useAssetCategories, useAssetRequests } from '@/hooks/useAssets'
import { localDateStr } from '@/lib/utils'
import type { Asset } from '@/services/asset.service'

const today = localDateStr(new Date())

export default function BrowseEquipmentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'borrowed'>('all')

  // Load both available and currently-assigned (borrowed) assets
  const { data: availableAssets = [], isLoading: loadingAvailable } = useAssets({ status: 'available' })
  const { data: assignedAssets = [], isLoading: loadingAssigned } = useAssets({ status: 'assigned' })
  const { data: categories = [] } = useAssetCategories()

  // Active borrow requests to determine when borrowed items will be free
  const { data: fulfilledRequests = [] } = useAssetRequests({ status: 'fulfilled' })
  const { data: approvedRequests = [] } = useAssetRequests({ status: 'approved' })
  const { data: pendingRequests = [] } = useAssetRequests({ status: 'pending' })

  const isLoading = loadingAvailable || loadingAssigned

  // Build assetId → latest borrow_end_date for non-returned active borrows
  const borrowedEndMap: Record<string, string | null> = {}
  for (const r of [...fulfilledRequests, ...approvedRequests, ...pendingRequests]) {
    if (!(r as any).returned_date) {
      const assetId = (r as any).asset_id || (r as any).assigned_asset_id
      if (assetId) {
        const existing = borrowedEndMap[assetId]
        const end = r.borrow_end_date ?? null
        if (!existing || (end && end > existing)) borrowedEndMap[assetId] = end
      }
    }
  }

  const allAssets = [...availableAssets, ...assignedAssets]

  const filtered = allAssets.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a as any).category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || (a as any).category_id === categoryFilter
    const isBorrowed = a.status === 'assigned' || !!borrowedEndMap[a.id]
    if (availabilityFilter === 'available' && isBorrowed) return false
    if (availabilityFilter === 'borrowed' && !isBorrowed) return false
    return matchesSearch && matchesCategory
  })

  const availableCount = allAssets.filter(a => a.status === 'available' && !borrowedEndMap[a.id]).length
  const borrowedCount  = allAssets.filter(a => a.status === 'assigned' || !!borrowedEndMap[a.id]).length

  function goToCheckout(asset: Asset) {
    router.push(`/equipment/checkout?asset=${asset.id}`)
  }

  const conditionColors: Record<string, string> = {
    new:  'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Equipment</h1>
        <p className="text-sm text-gray-500 mt-1">View all equipment and check availability before requesting.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3"><CalendarCheck className="h-6 w-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
          <p className="text-sm text-gray-500 mt-1">Available Now</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-xl mb-3"><CalendarX className="h-6 w-6 text-red-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{borrowedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Currently Borrowed</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3"><Package className="h-6 w-6 text-purple-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value as any)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Availability</option>
          <option value="available">Available Now</option>
          <option value="borrowed">Currently Borrowed</option>
        </select>
        {(searchQuery || categoryFilter || availabilityFilter !== 'all') && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter(''); setAvailabilityFilter('all') }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Equipment Inventory</h2>
          <span className="text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading equipment...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Monitor className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No equipment found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Asset Tag', 'Name', 'Category', 'Brand / Model', 'Condition', 'Location', 'Availability', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((asset) => {
                  const a = asset as any
                  const isBorrowed = asset.status === 'assigned' || !!borrowedEndMap[asset.id]
                  const endDate = borrowedEndMap[asset.id]
                  const nextAvailable = endDate
                    ? (() => { const d = new Date(endDate + 'T00:00:00'); d.setDate(d.getDate() + 1); return localDateStr(d) })()
                    : null

                  return (
                    <tr key={asset.id} className={`transition-colors ${isBorrowed ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{asset.asset_tag || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{a.category?.name || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {[a.brand?.name, asset.model].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.condition
                          ? <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${conditionColors[asset.condition] || 'bg-gray-100 text-gray-700'}`}>{asset.condition}</span>
                          : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.location || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBorrowed ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <CalendarX className="w-3 h-3" /> Borrowed
                            </span>
                            {nextAvailable && (
                              <p className="text-[11px] text-green-700 font-medium mt-0.5">Free from {nextAvailable}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CalendarCheck className="w-3 h-3" /> Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => goToCheckout(asset)}
                          className={`text-sm font-medium transition-colors ${isBorrowed ? 'text-gray-400 hover:text-gray-600' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {isBorrowed ? 'Schedule' : 'Checkout'}
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

