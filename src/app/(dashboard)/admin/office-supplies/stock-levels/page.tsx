'use client'

import React, { useState, useEffect } from 'react'
import { Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { Card, Badge, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }
interface Item {
  id: string; name: string; unit: string | null; unit_cost: number | null
  quantity_on_hand: number | null; reorder_point: number | null; max_stock: number | null
  location: string | null; category_id: string | null; is_active: boolean | null
  category?: Category
}

function StockBar({ qty, max, reorder }: { qty: number; max: number; reorder: number }) {
  const pct = max > 0 ? Math.min(100, (qty / max) * 100) : 0
  const reorderPct = max > 0 ? (reorder / max) * 100 : 0
  const color = qty <= reorder ? 'bg-red-500' : qty <= reorder * 2 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="relative w-full bg-gray-200 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: pct + '%' }} />
      <div className="absolute top-0 h-2.5 w-0.5 bg-gray-500 opacity-50" style={{ left: reorderPct + '%' }} />
    </div>
  )
}

export default function StockLevelsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const load = async () => {
    const supabase = createClient()
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('supply_items').select('*').eq('is_active', true).order('name'),
      supabase.from('supply_categories').select('id, name').eq('is_active', true).order('name'),
    ])
    if (itemsRes.error) { toast.error('Failed to load stock'); return }
    const catMap = Object.fromEntries((catsRes.data ?? []).map((c: Category) => [c.id, c]))
    setItems((itemsRes.data ?? []).map((i: Item) => ({ ...i, category: catMap[i.category_id ?? ''] })))
    setCategories(catsRes.data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && i.category_id !== catFilter) return false
    if (stockFilter === 'low' && (i.quantity_on_hand ?? 0) > (i.reorder_point ?? 0)) return false
    if (stockFilter === 'ok' && (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0)) return false
    if (stockFilter === 'empty' && (i.quantity_on_hand ?? 0) > 0) return false
    return true
  })

  const lowCount = items.filter(i => (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0) && (i.quantity_on_hand ?? 0) > 0).length
  const emptyCount = items.filter(i => (i.quantity_on_hand ?? 0) === 0).length
  const healthyCount = items.filter(i => (i.quantity_on_hand ?? 0) > (i.reorder_point ?? 0)).length
  const totalValue = items.reduce((s, i) => s + (i.quantity_on_hand ?? 0) * (i.unit_cost ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
        <p className="text-gray-600 mt-1">Monitor inventory levels and reorder alerts</p>
      </div>

      {/* Restock Alert Banner */}
      {(lowCount > 0 || emptyCount > 0) && !loading && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-700 text-sm">Restock Required</p>
              <div className="mt-2 space-y-1">
                {items.filter(i => (i.quantity_on_hand ?? 0) === 0).map(i => (
                  <div key={i.id} className="flex justify-between text-xs text-red-600">
                    <span>{i.name} <span className="text-gray-400">({i.category?.name ?? 'Uncategorised'})</span></span>
                    <span className="font-semibold">OUT OF STOCK</span>
                  </div>
                ))}
                {items.filter(i => (i.quantity_on_hand ?? 0) > 0 && (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0)).map(i => (
                  <div key={i.id} className="flex justify-between text-xs text-yellow-700">
                    <span>{i.name} <span className="text-gray-400">({i.category?.name ?? 'Uncategorised'})</span></span>
                    <span className="font-semibold">{i.quantity_on_hand ?? 0} {i.unit ?? ''} left (reorder at {i.reorder_point ?? 0})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer" onClick={() => setStockFilter('ok')}><Package className="w-6 h-6 text-green-500 mb-2" /><p className="text-2xl font-bold text-green-600">{healthyCount}</p><p className="text-xs text-gray-500">Well Stocked</p></Card>
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer" onClick={() => setStockFilter('low')}><TrendingDown className="w-6 h-6 text-yellow-500 mb-2" /><p className="text-2xl font-bold text-yellow-600">{lowCount}</p><p className="text-xs text-gray-500">Low Stock</p></Card>
        <Card className="p-5 flex flex-col items-center text-center cursor-pointer" onClick={() => setStockFilter('empty')}><AlertTriangle className="w-6 h-6 text-red-500 mb-2" /><p className="text-2xl font-bold text-red-600">{emptyCount}</p><p className="text-xs text-gray-500">Out of Stock</p></Card>
        <Card className="p-5 flex flex-col items-center text-center"><Package className="w-6 h-6 text-purple-500 mb-2" /><p className="text-2xl font-bold text-purple-600">₱{totalValue.toLocaleString()}</p><p className="text-xs text-gray-500">Total Value</p></Card>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <Input className="flex-1" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="all">All Levels</option>
          <option value="ok">Well Stocked</option>
          <option value="low">Low Stock</option>
          <option value="empty">Out of Stock</option>
        </select>
        {(stockFilter !== 'all' || catFilter !== 'all') && <button onClick={() => { setStockFilter('all'); setCatFilter('all') }} className="text-xs text-orange-600 hover:underline whitespace-nowrap">Clear filters</button>}
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No items match filters</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Item', 'Category', 'Stock Level', 'On Hand', 'Reorder', 'Max', 'Unit Cost', 'Value', 'Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(item => {
                  const isEmpty = (item.quantity_on_hand ?? 0) === 0
                  const isLow = (item.quantity_on_hand ?? 0) > 0 && (item.quantity_on_hand ?? 0) <= (item.reorder_point ?? 0)
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isEmpty ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4"><div className="font-medium text-gray-900 text-sm">{item.name}</div>{item.location && <div className="text-xs text-gray-400">{item.location}</div>}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category?.name ?? '—'}</td>
                      <td className="px-6 py-4 min-w-32"><StockBar qty={item.quantity_on_hand ?? 0} max={item.max_stock ?? 0} reorder={item.reorder_point ?? 0} /></td>
                      <td className="px-6 py-4 text-sm font-semibold">{item.quantity_on_hand ?? 0} {item.unit ?? ''}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.reorder_point ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.max_stock ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₱{(item.unit_cost ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">₱{((item.quantity_on_hand ?? 0) * (item.unit_cost ?? 0)).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {isEmpty ? <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
                          : isLow ? <Badge className="bg-yellow-100 text-yellow-700">Low Stock</Badge>
                          : <Badge className="bg-green-100 text-green-700">OK</Badge>}
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
