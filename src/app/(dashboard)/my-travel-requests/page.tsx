'use client'

import React, { useState, useMemo } from 'react'
import { 
  Plane, Plus, Eye, Clock, CheckCircle, XCircle, Calendar, MapPin, DollarSign
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { useTravelRequests, useCreateTravelRequest } from '@/hooks/useTravel'
import { useCurrentEmployee } from '@/hooks/useEmployees'

export default function MyTravelRequestsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const { data: travelRequests = [], isLoading } = useTravelRequests()
  const { data: currentEmployee } = useCurrentEmployee()
  const createTravelMutation = useCreateTravelRequest()

  const currentEmployeeId = currentEmployee?.id ?? null
  const employeeName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
    : '—'

  const myRequests = useMemo(() => {
    if (!currentEmployeeId) return []
    return travelRequests.filter(req => req.employee_id === currentEmployeeId)
  }, [travelRequests, currentEmployeeId])

  const handleCreateRequest = async () => {
    if (!currentEmployeeId) return

    const destination = (document.getElementById('destination') as HTMLInputElement).value
    const purpose = (document.getElementById('purpose') as HTMLSelectElement).value
    const startDate = (document.getElementById('start-date') as HTMLInputElement).value
    const endDate = (document.getElementById('end-date') as HTMLInputElement).value
    const estimatedCost = parseFloat((document.getElementById('estimated-cost') as HTMLInputElement).value || '0')
    const justification = (document.getElementById('justification') as HTMLTextAreaElement).value

    try {
      await createTravelMutation.mutateAsync({
        employee_id: currentEmployeeId,
        destination,
        purpose,
        start_date: startDate,
        end_date: endDate,
        estimated_cost: estimatedCost,
        business_justification: justification,
        status: 'submitted'
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating travel request:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Travel Requests</h1>
          <p className="text-gray-600 mt-1">Submit and track your business travel requests</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Travel Request
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
            <Plane className="w-8 h-8 text-blue-600" />
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
                {myRequests.filter(r => r.status === 'approved').length}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Travel Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      <span className="ml-3 text-gray-600">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : myRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No travel requests yet. Click "New Travel Request" to get started.
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
                        <div className="text-sm font-medium text-gray-900">{request.destination}</div>
                        <div className="text-sm text-gray-500">{request.country || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.purpose?.replace(/_/g, ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${request.estimated_cost?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadge(request.status ?? "")}>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Travel Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input
                  type="text"
                  value={employeeName}
                  disabled
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                  <Input id="destination" type="text" placeholder="City, Country" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                  <select
                    id="purpose"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="business_meeting">Business Meeting</option>
                    <option value="conference">Conference</option>
                    <option value="training">Training</option>
                    <option value="client_visit">Client Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <Input id="start-date" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost *</label>
                <Input id="estimated-cost" type="number" placeholder="0.00" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Justification *</label>
                <textarea
                  id="justification"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Explain the business reason for this travel..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={createTravelMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleCreateRequest}
                disabled={createTravelMutation.isPending}
              >
                {createTravelMutation.isPending ? (
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Travel Request Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Request Number</label>
                  <p className="text-gray-900">{selectedRequest.request_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusBadge(selectedRequest.status ?? "")}>
                    {selectedRequest.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Destination</label>
                <p className="text-gray-900">{selectedRequest.destination}, {selectedRequest.country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Purpose</label>
                <p className="text-gray-900">{selectedRequest.purpose?.replace(/_/g, ' ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Travel Dates</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                  <p className="text-gray-900">${selectedRequest.estimated_cost?.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Business Justification</label>
                <p className="text-gray-900">{selectedRequest.business_justification}</p>
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
