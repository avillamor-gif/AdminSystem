'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAssets, useAssetCategories, useAssetBrands, useAssetVendors, useAssetLocations, useCreateAsset, useUpdateAsset, useDeleteAsset, useReturnAsset, useAssetAssignments, type Asset, type AssetAssignment } from '@/hooks/useAssets'
import { useEmployees } from '@/hooks/useEmployees'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Package, Plus, Search, Edit, Trash2, Laptop, Armchair, Car, Wrench, Smartphone, QrCode, Download, Upload, X, RotateCcw, Printer, ChevronRight, CheckCircle, AlertTriangle, DollarSign, ChevronUp, ChevronDown, ChevronLeft, Wifi, Camera } from 'lucide-react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { uploadAssetImage } from '@/lib/supabase/storage'

const statusColors = {
  available: 'bg-green-100 text-green-800',
  assigned: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
  damaged: 'bg-orange-100 text-orange-800'
}

const conditionColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
}

const categoryIcons: Record<string, any> = {
  'IT Equipment': Laptop,
  'Office Furniture': Armchair,
  'Vehicles': Car,
  'Tools & Machinery': Wrench,
  'Electronics': Smartphone,
  'Other Assets': Package
}

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState<'asset_tag' | 'name' | 'category' | 'brand' | 'status' | 'condition' | 'assigned_to' | 'location'>('asset_tag')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showModal, setShowModal] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [editTab, setEditTab] = useState<'details' | 'history'>('details')
  // Multi-image state (up to 4)
  const MAX_IMAGES = 4
  const [imageFiles, setImageFiles]     = useState<(File | null)[]>(Array(MAX_IMAGES).fill(null))
  const [imagePreviews, setImagePreviews] = useState<string[]>(Array(MAX_IMAGES).fill(''))
  const [activeImageSlot, setActiveImageSlot] = useState(0)
  const [sliderIndex, setSliderIndex]   = useState(0)
  const imageInputRef = useRef<HTMLInputElement>(null)
  // Mobile pairing
  const [mobileSession, setMobileSession]       = useState<string>('')
  const [showMobileQR, setShowMobileQR]         = useState(false)
  const [mobileQRDataUrl, setMobileQRDataUrl]   = useState('')
  const [mobileQRMode, setMobileQRMode]         = useState<'photo' | 'barcode'>('photo')
  const [mobileConnected, setMobileConnected]   = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    brand_id: '',
    vendor_id: '',
    model: '',
    category_id: '',
    location: '',
    location_id: '',
    purchase_date: '',
    warranty_start_date: '',
    warranty_end_date: '',
    purchase_price: '',
    useful_life_years: '5',
    salvage_value: '',
    depreciation_method: 'straight_line' as Asset['depreciation_method'],
    notes: '',
    image_url: '',
    status: 'available' as Asset['status'],
    condition: 'good' as Asset['condition'],
    assigned_to: '',
    assigned_date: ''
  })

  const { data: assets = [], isLoading } = useAssets({
    category_id: categoryFilter || undefined,
    status: statusFilter || undefined,
  })
  
  const { data: categories = [] } = useAssetCategories()
  const { data: brands = [] } = useAssetBrands()
  const { data: vendors = [] } = useAssetVendors()
  const { data: assetLocations = [] } = useAssetLocations()
  const { data: employees = [] } = useEmployees()
  const { data: assignmentHistory = [] } = useAssetAssignments(
    selectedAsset ? { asset_id: selectedAsset.id } : undefined
  )

  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset()
  const deleteMutation = useDeleteAsset()
  const returnMutation = useReturnAsset()

  // Calculate statistics
  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    assigned: assets.filter(a => a.status === 'assigned').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    totalValue: assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0)
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const displayedAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = q
      ? assets.filter(a =>
          (a.asset_tag ?? '').toLowerCase().includes(q) ||
          (a.name ?? '').toLowerCase().includes(q) ||
          (a.category?.name ?? '').toLowerCase().includes(q) ||
          (a.brand?.name ?? '').toLowerCase().includes(q) ||
          (a.model ?? '').toLowerCase().includes(q) ||
          (a.location ?? '').toLowerCase().includes(q) ||
          (a.employee ? `${a.employee.first_name} ${a.employee.last_name}`.toLowerCase().includes(q) : false)
        )
      : assets

    return [...filtered].sort((a, b) => {
      let av = ''
      let bv = ''
      switch (sortKey) {
        case 'asset_tag': av = a.asset_tag ?? ''; bv = b.asset_tag ?? ''; break
        case 'name':      av = a.name ?? '';      bv = b.name ?? '';      break
        case 'category':  av = a.category?.name ?? ''; bv = b.category?.name ?? ''; break
        case 'brand':     av = a.brand?.name ?? '';    bv = b.brand?.name ?? '';    break
        case 'status':    av = a.status ?? '';   bv = b.status ?? '';   break
        case 'condition': av = a.condition ?? ''; bv = b.condition ?? ''; break
        case 'assigned_to':
          av = a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : ''
          bv = b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : ''
          break
        case 'location':  av = a.location ?? ''; bv = b.location ?? ''; break
      }
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [assets, searchQuery, sortKey, sortDir])

  const resetImageState = () => {
    setImageFiles(Array(MAX_IMAGES).fill(null))
    setImagePreviews(Array(MAX_IMAGES).fill(''))
    setActiveImageSlot(0)
    setSliderIndex(0)
    setMobileSession('')
    setShowMobileQR(false)
    setMobileConnected(false)
  }

  const handleOpenModal = (asset?: Asset) => {
    setEditTab('details')
    resetImageState()
    if (asset) {
      setSelectedAsset(asset)
      setFormData({
        name: asset.name,
        serial_number: asset.serial_number || '',
        brand_id: asset.brand_id || '',
        vendor_id: asset.vendor_id || '',
        model: asset.model || '',
        category_id: asset.category_id || '',
        location: asset.location || '',
        location_id: (asset as any).location_id || '',
        purchase_date: asset.purchase_date || '',
        warranty_start_date: asset.warranty_start_date || '',
        warranty_end_date: asset.warranty_end_date || '',
        purchase_price: asset.purchase_price?.toString() || '',
        useful_life_years: asset.useful_life_years?.toString() || '5',
        salvage_value: asset.salvage_value?.toString() || '',
        depreciation_method: asset.depreciation_method || 'straight_line',
        notes: asset.notes || '',
        image_url: asset.image_url || '',
        status: asset.status,
        condition: asset.condition || 'good',
        assigned_to: asset.assigned_to || '',
        assigned_date: asset.assigned_date || ''
      })
      // Populate previews from image_urls (or fall back to single image_url)
      const urls: string[] = Array.isArray((asset as any).image_urls) && (asset as any).image_urls.length > 0
        ? (asset as any).image_urls
        : asset.image_url ? [asset.image_url] : []
      const previews = Array(MAX_IMAGES).fill('')
      urls.slice(0, MAX_IMAGES).forEach((u, i) => { previews[i] = u })
      setImagePreviews(previews)
    } else {
      setSelectedAsset(null)
      setFormData({
        name: '',
        serial_number: '',
        brand_id: '',
        vendor_id: '',
        model: '',
        category_id: '',
        location: '',
        location_id: '',
        purchase_date: '',
        warranty_start_date: '',
        warranty_end_date: '',
        purchase_price: '',
        useful_life_years: '5',
        salvage_value: '',
        depreciation_method: 'straight_line',
        notes: '',
        image_url: '',
        status: 'available',
        condition: 'good',
        assigned_to: '',
        assigned_date: ''
      })
    }
    if (asset) {
      setShowModal(true)
    } else {
      setShowAddPanel(true)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedAsset(null)
    resetImageState()
    setEditTab('details')
  }

  const handleClosePanel = () => {
    setShowAddPanel(false)
    resetImageState()
    setFormData({
      name: '',
      serial_number: '',
      brand_id: '',
      vendor_id: '',
      model: '',
      category_id: '',
      location: '',
      location_id: '',
      purchase_date: '',
      warranty_start_date: '',
      warranty_end_date: '',
      purchase_price: '',
      useful_life_years: '5',
      salvage_value: '',
      depreciation_method: 'straight_line',
      notes: '',
      image_url: '',
      status: 'available',
      condition: 'good',
      assigned_to: '',
      assigned_date: ''
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const slot = activeImageSlot
    setImageFiles(prev => { const n = [...prev]; n[slot] = file; return n })
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews(prev => { const n = [...prev]; n[slot] = reader.result as string; return n })
      setSliderIndex(slot)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removeImage = (slot: number) => {
    setImageFiles(prev  => { const n = [...prev]; n[slot] = null; return n })
    setImagePreviews(prev => { const n = [...prev]; n[slot] = ''; return n })
    if (sliderIndex >= slot && sliderIndex > 0) setSliderIndex(s => s - 1)
  }

  // Mobile pairing: generate a session token and QR code
  const openMobilePairing = async (mode: 'photo' | 'barcode', slot = 0) => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setMobileSession(token)
    setMobileQRMode(mode)
    setActiveImageSlot(slot)

    const url = `${window.location.origin}/mobile-capture?session=${token}&mode=${mode}&slot=${slot}`
    const qr  = await QRCode.toDataURL(url, { width: 280, margin: 2 })
    setMobileQRDataUrl(qr)
    setShowMobileQR(true)

    // Subscribe to Realtime for this session
    const supabase = createClient()
    const channel = supabase.channel(`mobile-capture-${token}`)
    channel
      .on('broadcast', { event: 'photo' }, ({ payload }: any) => {
        const s: number = payload.slot ?? 0
        setImagePreviews(prev => { const n = [...prev]; n[s] = payload.url; return n })
        setSliderIndex(s)
        setMobileConnected(true)
        setShowMobileQR(false)
        supabase.removeChannel(channel)
      })
      .on('broadcast', { event: 'barcode' }, ({ payload }: any) => {
        // Fill serial_number with scanned barcode
        setFormData(prev => ({ ...prev, serial_number: payload.barcode }))
        setMobileConnected(true)
        setShowMobileQR(false)
        supabase.removeChannel(channel)
      })
      .subscribe()
  }

  const handleReturnAsset = async () => {
    if (!selectedAsset) return
    if (!confirm('Return this asset? This will mark it as available.')) return

    const activeAssignment = assignmentHistory.find((a: AssetAssignment) => !a.returned_date)

    if (activeAssignment) {
      await returnMutation.mutateAsync({
        assignmentId: activeAssignment.id,
        returnedBy: selectedAsset.assigned_to || ''
      })
    } else {
      // Fallback: no assignment record, just update the asset directly
      await updateMutation.mutateAsync({
        id: selectedAsset.id,
        data: {
          assigned_to: null as unknown as string,
          assigned_date: null as unknown as string,
          status: 'available'
        }
      })
    }
    handleCloseModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Upload any new image files (those that are File objects, not yet URLs)
    const tmpId = selectedAsset?.id ?? `tmp-${Date.now()}`
    const finalPreviews = [...imagePreviews]
    for (let i = 0; i < MAX_IMAGES; i++) {
      if (imageFiles[i]) {
        try {
          const url = await uploadAssetImage(imageFiles[i]!, tmpId, i)
          finalPreviews[i] = url
        } catch (err: any) {
          console.error(`Image upload slot ${i} failed:`, err)
        }
      }
    }
    const uploadedUrls = finalPreviews.filter(Boolean)

    // Auto-derive status from assigned_to when editing, unless user explicitly set a non-assignment status
    const nonAssignmentStatuses = ['maintenance', 'retired', 'lost', 'damaged']
    let resolvedStatus = formData.status
    if (selectedAsset) {
      if (formData.assigned_to && !nonAssignmentStatuses.includes(formData.status ?? '')) {
        // Has an employee → must be in-use
        resolvedStatus = 'assigned'
      } else if (!formData.assigned_to && formData.status === 'assigned') {
        // Employee was cleared but status is still 'assigned' → revert to available
        resolvedStatus = 'available'
      }
    }

    const data: Partial<Asset> = {
      name: formData.name,
      serial_number: formData.serial_number || undefined,
      brand_id: formData.brand_id || undefined,
      vendor_id: formData.vendor_id || undefined,
      model: formData.model || undefined,
      category_id: formData.category_id || undefined,
      location: formData.location || undefined,
      location_id: formData.location_id || (null as unknown as string),
      purchase_date: formData.purchase_date || undefined,
      warranty_start_date: formData.warranty_start_date || undefined,
      warranty_end_date: formData.warranty_end_date || undefined,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
      useful_life_years: formData.useful_life_years ? parseInt(formData.useful_life_years) : undefined,
      salvage_value: formData.salvage_value ? parseFloat(formData.salvage_value) : undefined,
      depreciation_method: formData.depreciation_method || undefined,
      notes: formData.notes || undefined,
      image_url: uploadedUrls[0] || formData.image_url || undefined,
      image_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      status: resolvedStatus,
      condition: formData.condition,
      assigned_to: formData.assigned_to || (null as unknown as string),
      assigned_date: formData.assigned_to ? (formData.assigned_date || undefined) : (null as unknown as string)
    }

    if (selectedAsset) {
      await updateMutation.mutateAsync({ id: selectedAsset.id, data })
      handleCloseModal()
    } else {
      await createMutation.mutateAsync(data)
      handleClosePanel()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleGenerateQRCode = async (asset: Asset) => {
    setSelectedAsset(asset)
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return
      
      // Generate QR code data URL
      const assetData = JSON.stringify({
        id: asset.id,
        tag: asset.asset_tag,
        name: asset.name
      })
      
      // Generate QR code on canvas
      await QRCode.toCanvas(canvas, assetData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Load logo
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      logo.src = '/ibon-icon.png'
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve
        logo.onerror = reject
      })
      
      // Draw logo in center
      const logoSize = 80
      const centerX = (canvas.width - logoSize) / 2
      const centerY = (canvas.height - logoSize) / 2
      
      // Add white background for logo
      ctx.fillStyle = 'white'
      ctx.fillRect(centerX - 5, centerY - 5, logoSize + 10, logoSize + 10)
      
      // Draw logo
      ctx.drawImage(logo, centerX, centerY, logoSize, logoSize)
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      setQrCodeDataUrl(dataUrl)
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Failed to generate QR code')
    }
  }

  const handleDownloadQRCode = () => {
    if (!qrCodeDataUrl || !selectedAsset) return
    
    const link = document.createElement('a')
    link.download = `${selectedAsset.asset_tag}-qr-code.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Manage all company assets and equipment</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Assets</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{stats.available}</p>
          <p className="text-sm text-gray-500">Available</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-orange-100 rounded-xl mb-3">
            <Laptop className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">{stats.assigned}</p>
          <p className="text-sm text-gray-500">In-use</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-xl mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">{stats.maintenance}</p>
          <p className="text-sm text-gray-500">Under Maintenance</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">₱{stats.totalValue.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Value</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.filter(c => c.is_active).map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">In-use</option>
            <option value="maintenance">Under Maintenance</option>
            <option value="retired">Retired</option>
            <option value="lost">Lost</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </Card>

      {/* Assets Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Assets ({displayedAssets.length}{displayedAssets.length !== assets.length ? ` of ${assets.length}` : ''})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {([
                  { key: 'asset_tag',   label: 'Asset Tag' },
                  { key: 'name',        label: 'Name' },
                  { key: 'category',    label: 'Category' },
                  { key: 'brand',       label: 'Brand / Model' },
                  { key: 'status',      label: 'Status' },
                  { key: 'condition',   label: 'Condition' },
                  { key: 'assigned_to', label: 'Assigned To' },
                  { key: 'location',    label: 'Location' },
                ] as const).map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-100 group"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <span className="flex flex-col opacity-0 group-hover:opacity-60 transition-opacity">
                        {sortKey === key ? (
                          sortDir === 'asc'
                            ? <ChevronUp className="w-3 h-3 opacity-100 text-orange-500" />
                            : <ChevronDown className="w-3 h-3 opacity-100 text-orange-500" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : displayedAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No assets found</td>
                </tr>
              ) : (
                displayedAssets.map(asset => {
                  const Icon = categoryIcons[asset.category?.name || ''] || Package
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{asset.asset_tag}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category?.name || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.brand?.name && <div className="text-sm text-gray-900">{asset.brand.name}</div>}
                        {asset.model && <div className="text-sm text-gray-500">{asset.model}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status ?? 'available']}`}>
                          {asset.status === 'assigned' ? 'In-use' : asset.status === 'maintenance' ? 'Under Maintenance' : (asset.status ?? '').charAt(0).toUpperCase() + (asset.status ?? '').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.condition && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conditionColors[asset.condition]}`}>
                            {asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.employee
                          ? `${asset.employee.first_name} ${asset.employee.last_name}`
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleGenerateQRCode(asset)} title="QR Code" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal(asset)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(asset.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Asset — right-side slide-in panel (portalled to body) */}
      {showAddPanel && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 animate-[fadeIn_0.2s_ease]"
            style={{ zIndex: 9998 }}
            onClick={handleClosePanel}
          />
          {/* Panel */}
          <div
            className="fixed right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-[slideInFromRight_0.25s_cubic-bezier(0.16,1,0.3,1)]"
            style={{ top: 0, bottom: 0, zIndex: 9999 }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Asset</h2>
                <p className="text-sm text-gray-500">Fill in the details to register a new asset</p>
              </div>
              <button
                type="button"
                onClick={handleClosePanel}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Panel body — scrollable */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Asset Name */}
                <Input
                  label="Asset Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Dell Laptop, Office Chair..."
                />

                {/* Fields + Image side-by-side */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Serial Number *"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        required
                      />
                      <Select
                        label="Brand"
                        value={formData.brand_id}
                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                      >
                        <option value="">Select Brand</option>
                        {brands.filter(b => b.is_active).map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Vendor"
                        value={formData.vendor_id}
                        onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      >
                        <option value="">Select Vendor</option>
                        {vendors.filter(v => v.is_active).map(vendor => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </Select>
                      <Input
                        label="Model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Category *"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.is_active).map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </Select>
                      <Select
                        label="Location"
                        value={formData.location_id}
                        onChange={(e) => {
                          const loc = assetLocations.find(l => l.id === e.target.value)
                          setFormData({ ...formData, location_id: e.target.value, location: loc?.name || '' })
                        }}
                        options={[
                          { value: '', label: 'Select Location' },
                          ...assetLocations.filter(l => l.is_active).map(l => ({ value: l.id, label: l.name }))
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Acquired"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                      <Input
                        label="Warranty Starts"
                        type="date"
                        value={formData.warranty_start_date}
                        onChange={(e) => setFormData({ ...formData, warranty_start_date: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Warranty Ends"
                        type="date"
                        value={formData.warranty_end_date}
                        onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                      />
                      <Input
                        label="Purchase Price"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Useful Life (Years)"
                        type="number"
                        min="1"
                        value={formData.useful_life_years}
                        onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                      />
                      <Input
                        label="Salvage Value"
                        type="number"
                        step="0.01"
                        value={formData.salvage_value}
                        onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Condition"
                        value={formData.condition || 'good'}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })}
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </Select>
                      <Select
                        label="Depreciation Method"
                        value={formData.depreciation_method || 'straight_line'}
                        onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value as Asset['depreciation_method'] })}
                      >
                        <option value="straight_line">Straight-Line</option>
                        <option value="declining_balance">Declining Balance</option>
                        <option value="none">None</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Enter asset description..."
                      />
                    </div>
                  </div>

                  {/* Image upload — multi-slot (up to 4) */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Asset Images ({imagePreviews.filter(Boolean).length}/{MAX_IMAGES})</label>
                      <div className="flex gap-1">
                        <button type="button" title="Scan barcode / serial" onClick={() => openMobilePairing('barcode')}
                          className="p-1.5 rounded-md text-gray-500 hover:text-[#ff7e15] hover:bg-[#fff4ec] transition-colors">
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button type="button" title="Connect phone for photo" onClick={() => openMobilePairing('photo', imagePreviews.findIndex(p => !p) === -1 ? 0 : imagePreviews.findIndex(p => !p))}
                          className={`p-1.5 rounded-md transition-colors ${
                            mobileConnected ? 'text-green-500 bg-green-50' : 'text-gray-500 hover:text-[#ff7e15] hover:bg-[#fff4ec]'
                          }`}>
                          <Wifi className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Slider / main preview */}
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden min-h-[180px] flex items-center justify-center bg-gray-50 hover:border-[#ff7e15] transition-colors">
                      {imagePreviews.filter(Boolean).length === 0 ? (
                        <button type="button" className="flex flex-col items-center gap-2 py-6 text-gray-400 w-full"
                          onClick={() => { setActiveImageSlot(0); imageInputRef.current?.click() }}>
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">Click to upload image</span>
                          <span className="text-xs">PNG, JPG up to 5MB</span>
                        </button>
                      ) : (
                        <>
                          <img src={imagePreviews[sliderIndex] || imagePreviews.find(Boolean) || ''}
                            alt="Asset" className="w-full h-44 object-contain" />
                          <button type="button"
                            className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 shadow text-gray-500 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); removeImage(sliderIndex) }}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {imagePreviews.filter(Boolean).length > 1 && (
                            <>
                              <button type="button" onClick={() => setSliderIndex(i => (i - 1 + MAX_IMAGES) % MAX_IMAGES)}
                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white">
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setSliderIndex(i => (i + 1) % MAX_IMAGES)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white">
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
                            {imagePreviews.map((p, i) => p ? (
                              <button key={i} type="button" onClick={() => setSliderIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  sliderIndex === i ? 'bg-[#ff7e15]' : 'bg-gray-300'
                                }`} />
                            ) : null)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail row */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {Array.from({ length: MAX_IMAGES }).map((_, i) => (
                        <button key={i} type="button"
                          onClick={() => {
                            if (imagePreviews[i]) { setSliderIndex(i) }
                            else { setActiveImageSlot(i); imageInputRef.current?.click() }
                          }}
                          className={`relative aspect-square rounded-md border-2 overflow-hidden flex items-center justify-center transition-colors ${
                            imagePreviews[i]
                              ? sliderIndex === i ? 'border-[#ff7e15]' : 'border-gray-200'
                              : 'border-dashed border-gray-200 hover:border-[#ff7e15] bg-gray-50'
                          }`}>
                          {imagePreviews[i] ? (
                            <img src={imagePreviews[i]} alt={`slot ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <Plus className="h-4 w-4 text-gray-300" />
                          )}
                          <span className="absolute bottom-0 right-0 text-[9px] bg-black/30 text-white px-0.5 rounded-tl">{i + 1}</span>
                        </button>
                      ))}
                    </div>

                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              </div>

              {/* Panel footer */}
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
                <Button type="button" variant="secondary" onClick={handleClosePanel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add Asset'}
                </Button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Edit Asset Modal */}
      <Modal open={showModal} onClose={handleCloseModal} size="lg">
        <ModalHeader onClose={handleCloseModal}>
          {selectedAsset ? `Edit Asset — ${selectedAsset.asset_tag}` : 'Add New Asset'}
        </ModalHeader>

        {/* Tabs + form wrapper */}
        <div className="flex flex-col flex-1 min-h-0">

          {/* Tabs bar */}
          {selectedAsset && (
            <div className="border-b border-gray-200 px-6 shrink-0">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setEditTab('details')}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    editTab === 'details'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Asset Details
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('history')}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    editTab === 'history'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Assignment History
                </button>
              </div>
            </div>
          )}

          {/* Assignment History tab */}
          {selectedAsset && editTab === 'history' ? (
            <ModalBody>
              <div className="space-y-3">
                {/* Print button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const rows = assignmentHistory.map((a: AssetAssignment) => `
                        <tr>
                          <td>${(a as any).employee ? `${(a as any).employee.first_name} ${(a as any).employee.last_name}` : a.employee_id}</td>
                          <td>${a.assigned_date}</td>
                          <td>${a.returned_date || '—'}</td>
                          <td>${a.condition_on_assignment || '—'}</td>
                          <td>${a.condition_on_return || '—'}</td>
                          <td>${!a.returned_date ? 'Active' : 'Returned'}</td>
                        </tr>`).join('')
                      const win = window.open('', '_blank')
                      if (!win) return
                      win.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Assignment History — ${selectedAsset.asset_tag}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
                            h2 { margin-bottom: 4px; }
                            p { margin: 0 0 16px; color: #555; font-size: 13px; }
                            table { width: 100%; border-collapse: collapse; font-size: 13px; }
                            th { background: #f3f4f6; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
                            td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
                            tr:last-child td { border-bottom: none; }
                            @media print { body { padding: 0; } }
                          </style>
                        </head>
                        <body>
                          <h2>Assignment History</h2>
                          <p>${selectedAsset.asset_tag} — ${selectedAsset.name}</p>
                          <table>
                            <thead>
                              <tr>
                                <th>Employee</th>
                                <th>Assigned</th>
                                <th>Returned</th>
                                <th>Condition (Assign)</th>
                                <th>Condition (Return)</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                          </table>
                        </body>
                        </html>`)
                      win.document.close()
                      win.focus()
                      win.print()
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>

                {assignmentHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No assignment history found</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Employee</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Assigned</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Returned</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Condition (Assign)</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Condition (Return)</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentHistory.map((a: AssetAssignment) => (
                        <tr key={a.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">
                            {(a as any).employee
                              ? `${(a as any).employee.first_name} ${(a as any).employee.last_name}`
                              : a.employee_id}
                          </td>
                          <td className="py-2 px-3">{a.assigned_date}</td>
                          <td className="py-2 px-3">{a.returned_date || '—'}</td>
                          <td className="py-2 px-3">{a.condition_on_assignment || '—'}</td>
                          <td className="py-2 px-3">{a.condition_on_return || '—'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              !a.returned_date ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {!a.returned_date ? 'Active' : 'Returned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </ModalBody>
          ) : (
            /* Asset Details form */
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <ModalBody>
                <div className="space-y-4">

                  {/* Assignment bar — only shown when editing */}
                  {selectedAsset && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <Select
                          label="Status"
                          value={formData.status ?? ''}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })}
                        >
                          <option value="available">Available</option>
                          <option value="assigned">In-use</option>
                          <option value="maintenance">Under Maintenance</option>
                          <option value="retired">Retired</option>
                          <option value="lost">Lost</option>
                          <option value="damaged">Damaged</option>
                        </Select>
                        <Select
                          label="Employee"
                          value={formData.assigned_to}
                          onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name}
                            </option>
                          ))}
                        </Select>
                        <Input
                          label="From"
                          type="date"
                          value={formData.assigned_date}
                          onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                        />
                      </div>
                      {selectedAsset?.assigned_to && (
                        <div>
                          <Button
                            type="button"
                            onClick={handleReturnAsset}
                            disabled={returnMutation.isPending || updateMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Return Asset
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Asset Name */}
                <Input
                  label="Asset Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Dell Laptop, Office Chair..."
                />

                {/* Main fields + Image upload */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">

                    {/* Asset ID + Serial Number */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-mono text-gray-700">
                          {selectedAsset?.asset_tag}
                        </div>
                      </div>
                      <Input
                        label="Serial Number *"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        required
                      />
                    </div>

                    {/* Brand + Vendor */}
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Brand"
                        value={formData.brand_id}
                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                      >
                        <option value="">Select Brand</option>
                        {brands.filter(b => b.is_active).map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </Select>
                      <Select
                        label="Vendor"
                        value={formData.vendor_id}
                        onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      >
                        <option value="">Select Vendor</option>
                        {vendors.filter(v => v.is_active).map(vendor => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </Select>
                    </div>

                    {/* Model + Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                      <Select
                        label="Category *"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.is_active).map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </Select>
                    </div>

                    {/* Location + Acquired */}
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Location"
                        value={formData.location_id}
                        onChange={(e) => {
                          const loc = assetLocations.find(l => l.id === e.target.value)
                          setFormData({ ...formData, location_id: e.target.value, location: loc?.name || '' })
                        }}
                        options={[
                          { value: '', label: 'Select Location' },
                          ...assetLocations.filter(l => l.is_active).map(l => ({ value: l.id, label: l.name }))
                        ]}
                      />
                      <Input
                        label="Acquired"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>

                    {/* Warranty Starts + Warranty Ends */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Warranty Starts"
                        type="date"
                        value={formData.warranty_start_date}
                        onChange={(e) => setFormData({ ...formData, warranty_start_date: e.target.value })}
                      />
                      <Input
                        label="Warranty Ends"
                        type="date"
                        value={formData.warranty_end_date}
                        onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                      />
                    </div>

                    {/* Purchase Price + Useful Life */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Purchase Price"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      />
                      <Input
                        label="Useful Life (Years)"
                        type="number"
                        min="1"
                        value={formData.useful_life_years}
                        onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                      />
                    </div>

                    {/* Salvage Value + Depreciation */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Salvage Value"
                        type="number"
                        step="0.01"
                        value={formData.salvage_value}
                        onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                      />
                      <Select
                        label="Depreciation Method"
                        value={formData.depreciation_method || 'straight_line'}
                        onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value as Asset['depreciation_method'] })}
                      >
                        <option value="straight_line">Straight-Line</option>
                        <option value="declining_balance">Declining Balance</option>
                        <option value="none">None</option>
                      </Select>
                    </div>

                    {/* Condition */}
                    <Select
                      label="Condition"
                      value={formData.condition || 'good'}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </Select>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Enter asset description..."
                      />
                    </div>
                  </div>

                  {/* Right column: Image upload — multi-slot */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Asset Images ({imagePreviews.filter(Boolean).length}/{MAX_IMAGES})</label>
                      <div className="flex gap-1">
                        <button type="button" title="Scan barcode / serial" onClick={() => openMobilePairing('barcode')}
                          className="p-1.5 rounded-md text-gray-500 hover:text-[#ff7e15] hover:bg-[#fff4ec] transition-colors">
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button type="button" title="Connect phone for photo" onClick={() => openMobilePairing('photo', imagePreviews.findIndex(p => !p) === -1 ? 0 : imagePreviews.findIndex(p => !p))}
                          className={`p-1.5 rounded-md transition-colors ${
                            mobileConnected ? 'text-green-500 bg-green-50' : 'text-gray-500 hover:text-[#ff7e15] hover:bg-[#fff4ec]'
                          }`}>
                          <Wifi className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Slider / main preview */}
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden min-h-[180px] flex items-center justify-center bg-gray-50 hover:border-[#ff7e15] transition-colors">
                      {imagePreviews.filter(Boolean).length === 0 ? (
                        <button type="button" className="flex flex-col items-center gap-2 py-6 text-gray-400 w-full"
                          onClick={() => { setActiveImageSlot(0); imageInputRef.current?.click() }}>
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">Click to upload image</span>
                          <span className="text-xs">PNG, JPG up to 5MB</span>
                        </button>
                      ) : (
                        <>
                          <img src={imagePreviews[sliderIndex] || imagePreviews.find(Boolean) || ''}
                            alt="Asset" className="w-full h-44 object-contain" />
                          <button type="button"
                            className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 shadow text-gray-500 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); removeImage(sliderIndex) }}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {imagePreviews.filter(Boolean).length > 1 && (
                            <>
                              <button type="button" onClick={() => setSliderIndex(i => (i - 1 + MAX_IMAGES) % MAX_IMAGES)}
                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white">
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setSliderIndex(i => (i + 1) % MAX_IMAGES)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white">
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
                            {imagePreviews.map((p, i) => p ? (
                              <button key={i} type="button" onClick={() => setSliderIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  sliderIndex === i ? 'bg-[#ff7e15]' : 'bg-gray-300'
                                }`} />
                            ) : null)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail row */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {Array.from({ length: MAX_IMAGES }).map((_, i) => (
                        <button key={i} type="button"
                          onClick={() => {
                            if (imagePreviews[i]) { setSliderIndex(i) }
                            else { setActiveImageSlot(i); imageInputRef.current?.click() }
                          }}
                          className={`relative aspect-square rounded-md border-2 overflow-hidden flex items-center justify-center transition-colors ${
                            imagePreviews[i]
                              ? sliderIndex === i ? 'border-[#ff7e15]' : 'border-gray-200'
                              : 'border-dashed border-gray-200 hover:border-[#ff7e15] bg-gray-50'
                          }`}>
                          {imagePreviews[i] ? (
                            <img src={imagePreviews[i]} alt={`slot ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <Plus className="h-4 w-4 text-gray-300" />
                          )}
                          <span className="absolute bottom-0 right-0 text-[9px] bg-black/30 text-white px-0.5 rounded-tl">{i + 1}</span>
                        </button>
                      ))}
                    </div>

                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : selectedAsset ? 'Update Asset' : 'Add Asset'}
              </Button>
            </ModalFooter>
            </form>
          )}
        </div>
      </Modal>

      {/* Mobile Pairing Modal */}
      <Modal open={showMobileQR} onClose={() => setShowMobileQR(false)} centered size="sm">
        <ModalHeader onClose={() => setShowMobileQR(false)}>
          {mobileQRMode === 'barcode' ? 'Scan Barcode / Serial Number' : `Connect Phone — Image ${activeImageSlot + 1}`}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-white rounded-xl border-2 border-gray-200">
              {mobileQRDataUrl && <img src={mobileQRDataUrl} alt="Pairing QR" className="w-64 h-64" />}
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {mobileQRMode === 'barcode'
                  ? 'Scan this QR code on your phone, then scan the asset barcode / serial number'
                  : 'Scan this QR code on your phone to open the camera and take a photo'}
              </p>
              <p className="text-xs text-gray-500">The result will appear here automatically.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Wifi className="h-4 w-4 shrink-0 animate-pulse" />
              Waiting for phone…
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowMobileQR(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* QR Code Modal */}
      <Modal open={showQRModal} onClose={() => setShowQRModal(false)} size="lg">
        <ModalHeader onClose={() => setShowQRModal(false)}>
          QR Code - {selectedAsset?.asset_tag}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-80 h-80"
                />
              )}
            </div>
            <div className="text-center">
              <div className="font-medium text-lg">{selectedAsset?.name}</div>
              <div className="text-sm text-gray-600">{selectedAsset?.asset_tag}</div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleDownloadQRCode}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
