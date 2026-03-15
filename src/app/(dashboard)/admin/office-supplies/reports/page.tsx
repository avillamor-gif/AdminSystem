'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import {
  Package, DollarSign, AlertTriangle, TrendingDown,
  BarChart3, PieChart, Download, Printer, CheckSquare, Square,
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// ── Field definitions ──────────────────────────────────────────────────────────
const ALL_FIELDS = [
  { key: 'name',             label: 'Item Name' },
  { key: 'category',         label: 'Category' },
  { key: 'brand',            label: 'Brand' },
  { key: 'vendor',           label: 'Vendor' },
  { key: 'unit',             label: 'Unit' },
  { key: 'pieces_per_unit',  label: 'Pieces per Unit' },
  { key: 'unit_cost',        label: 'Unit Cost (₱)' },
  { key: 'quantity_on_hand', label: 'Qty on Hand' },
  { key: 'total_value',      label: 'Total Value (₱)' },
  { key: 'reorder_point',    label: 'Reorder Point' },
  { key: 'max_stock',        label: 'Max Stock' },
  { key: 'location',         label: 'Location' },
  { key: 'status',           label: 'Status' },
  { key: 'notes',            label: 'Notes' },
]

// ── Types ──────────────────────────────────────────────────────────────────────
interface SupplyItem {
  id: string
  name: string
  category_id: string | null
  brand_id: string | null
  vendor_id: string | null
  unit: string | null
  pieces_per_unit?: number | null
  unit_cost: number | null
  quantity_on_hand: number | null
  reorder_point: number | null
  max_stock: number | null
  location_id: string | null
  is_active: boolean | null
  notes: string | null
  // resolved relations
  categoryName?: string
  brandName?: string
  vendorName?: string
  locationName?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getFieldValue(item: SupplyItem, key: string): string {
  switch (key) {
    case 'name':             return item.name ?? ''
    case 'category':         return item.categoryName ?? '—'
    case 'brand':            return item.brandName ?? '—'
    case 'vendor':           return item.vendorName ?? '—'
    case 'unit':             return item.unit ?? ''
    case 'pieces_per_unit':  return item.pieces_per_unit != null ? String(item.pieces_per_unit) : ''
    case 'unit_cost':        return item.unit_cost != null ? `₱${Number(item.unit_cost).toLocaleString()}` : ''
    case 'quantity_on_hand': return String(item.quantity_on_hand ?? 0)
    case 'total_value':      return `₱${((item.unit_cost ?? 0) * (item.quantity_on_hand ?? 0)).toLocaleString()}`
    case 'reorder_point':    return String(item.reorder_point ?? 0)
    case 'max_stock':        return String(item.max_stock ?? 0)
    case 'location':         return item.locationName ?? '—'
    case 'status':           return item.is_active ? 'Active' : 'Inactive'
    case 'notes':            return item.notes ?? ''
    default:                 return ''
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SupplyReportsPage() {
  const [items, setItems]       = useState<SupplyItem[]>([])
  const [loading, setLoading]   = useState(true)
  const printFrameRef           = useRef<HTMLIFrameElement>(null)

  // Print modal state
  const [showPrintModal, setShowPrintModal]           = useState(false)
  const [printCategories, setPrintCategories]         = useState<Set<string>>(new Set())
  const [printFields, setPrintFields]                 = useState<Set<string>>(new Set(ALL_FIELDS.map(f => f.key)))

  // Export modal state
  const [showExportModal, setShowExportModal]         = useState(false)
  const [exportCategories, setExportCategories]       = useState<Set<string>>(new Set())
  const [exportFields, setExportFields]               = useState<Set<string>>(new Set(ALL_FIELDS.map(f => f.key)))

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [itemsRes, catsRes, brandsRes, vendorsRes, locsRes] = await Promise.all([
        supabase.from('supply_items').select('*').order('name'),
        supabase.from('supply_categories').select('id, name').order('name'),
        supabase.from('supply_brands').select('id, name').order('name'),
        supabase.from('supply_vendors').select('id, name').order('name'),
        supabase.from('supply_locations').select('id, name').order('name'),
      ])
      if (itemsRes.error) { toast.error('Failed to load inventory'); setLoading(false); return }

      const catMap    = Object.fromEntries((catsRes.data    ?? []).map((r: any) => [r.id, r.name]))
      const brandMap  = Object.fromEntries((brandsRes.data  ?? []).map((r: any) => [r.id, r.name]))
      const vendorMap = Object.fromEntries((vendorsRes.data ?? []).map((r: any) => [r.id, r.name]))
      const locMap    = Object.fromEntries((locsRes.data    ?? []).map((r: any) => [r.id, r.name]))

      setItems((itemsRes.data ?? []).map((i: any) => ({
        ...i,
        categoryName: catMap[i.category_id] ?? 'Uncategorized',
        brandName:    brandMap[i.brand_id]  ?? undefined,
        vendorName:   vendorMap[i.vendor_id] ?? undefined,
        locationName: locMap[i.location_id] ?? undefined,
      })))
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalValue   = items.reduce((s, i) => s + (i.unit_cost ?? 0) * (i.quantity_on_hand ?? 0), 0)
    const lowStock     = items.filter(i => (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0) && i.is_active).length
    const outOfStock   = items.filter(i => (i.quantity_on_hand ?? 0) === 0 && i.is_active).length
    const totalUnits   = items.reduce((s, i) => s + (i.quantity_on_hand ?? 0), 0)
    return { totalItems: items.length, totalValue, lowStock, outOfStock, totalUnits }
  }, [items])

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>()
    items.forEach(i => {
      const cat = i.categoryName ?? 'Uncategorized'
      const existing = map.get(cat) ?? { name: cat, count: 0, value: 0 }
      map.set(cat, {
        name: cat,
        count: existing.count + 1,
        value: existing.value + (i.unit_cost ?? 0) * (i.quantity_on_hand ?? 0),
      })
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [items])

  const lowStockItems = useMemo(() =>
    items
      .filter(i => (i.quantity_on_hand ?? 0) <= (i.reorder_point ?? 0) && i.is_active)
      .sort((a, b) => (a.quantity_on_hand ?? 0) - (b.quantity_on_hand ?? 0))
      .slice(0, 8),
    [items])

  const topByValue = useMemo(() =>
    [...items]
      .sort((a, b) => ((b.unit_cost ?? 0) * (b.quantity_on_hand ?? 0)) - ((a.unit_cost ?? 0) * (a.quantity_on_hand ?? 0)))
      .slice(0, 5),
    [items])

  // ── Toggle helpers ───────────────────────────────────────────────────────────
  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  // ── Print ────────────────────────────────────────────────────────────────────
  const openPrintModal = () => {
    setPrintCategories(new Set(itemsByCategory.map(c => c.name)))
    setPrintFields(new Set(ALL_FIELDS.map(f => f.key)))
    setShowPrintModal(true)
  }

  const handlePrint = () => {
    const filtered = items.filter(i => printCategories.has(i.categoryName ?? 'Uncategorized'))
    const fields   = ALL_FIELDS.filter(f => printFields.has(f.key))
    const headerCells = fields.map(f => `<th>${f.label}</th>`).join('')
    const rows = filtered.map(item =>
      `<tr>${fields.map(f => `<td>${getFieldValue(item, f.key)}</td>`).join('')}</tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><title>Supply Inventory Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p.sub { color: #666; margin-bottom: 12px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #ea580c; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  @media print { @page { margin: 15mm; } }
</style></head><body>
<h1>Supply Inventory Report</h1>
<p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total items: ${filtered.length}</p>
<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`

    const iframe = printFrameRef.current!
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setShowPrintModal(false)
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const openExportModal = () => {
    setExportCategories(new Set(itemsByCategory.map(c => c.name)))
    setExportFields(new Set(ALL_FIELDS.map(f => f.key)))
    setShowExportModal(true)
  }

  const handleExport = () => {
    const filtered = items.filter(i => exportCategories.has(i.categoryName ?? 'Uncategorized'))
    const fields   = ALL_FIELDS.filter(f => exportFields.has(f.key))
    const headers  = fields.map(f => f.label)
    const rows     = filtered.map(item => fields.map(f => {
      // For CSV: strip ₱ and commas from monetary values
      switch (f.key) {
        case 'unit_cost':   return item.unit_cost != null ? String(item.unit_cost) : ''
        case 'total_value': return String((item.unit_cost ?? 0) * (item.quantity_on_hand ?? 0))
        default:            return getFieldValue(item, f.key)
      }
    }))

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = window.URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `supply-inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    setShowExportModal(false)
  }

  // ── Export XLSX ───────────────────────────────────────────────────────────────
  const handleExportXLSX = () => {
    const filtered = items.filter(i => exportCategories.has(i.categoryName ?? 'Uncategorized'))
    const fields   = ALL_FIELDS.filter(f => exportFields.has(f.key))

    const headerRow = fields.map(f => f.label)
    const dataRows  = filtered.map(item => fields.map(f => {
      switch (f.key) {
        case 'unit_cost':   return item.unit_cost ?? ''
        case 'total_value': return (item.unit_cost ?? 0) * (item.quantity_on_hand ?? 0)
        default:            return getFieldValue(item, f.key)
      }
    }))

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Supply Inventory')
    XLSX.writeFile(wb, `supply-inventory-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowExportModal(false)
  }

  // ── Reusable modal body (shared between print & export) ──────────────────────
  const renderSelectors = (
    selectedCats: Set<string>,
    setCats: React.Dispatch<React.SetStateAction<Set<string>>>,
    selectedFlds: Set<string>,
    setFlds: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Categories</h3>
          <div className="flex gap-2 text-xs">
            <button className="text-orange-600 hover:underline" onClick={() => setCats(new Set(itemsByCategory.map(c => c.name)))}>Select all</button>
            <span className="text-gray-300">|</span>
            <button className="text-gray-500 hover:underline" onClick={() => setCats(new Set())}>Clear</button>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {itemsByCategory.map(cat => (
            <label key={cat.name} className="flex items-center gap-2 cursor-pointer group">
              <span className="text-orange-500">
                {selectedCats.has(cat.name)
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4 text-gray-400 group-hover:text-orange-400" />}
              </span>
              <input type="checkbox" className="sr-only" checked={selectedCats.has(cat.name)} onChange={() => toggle(setCats, cat.name)} />
              <span className="text-sm text-gray-800">{cat.name}</span>
              <span className="ml-auto text-xs text-gray-400">{cat.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fields</h3>
          <div className="flex gap-2 text-xs">
            <button className="text-orange-600 hover:underline" onClick={() => setFlds(new Set(ALL_FIELDS.map(f => f.key)))}>Select all</button>
            <span className="text-gray-300">|</span>
            <button className="text-gray-500 hover:underline" onClick={() => setFlds(new Set())}>Clear</button>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {ALL_FIELDS.map(field => (
            <label key={field.key} className="flex items-center gap-2 cursor-pointer group">
              <span className="text-orange-500">
                {selectedFlds.has(field.key)
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4 text-gray-400 group-hover:text-orange-400" />}
              </span>
              <input type="checkbox" className="sr-only" checked={selectedFlds.has(field.key)} onChange={() => toggle(setFlds, field.key)} />
              <span className="text-sm text-gray-800">{field.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const printCount  = [...printCategories].reduce((s, c) => s + (itemsByCategory.find(x => x.name === c)?.count ?? 0), 0)
  const exportCount = [...exportCategories].reduce((s, c) => s + (itemsByCategory.find(x => x.name === c)?.count ?? 0), 0)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Reports</h1>
          <p className="text-gray-600">Analytics and insights for office supply inventory</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={openPrintModal} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button type="button" onClick={openExportModal} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-blue-100 rounded-xl mb-3"><Package className="w-6 h-6 text-blue-600" /></div>
              <p className="text-3xl font-bold text-blue-600 mb-1">{stats.totalItems}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-purple-100 rounded-xl mb-3"><DollarSign className="w-6 h-6 text-purple-600" /></div>
              <p className="text-3xl font-bold text-purple-600 mb-1">₱{stats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Inventory Value</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-yellow-100 rounded-xl mb-3"><AlertTriangle className="w-6 h-6 text-yellow-600" /></div>
              <p className="text-3xl font-bold text-yellow-600 mb-1">{stats.lowStock}</p>
              <p className="text-sm text-gray-500">Low Stock Items</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-red-100 rounded-xl mb-3"><TrendingDown className="w-6 h-6 text-red-600" /></div>
              <p className="text-3xl font-bold text-red-600 mb-1">{stats.outOfStock}</p>
              <p className="text-sm text-gray-500">Out of Stock</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Items by Category */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><PieChart className="h-5 w-5" /> Items by Category</h3>
              </div>
              <div className="p-6 space-y-3">
                {itemsByCategory.map(cat => {
                  const pct = stats.totalItems > 0 ? (cat.count / stats.totalItems * 100).toFixed(1) : 0
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-sm text-gray-500">{cat.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Value: ₱{cat.value.toLocaleString()}</div>
                    </div>
                  )
                })}
                {itemsByCategory.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
              </div>
            </Card>

            {/* Low Stock Alert */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Low Stock Items</h3>
              </div>
              <div className="p-6">
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">All items are adequately stocked 🎉</div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.categoryName}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${(item.quantity_on_hand ?? 0) === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.quantity_on_hand ?? 0} {item.unit ?? 'pcs'}
                          </div>
                          <div className="text-xs text-gray-400">min: {item.reorder_point ?? 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Top Items by Value */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Top Items by Value</h3>
              </div>
              <div className="p-6 space-y-3">
                {topByValue.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">{idx + 1}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.categoryName}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₱{((item.unit_cost ?? 0) * (item.quantity_on_hand ?? 0)).toLocaleString()}
                    </div>
                  </div>
                ))}
                {topByValue.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
              </div>
            </Card>

            {/* Inventory summary */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Inventory Summary</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total SKUs</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Total Units on Hand</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUnits.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-xs text-yellow-700 mb-1">Below Reorder Point</div>
                    <div className="text-2xl font-bold text-yellow-700">{stats.lowStock}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-xs text-red-700 mb-1">Out of Stock</div>
                    <div className="text-2xl font-bold text-red-700">{stats.outOfStock}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Total Inventory Value</div>
                  <div className="text-3xl font-bold text-purple-700">₱{stats.totalValue.toLocaleString()}</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Hidden print iframe */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame" />

      {/* Print Modal */}
      {showPrintModal && (
        <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-600" />
              <span>Print Report</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {renderSelectors(printCategories, setPrintCategories, printFields, setPrintFields)}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{printCount}</strong> item{printCount !== 1 ? 's' : ''} will be printed across{' '}
              <strong>{printCategories.size}</strong> categor{printCategories.size === 1 ? 'y' : 'ies'} with{' '}
              <strong>{printFields.size}</strong> field{printFields.size === 1 ? '' : 's'}.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowPrintModal(false)}>Cancel</Button>
            <Button onClick={handlePrint} disabled={printCategories.size === 0 || printFields.size === 0}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <Modal open={showExportModal} onClose={() => setShowExportModal(false)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-gray-600" />
              <span>Export CSV</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {renderSelectors(exportCategories, setExportCategories, exportFields, setExportFields)}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{exportCount}</strong> item{exportCount !== 1 ? 's' : ''} will be exported across{' '}
              <strong>{exportCategories.size}</strong> categor{exportCategories.size === 1 ? 'y' : 'ies'} with{' '}
              <strong>{exportFields.size}</strong> field{exportFields.size === 1 ? '' : 's'}.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleExport} disabled={exportCategories.size === 0 || exportFields.size === 0}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button onClick={handleExportXLSX} disabled={exportCategories.size === 0 || exportFields.size === 0}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
