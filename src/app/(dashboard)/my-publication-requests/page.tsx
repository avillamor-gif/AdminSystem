'use client'

import React, { useState, useMemo } from 'react'
import { 
  BookOpen, Plus, Eye, Clock, CheckCircle, XCircle, FileText
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { usePublicationRequests, useCreatePublicationRequest } from '@/hooks/usePublications'
import { useEmployees } from '@/hooks/useEmployees'

export default function MyPublicationRequestsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const { data: publicationRequests = [], isLoading } = usePublicationRequests()
  const { data: employees = [] } = useEmployees()
  const createPublicationMutation = useCreatePublicationRequest()

  // TODO: Get from auth context
  const currentEmployeeId = employees[0]?.id || null

  const myRequests = useMemo(() => {
    if (!currentEmployeeId) return []
    return publicationRequests.filter(req => req.employee_id === currentEmployeeId)
  }, [publicationRequests, currentEmployeeId])

  const handleCreateRequest = async () => {
    if (!currentEmployeeId) return

    const title = (document.getElementById('pub-title') as HTMLInputElement).value
    const publicationType = (document.getElementById('pub-type') as HTMLSelectElement).value
    const publisher = (document.getElementById('pub-publisher') as HTMLInputElement).value
    const cost = parseFloat((document.getElementById('pub-cost') as HTMLInputElement).value || '0')
    const justification = (document.getElementById('pub-justification') as HTMLTextAreaElement).value
    const urgency = (document.getElementById('pub-urgency') as HTMLSelectElement).value

    try {
      await createPublicationMutation.mutateAsync({
        employee_id: currentEmployeeId,
        publication_title: title,
        publication_type: publicationType,
        publisher,
        estimated_cost: cost,
        justification,
        priority: urgency,
        purpose: justification,
        request_type: 'purchase',
        status: 'submitted'
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating publication request:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      ordered: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[urgency] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Publication Requests</h1>
          <p className="text-gray-600 mt-1">Request books, journals, and other publications</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          New Publication Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{myRequests.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {myRequests.filter(r => r.status === 'pending_approval' || r.status === 'submitted').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {myRequests.filter(r => r.status === 'approved' || r.status === 'ordered' || r.status === 'received').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {myRequests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publisher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      <span className="ml-3 text-gray-600">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : myRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No publication requests yet. Click "New Publication Request" to get started.
                  </td>
                </tr>
              ) : (
                myRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.request_number}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.publication_title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.publication_type?.replace(/_/g, ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.publisher || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${request.estimated_cost?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getUrgencyBadge(request.priority ?? '')}>
                        {request.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadge(request.status ?? '')}>
                        {request.status?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Publication Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publication Title *</label>
                <Input id="pub-title" type="text" placeholder="Enter title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <Input id="pub-author" type="text" placeholder="Author name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    id="pub-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal</option>
                    <option value="magazine">Magazine</option>
                    <option value="research_paper">Research Paper</option>
                    <option value="report">Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                  <Input id="pub-publisher" type="text" placeholder="Publisher name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost *</label>
                  <Input id="pub-cost" type="number" placeholder="0.00" step="0.01" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  id="pub-urgency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Justification *</label>
                <textarea
                  id="pub-justification"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Explain why you need this publication..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={createPublicationMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleCreateRequest}
                disabled={createPublicationMutation.isPending}
              >
                {createPublicationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Publication Request Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Request Number</label>
                  <p className="text-gray-900">{selectedRequest.request_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusBadge(selectedRequest.status)}>
                    {selectedRequest.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-gray-900">{selectedRequest.publication_title}</p>
              </div>
              {selectedRequest.publisher && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Author</label>
                  <p className="text-gray-900">{selectedRequest.publisher}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{selectedRequest.publication_type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Publisher</label>
                  <p className="text-gray-900">{selectedRequest.publisher || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                  <p className="text-gray-900">${selectedRequest.estimated_cost?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Urgency</label>
                  <Badge className={getUrgencyBadge(selectedRequest.priority)}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Justification</label>
                <p className="text-gray-900">{selectedRequest.justification}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setSelectedRequest(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
