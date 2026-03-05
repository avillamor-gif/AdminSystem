'use client'

import { useState } from 'react'
import { useAssetRequests, useAssetCategories, useCreateAssetRequest, useUpdateAssetRequest, useApproveAssetRequest, useRejectAssetRequest, useFulfillAssetRequest, useDeleteAssetRequest, type AssetRequest } from '@/hooks/useAssets'
import { useAssets } from '@/hooks/useAssets'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Package, Plus, Clock, CheckCircle, XCircle, AlertTriangle, Edit, Trash2 } from 'lucide-react'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-green-100 text-green-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export default function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'fulfill'>('approve')
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    item_description: '',
    justification: '',
    priority: 'normal' as AssetRequest['priority']
  })
  const [actionFormData, setActionFormData] = useState({
    rejection_reason: '',
    asset_id: ''
  })

  const { data: roleInfo } = useCurrentUserPermissions()
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: requests = [] } = useAssetRequests({ status: statusFilter || undefined })
  const { data: categories = [] } = useAssetCategories()
  const { data: availableAssets = [] } = useAssets({ status: 'available' })
  const createMutation = useCreateAssetRequest()
  const updateMutation = useUpdateAssetRequest()
  const approveMutation = useApproveAssetRequest()
  const rejectMutation = useRejectAssetRequest()
  const fulfillMutation = useFulfillAssetRequest()
  const deleteMutation = useDeleteAssetRequest()

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  const handleOpenModal = (request?: AssetRequest) => {
    if (request) {
      setSelectedRequest(request)
      setFormData({
        category_id: request.category_id || '',
        item_description: request.item_description,
        justification: request.justification || '',
        priority: request.priority
      })
    } else {
      setSelectedRequest(null)
      setFormData({
        category_id: '',
        item_description: '',
        justification: '',
        priority: 'normal'
      })
    }
    setShowModal(true)
  }

  const handleOpenActionModal = (request: AssetRequest, action: 'approve' | 'reject' | 'fulfill') => {
    setSelectedRequest(request)
    setActionType(action)
    setActionFormData({ rejection_reason: '', asset_id: '' })
    setShowActionModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = { ...formData, employee_id: currentEmployee?.id || '' }

    if (selectedRequest) {
      await updateMutation.mutateAsync({ id: selectedRequest.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    
    setShowModal(false)
  }

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    const approverId = currentEmployee?.id || ''

    try {
      if (actionType === 'approve') {
        await approveMutation.mutateAsync({ id: selectedRequest.id, approvedBy: approverId })
      } else if (actionType === 'reject') {
        await rejectMutation.mutateAsync({ 
          id: selectedRequest.id, 
          approvedBy: approverId,
          reason: actionFormData.rejection_reason
        })
      } else if (actionType === 'fulfill') {
        await fulfillMutation.mutateAsync({ 
          id: selectedRequest.id, 
          assetId: actionFormData.asset_id
        })
      }
      setShowActionModal(false)
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Requests</h1>
          <p className="text-gray-600">Manage employee equipment requests</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-yellow-100 rounded-xl mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-100 rounded-xl mb-3">
            <CheckCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-1">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{stats.fulfilled}</p>
          <p className="text-sm text-gray-500">Fulfilled</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-xl mb-3">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">{stats.rejected}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Asset Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No requests found</td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.employee
                        ? `${request.employee.first_name} ${request.employee.last_name}`
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.item_description}</div>
                      {request.justification && (
                        <div className="text-sm text-gray-500">{request.justification.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.category?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[request.priority]}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requested_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {request.status === 'pending' && (
                          <>
                            <button onClick={() => handleOpenActionModal(request, 'approve')} title="Approve" className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleOpenActionModal(request, 'reject')} title="Reject" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button onClick={() => handleOpenActionModal(request, 'fulfill')} title="Fulfill" className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                            <Package className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleOpenModal(request)} title="Edit" className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(request.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
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

      {/* Request Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setShowModal(false)}>
            {selectedRequest ? 'Edit Request' : 'New Asset Request'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.filter(c => c.is_active).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={formData.item_description}
                  onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                  required
                  placeholder="What equipment do you need?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  placeholder="Why do you need this equipment?"
                />
              </div>

              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AssetRequest['priority'] })}
                required
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedRequest ? 'Update' : 'Submit Request'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Action Modal */}
      <Modal open={showActionModal} onClose={() => setShowActionModal(false)}>
        <form onSubmit={handleAction}>
          <ModalHeader onClose={() => setShowActionModal(false)}>
            {actionType === 'approve' && 'Approve Request'}
            {actionType === 'reject' && 'Reject Request'}
            {actionType === 'fulfill' && 'Fulfill Request'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Item Requested</div>
                <div className="font-medium">{selectedRequest?.item_description}</div>
                {selectedRequest?.employee && (
                  <div className="text-sm text-gray-500 mt-1">
                    By: {selectedRequest.employee.first_name} {selectedRequest.employee.last_name}
                  </div>
                )}
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    value={actionFormData.rejection_reason}
                    onChange={(e) => setActionFormData({ ...actionFormData, rejection_reason: e.target.value })}
                    required
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              {actionType === 'fulfill' && (
                <Select
                  label="Assign Asset"
                  value={actionFormData.asset_id}
                  onChange={(e) => setActionFormData({ ...actionFormData, asset_id: e.target.value })}
                  required
                >
                  <option value="">Select Asset</option>
                  {availableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={actionType === 'reject' ? 'danger' : 'primary'}>
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'fulfill' && 'Fulfill'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
