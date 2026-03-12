'use client'

import { useState, useMemo, useRef } from 'react'
import { useAssets, useAssetAssignments, useAssetMaintenance } from '@/hooks/useAssets'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Package, TrendingUp, DollarSign, Wrench, Users, BarChart3, PieChart, Download, Printer, CheckSquare, Square } from 'lucide-react'

const PRINTABLE_FIELDS = [
  { key: 'asset_tag',     label: 'Asset Tag' },
  { key: 'name',          label: 'Asset Name' },
  { key: 'category',      label: 'Category' },
  { key: 'brand',         label: 'Brand / Model' },
  { key: 'status',        label: 'Status' },
  { key: 'condition',     label: 'Condition' },
  { key: 'assigned_to',   label: 'Assigned To' },
  { key: 'location',      label: 'Location' },
  { key: 'purchase_price',label: 'Purchase Price' },
  { key: 'purchase_date', label: 'Purchase Date' },
  { key: 'warranty_end',  label: 'Warranty End' },
  { key: 'serial_number', label: 'Serial Number' },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30') // days
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(PRINTABLE_FIELDS.map(f => f.key)))
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  const { data: assets = [] } = useAssets()
  const { data: assignments = [] } = useAssetAssignments()
  const { data: maintenanceRecords = [] } = useAssetMaintenance()

  // Calculate statistics
  const stats = useMemo(() => {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0)
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
    const activeAssignments = assignments.filter(a => !a.returned_date).length
    const assignmentRate = assets.length > 0 ? (activeAssignments / assets.length) * 100 : 0

    return {
      totalAssets: assets.length,
      totalValue,
      totalMaintenanceCost,
      activeAssignments,
      assignmentRate: assignmentRate.toFixed(1)
    }
  }, [assets, assignments, maintenanceRecords])

  // Assets by category
  const assetsByCategory = useMemo(() => {
    const categoryMap = new Map<string, { name: string; count: number; value: number }>()
    
    assets.forEach(asset => {
      const categoryName = asset.category?.name || 'Uncategorized'
      const existing = categoryMap.get(categoryName) || { name: categoryName, count: 0, value: 0 }
      categoryMap.set(categoryName, {
        name: categoryName,
        count: existing.count + 1,
        value: existing.value + (asset.purchase_price || 0)
      })
    })

    return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count)
  }, [assets])

  // Assets by status
  const assetsByStatus = useMemo(() => {
    const statusMap = new Map<string, number>()
    
    assets.forEach(asset => {
      const status = asset.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    return [
      { status: 'available', count: statusMap.get('available') || 0, color: 'bg-green-500' },
      { status: 'assigned', count: statusMap.get('assigned') || 0, color: 'bg-blue-500' },
      { status: 'maintenance', count: statusMap.get('maintenance') || 0, color: 'bg-yellow-500' },
      { status: 'retired', count: statusMap.get('retired') || 0, color: 'bg-gray-500' },
      { status: 'lost', count: statusMap.get('lost') || 0, color: 'bg-red-500' },
      { status: 'damaged', count: statusMap.get('damaged') || 0, color: 'bg-orange-500' }
    ]
  }, [assets])

  // Assets by condition
  const assetsByCondition = useMemo(() => {
    const conditionMap = new Map<string, number>()
    
    assets.forEach(asset => {
      const condition = asset.condition || 'unknown'
      conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1)
    })

    return [
      { condition: 'excellent', count: conditionMap.get('excellent') || 0, color: 'bg-green-600' },
      { condition: 'good', count: conditionMap.get('good') || 0, color: 'bg-blue-600' },
      { condition: 'fair', count: conditionMap.get('fair') || 0, color: 'bg-yellow-600' },
      { condition: 'poor', count: conditionMap.get('poor') || 0, color: 'bg-red-600' }
    ]
  }, [assets])

  // Maintenance by type
  const maintenanceByType = useMemo(() => {
    const typeMap = new Map<string, { count: number; cost: number }>()
    
    maintenanceRecords.forEach(record => {
      const type = record.maintenance_type || 'other'
      const existing = typeMap.get(type) || { count: 0, cost: 0 }
      typeMap.set(type, {
        count: existing.count + 1,
        cost: existing.cost + (record.cost || 0)
      })
    })

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      cost: data.cost
    }))
  }, [maintenanceRecords])

  // Top assets by value
  const topAssetsByValue = useMemo(() => {
    return [...assets]
      .sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0))
      .slice(0, 5)
  }, [assets])

  // Assets needing attention (poor condition or warranty expiring soon)
  const assetsNeedingAttention = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return assets.filter(asset => {
      if (asset.condition === 'poor') return true
      if (asset.warranty_end_date) {
        const expiryDate = new Date(asset.warranty_end_date)
        return expiryDate <= thirtyDaysFromNow
      }
      return false
    })
  }, [assets])

  const openPrintModal = () => {
    // Pre-select all categories by default
    setSelectedCategories(new Set(assetsByCategory.map(c => c.name)))
    setSelectedFields(new Set(PRINTABLE_FIELDS.map(f => f.key)))
    setShowPrintModal(true)
  }

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handlePrint = () => {
    const filteredAssets = assets.filter(a => {
      const cat = a.category?.name || 'Uncategorized'
      return selectedCategories.has(cat)
    })

    const fields = PRINTABLE_FIELDS.filter(f => selectedFields.has(f.key))

    const headerCells = fields.map(f => `<th>${f.label}</th>`).join('')

    const rows = filteredAssets.map(asset => {
      const cells = fields.map(f => {
        let val = ''
        switch (f.key) {
          case 'asset_tag':      val = asset.asset_tag ?? ''; break
          case 'name':           val = asset.name ?? ''; break
          case 'category':       val = asset.category?.name ?? ''; break
          case 'brand':          val = [asset.brand?.name, asset.model].filter(Boolean).join(' / '); break
          case 'status':         val = asset.status ?? ''; break
          case 'condition':      val = asset.condition ?? ''; break
          case 'assigned_to':    val = asset.employee ? `${asset.employee.first_name} ${asset.employee.last_name}` : ''; break
          case 'location':       val = asset.location ?? ''; break
          case 'purchase_price': val = asset.purchase_price != null ? `₱${Number(asset.purchase_price).toLocaleString()}` : ''; break
          case 'purchase_date':  val = asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : ''; break
          case 'warranty_end':   val = asset.warranty_end_date ? new Date(asset.warranty_end_date).toLocaleDateString() : ''; break
          case 'serial_number':  val = asset.serial_number ?? ''; break
        }
        return `<td>${val}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><title>Asset Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p.sub { color: #666; margin-bottom: 12px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  @media print { @page { margin: 15mm; } }
</style></head><body>
<h1>Asset Management Report</h1>
<p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total assets printed: ${filteredAssets.length}</p>
<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`

    const iframe = printFrameRef.current!
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setShowPrintModal(false)
  }

  const handleExport = () => {
    if (exportFormat === 'csv') {
      // Simple CSV export
      const headers = ['Asset Tag', 'Name', 'Category', 'Status', 'Condition', 'Value', 'Location']
      const rows = assets.map(asset => [
        asset.asset_tag,
        asset.name,
        asset.category?.name || '',
        asset.status,
        asset.condition || '',
        asset.purchase_price || 0,
        asset.location || ''
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else {
      // PDF export would require a library like jsPDF
      alert('PDF export functionality would be implemented with a library like jsPDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Reports</h1>
          <p className="text-gray-600">Analytics and insights for asset management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openPrintModal}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.totalAssets}</p>
          <p className="text-sm text-gray-500">Total Assets</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">₱{stats.totalValue.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Value</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{stats.assignmentRate}%</p>
          <p className="text-sm text-gray-500">Utilization Rate</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-orange-100 rounded-xl mb-3">
            <Wrench className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">₱{stats.totalMaintenanceCost.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Maintenance Cost</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets by Category */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><PieChart className="h-5 w-5" /> Assets by Category</h3>
          </div>
          <div className="p-6 space-y-3">
            {assetsByCategory.map(category => {
              const percentage = stats.totalAssets > 0 ? (category.count / stats.totalAssets * 100).toFixed(1) : 0
              return (
                <div key={category.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Value: ₱{category.value.toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Assets by Status */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Assets by Status</h3>
          </div>
          <div className="p-6 space-y-3">
            {assetsByStatus.map(item => {
              const percentage = stats.totalAssets > 0 ? (item.count / stats.totalAssets * 100).toFixed(1) : 0
              return (
                <div key={item.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize">{item.status}</span>
                    <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Assets by Condition */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Assets by Condition</h3>
          </div>
          <div className="p-6 space-y-3">
            {assetsByCondition.map(item => {
              const percentage = stats.totalAssets > 0 ? (item.count / stats.totalAssets * 100).toFixed(1) : 0
              return (
                <div key={item.condition}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize">{item.condition}</span>
                    <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Maintenance by Type */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenanceByType.map(item => (
                  <tr key={item.type} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm capitalize">{item.type}</td>
                    <td className="px-6 py-3 text-sm text-right">{item.count}</td>
                    <td className="px-6 py-3 text-sm text-right">₱{item.cost.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-6 py-3 text-sm">Total</td>
                  <td className="px-6 py-3 text-sm text-right">{maintenanceByType.reduce((sum, item) => sum + item.count, 0)}</td>
                  <td className="px-6 py-3 text-sm text-right">₱{maintenanceByType.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Assets by Value */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Top Assets by Value</h3>
          </div>
          <div className="p-6 space-y-3">
            {topAssetsByValue.map((asset, index) => (
              <div key={asset.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.asset_tag}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">₱{(asset.purchase_price || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Assets Needing Attention */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="h-5 w-5 text-orange-600" /> Assets Needing Attention</h3>
          </div>
          <div className="p-6">
            {assetsNeedingAttention.length === 0 ? (
              <div className="text-center py-6 text-gray-500">All assets are in good condition</div>
            ) : (
              <div className="space-y-3">
                {assetsNeedingAttention.slice(0, 5).map(asset => (
                  <div key={asset.id} className="flex items-start justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.asset_tag}</div>
                      {asset.condition === 'poor' && (
                        <div className="text-xs text-orange-600 mt-1">Poor condition</div>
                      )}
                      {asset.warranty_end_date && new Date(asset.warranty_end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <div className="text-xs text-orange-600 mt-1">
                          Warranty expires: {new Date(asset.warranty_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {assetsNeedingAttention.length > 5 && (
                  <div className="text-sm text-gray-500 text-center">+ {assetsNeedingAttention.length - 5} more</div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Financial Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Asset Value</div>
              <div className="text-2xl font-bold text-gray-900">₱{stats.totalValue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Active Assignments</div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeAssignments}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Maintenance Spent</div>
              <div className="text-2xl font-bold text-orange-600">₱{stats.totalMaintenanceCost.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden print iframe */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame" />

      {/* Print Selection Modal */}
      {showPrintModal && (
        <Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-gray-600" />
              <span>Print Report</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Categories</h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => setSelectedCategories(new Set(assetsByCategory.map(c => c.name)))}
                    >Select all</button>
                    <span className="text-gray-300">|</span>
                    <button
                      className="text-gray-500 hover:underline"
                      onClick={() => setSelectedCategories(new Set())}
                    >Clear</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {assetsByCategory.map(cat => (
                    <label key={cat.name} className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-indigo-600">
                        {selectedCategories.has(cat.name)
                          ? <CheckSquare className="h-4 w-4" />
                          : <Square className="h-4 w-4 text-gray-400 group-hover:text-indigo-400" />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedCategories.has(cat.name)}
                        onChange={() => toggleCategory(cat.name)}
                      />
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
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => setSelectedFields(new Set(PRINTABLE_FIELDS.map(f => f.key)))}
                    >Select all</button>
                    <span className="text-gray-300">|</span>
                    <button
                      className="text-gray-500 hover:underline"
                      onClick={() => setSelectedFields(new Set())}
                    >Clear</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {PRINTABLE_FIELDS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-indigo-600">
                        {selectedFields.has(field.key)
                          ? <CheckSquare className="h-4 w-4" />
                          : <Square className="h-4 w-4 text-gray-400 group-hover:text-indigo-400" />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedFields.has(field.key)}
                        onChange={() => toggleField(field.key)}
                      />
                      <span className="text-sm text-gray-800">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{[...selectedCategories].reduce((sum, cat) => {
                const c = assetsByCategory.find(x => x.name === cat)
                return sum + (c?.count ?? 0)
              }, 0)}</strong> assets will be printed across <strong>{selectedCategories.size}</strong> categor{selectedCategories.size === 1 ? 'y' : 'ies'} with <strong>{selectedFields.size}</strong> field{selectedFields.size === 1 ? '' : 's'}.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowPrintModal(false)}>Cancel</Button>
            <Button
              onClick={handlePrint}
              disabled={selectedCategories.size === 0 || selectedFields.size === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
