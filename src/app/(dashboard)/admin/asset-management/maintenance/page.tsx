'use client'

import { useState } from 'react'
import { useAssetMaintenance, useAssets, useAssetVendors, useCreateAssetMaintenance, useUpdateAssetMaintenance, useDeleteAssetMaintenance, type AssetMaintenance } from '@/hooks/useAssets'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Wrench, Plus, Calendar, DollarSign, CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-react'

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const typeLabels = {
  repair: 'Repair',
  inspection: 'Inspection',
  upgrade: 'Upgrade',
  cleaning: 'Cleaning',
  calibration: 'Calibration'
}

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<AssetMaintenance | null>(null)
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: 'repair' as AssetMaintenance['maintenance_type'],
    scheduled_date: '',
    performed_by: '',
    vendor_id: '',
    cost: '',
    description: '',
    notes: '',
    status: 'scheduled' as AssetMaintenance['status']
  })

  const { data: maintenance = [] } = useAssetMaintenance({ status: statusFilter || undefined })
  const { data: assets = [] } = useAssets()
  const { data: vendors = [] } = useAssetVendors()
  const createMutation = useCreateAssetMaintenance()
  const updateMutation = useUpdateAssetMaintenance()
  const deleteMutation = useDeleteAssetMaintenance()

  const stats = {
    total: maintenance.length,
    scheduled: maintenance.filter(m => m.status === 'scheduled').length,
    inProgress: maintenance.filter(m => m.status === 'in_progress').length,
    completed: maintenance.filter(m => m.status === 'completed').length,
    totalCost: maintenance.filter(m => m.status === 'completed').reduce((sum, m) => sum + (m.cost || 0), 0)
  }

  const handleOpenModal = (record?: AssetMaintenance) => {
    if (record) {
      setSelectedMaintenance(record)
      setFormData({
        asset_id: record.asset_id,
        maintenance_type: record.maintenance_type,
        scheduled_date: record.scheduled_date || '',
        performed_by: record.performed_by || '',
        vendor_id: record.vendor_id || '',
        cost: record.cost?.toString() || '',
        description: record.description,
        notes: record.notes || '',
        status: record.status
      })
    } else {
      setSelectedMaintenance(null)
      setFormData({
        asset_id: '',
        maintenance_type: 'repair',
        scheduled_date: '',
        performed_by: '',
        vendor_id: '',
        cost: '',
        description: '',
        notes: '',
        status: 'scheduled'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      completed_date: formData.status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    }

    if (selectedMaintenance) {
      await updateMutation.mutateAsync({ id: selectedMaintenance.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Maintenance</h1>
          <p className="text-gray-600">Schedule and track asset maintenance and repairs</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Wrench className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Records</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-100 rounded-xl mb-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-1">{stats.scheduled}</p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-yellow-100 rounded-xl mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{stats.completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-purple-100 rounded-xl mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-1">₱{stats.totalCost.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Cost</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {/* Maintenance Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Maintenance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No maintenance records found</td>
                </tr>
              ) : (
                maintenance.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.asset?.name}</div>
                          <div className="text-sm text-gray-500">{record.asset?.asset_tag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {typeLabels[record.maintenance_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.performed_by || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.cost ? `₱${record.cost.toLocaleString()}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenModal(record)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(record.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Maintenance Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setShowModal(false)}>
            {selectedMaintenance ? 'Edit Maintenance Record' : 'Schedule Maintenance'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Asset"
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                required
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.name}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Maintenance Type"
                  value={formData.maintenance_type}
                  onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as AssetMaintenance['maintenance_type'] })}
                  required
                >
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="calibration">Calibration</option>
                </Select>

                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetMaintenance['status'] })}
                  required
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>

              <Input
                label="Scheduled Date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Performed By"
                  value={formData.performed_by}
                  onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                  placeholder="Technician name"
                />

                <Select
                  label="Vendor (Optional)"
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                >
                  <option value="">Select Vendor</option>
                  {vendors.filter(v => v.is_active).map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </Select>
              </div>

              <Input
                label="Cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe the maintenance work..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedMaintenance ? 'Update' : 'Schedule'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
