'use client'

import React, { useState, useEffect } from 'react'
import { Package, Search, X } from 'lucide-react'
import { Card, Input, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }
interface Item {
  id: string; name: string; description: string | null; unit: string
  quantity_on_hand: number; reorder_point: number; location: string | null
  category_id: string | null; is_active: boolean; category?: Category
}

export default function SuppliesListPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('supply_items').select('*').eq('is_active', true).order('name'),
        supabase.from('supply_categories').select('id, name').eq('is_active', true).order('name'),
      ])
      if (itemsRes.error) { toast.error('Failed to load supplies'); return }
      const catMap = Object.fromEntries((catsRes.data ?? []).map((c: Category) => [c.id, c]))
      setItems((itemsRes.data ?? []).map((i: Item) => ({ ...i, category: catMap[i.category_id ?? ''] })))
      setCategories(catsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = items.filter(i => {
    if (catFilter && i.category_id !== catFilter) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !(i.description ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const availableCount = items.filter(i => i.quantity_on_hand > i.reorder_point).length
  const lowCount = items.filter(i => i.quantity_on_hand > 0 && i.quantity_on_hand <= i.reorder_point).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supplies List</h1>
        <p className="text-sm text-gray-500 mt-1">Browse available office supplies</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3"><Package className="h-6 w-6 text-blue-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Items</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3"><Package className="h-6 w-6 text-green-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
          <p className="text-sm text-gray-500 mt-1">Well Stocked</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-yellow-100 rounded-xl mb-3"><Package className="h-6 w-6 text-yellow-600" /></div>
          <p className="text-2xl font-bold text-gray-900">{lowCount}</p>
          <p className="text-sm text-gray-500 mt-1">Low Stock</p>
        </Card>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name or description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || catFilter) && (
          <button onClick={() => { setSearch(''); setCatFilter('') }} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Available Supplies</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading supplies...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No supplies found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Category', 'Unit', 'In Stock', 'Location', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(item => {
                  const isEmpty = item.quantity_on_hand === 0
                  const isLow = item.quantity_on_hand > 0 && item.quantity_on_hand <= item.reorder_point
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && <div className="text-xs text-gray-400 truncate max-w-xs">{item.description}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.category?.name ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={isEmpty ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}>
                          {item.quantity_on_hand}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.location ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEmpty
                          ? <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
                          : isLow
                          ? <Badge className="bg-yellow-100 text-yellow-700">Low Stock</Badge>
                          : <Badge className="bg-green-100 text-green-700">Available</Badge>}
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
