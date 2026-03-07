'use client'

import React, { useState, useMemo } from 'react'
import { 
  FileText, Plus, Edit, Eye, CheckCircle, XCircle, Clock,
  Search, Filter, Download, User, MapPin, Calendar,
  DollarSign, AlertTriangle, Building2, Plane
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'
import { useTravelRequests, useApproveTravelRequest, useRejectTravelRequest } from '@/hooks/useTravel'
import { useEmployees, useCurrentEmployee } from '@/hooks/useEmployees'
import { useCurrentUserPermissions } from '@/hooks'

interface ApprovalWorkflow {
  id: string
  requestId: string
  level: number
  approverName: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  actionDate?: string
  comments?: string
  isCurrentLevel: boolean
}

const TravelRequestsPage = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'approvals' | 'templates' | 'workflow'>('requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const { data: travelRequests = [], isLoading } = useTravelRequests()
  const { data: employees = [] } = useEmployees()
  const { data: currentEmployee } = useCurrentEmployee()
  const approveMutation = useApproveTravelRequest()
  const rejectMutation = useRejectTravelRequest()
  const { data: roleInfo } = useCurrentUserPermissions()
  const isED = roleInfo?.role_name?.toLowerCase() === 'ed'

  const filteredRequests = useMemo(() => {
    return travelRequests.filter(request => {
      const matchesSearch = searchQuery === '' || 
        request.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.employee?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.employee?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.request_number?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === '' || request.status === statusFilter
      
      const matchesDepartment = departmentFilter === '' || 
        request.employee?.department_id === departmentFilter

      return matchesSearch && matchesStatus && matchesDepartment
    })
  }, [travelRequests, searchQuery, statusFilter, departmentFilter])

  const stats = useMemo(() => {
    const total = travelRequests.length
    const pending = travelRequests.filter(r => r.status === 'pending_approval' || r.status === 'submitted').length
    const approved = travelRequests.filter(r => r.status === 'approved').length
    const rejected = travelRequests.filter(r => r.status === 'rejected').length
    const totalCost = travelRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.estimated_cost || 0), 0)
    
    return { total, pending, approved, rejected, totalCost }
  }, [travelRequests])

  const handleApprove = async (requestId: string) => {
    const comments = prompt('Enter approval notes (optional):') || undefined
    await approveMutation.mutateAsync({
      id: requestId,
      approverId: currentEmployee?.id ?? '',
      comments,
    })
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    await rejectMutation.mutateAsync({
      id: requestId,
      approverId: currentEmployee?.id ?? '',
      reason,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending_approval': case 'submitted': case 'pending': return 'warning'
      case 'rejected': case 'cancelled': return 'danger'
      case 'draft': return 'secondary'
      default: return 'outline'
    }
  }

  const renderTravelRequests = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by employee name, destination, or request number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">Human Resources</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Loading travel requests...</span>
          </div>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          No travel requests found
        </Card>
      ) : (
        filteredRequests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{request.request_number}</h4>
                    <Badge variant={getStatusColor(request.status ?? '')} className="text-xs">
                      {request.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {request.employee?.first_name} {request.employee?.last_name}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {request.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {request.start_date && new Date(request.start_date).toLocaleDateString()} - {request.end_date && new Date(request.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">${request.estimated_cost?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">Estimated Cost</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Purpose:</strong> {request.purpose || 'N/A'}
              </p>
              {request.business_justification && (
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Business Justification:</strong> {request.business_justification}
                </p>
              )}
            </div>

            {request.status === 'pending_approval' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Pending approval
                  </span>
                </div>
              </div>
            )}

            {request.status === 'approved' && request.approved_by && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Approved {request.approved_date && `on ${new Date(request.approved_date).toLocaleDateString()}`}
                  </span>
                </div>
                
              </div>
            )}

            {request.status === 'rejected' && request.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    <strong>Rejected:</strong> {request.rejection_reason}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            {(request.status === 'pending_approval' || request.status === 'submitted') && isED && (
              <>
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={() => handleApprove(request.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="danger"
                  onClick={() => handleReject(request.id)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </Card>
      ))
      )}
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Approval Workflow Management</h3>
            <p className="text-blue-700 mt-1">
              Track and manage travel request approvals through the defined workflow hierarchy.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-yellow-100 rounded-lg inline-block mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Pending My Approval</h4>
          <p className="text-2xl font-bold text-yellow-600">8</p>
          <p className="text-sm text-gray-500">Requests awaiting action</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Approved Today</h4>
          <p className="text-2xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-500">Processed requests</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Overdue</h4>
          <p className="text-2xl font-bold text-orange-600">3</p>
          <p className="text-sm text-gray-500">Past approval deadline</p>
        </Card>
      </div>
    </div>
  )

  const renderTemplates = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <h3 className="font-semibold text-green-800">Request Templates</h3>
            <p className="text-green-700 mt-1">
              Pre-configured templates to streamline common travel request scenarios.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { 
            name: 'Conference Template', 
            description: 'Standard template for conference attendance with pre-filled common expenses',
            usage: 24 
          },
          { 
            name: 'Client Meeting Template', 
            description: 'Quick template for business meetings with clients',
            usage: 18 
          },
          { 
            name: 'Training Template', 
            description: 'Template for training and certification programs',
            usage: 12 
          },
          { 
            name: 'International Travel Template', 
            description: 'Comprehensive template for international business travel',
            usage: 8 
          }
        ].map((template, index) => (
          <Card key={index} className="p-6">
            <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Used {template.usage} times</span>
              <Button size="sm" variant="outline">Use Template</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderWorkflow = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-800">Workflow Configuration</h3>
            <p className="text-purple-700 mt-1">
              Configure approval workflows, routing rules, and delegation settings.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Default Approval Workflow</h3>
          <div className="space-y-4">
            {[
              { level: 1, role: 'Direct Manager', amount: '$0 - $2,000', time: '1 day' },
              { level: 2, role: 'Department Head', amount: '$2,001 - $5,000', time: '2 days' },
              { level: 3, role: 'Finance Director', amount: '$5,001+', time: '3 days' }
            ].map((step) => (
              <div key={step.level} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{step.level}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{step.role}</p>
                  <p className="text-sm text-gray-600">{step.amount} • {step.time} approval time</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Workflow Settings</h3>
          <div className="space-y-4">
            {[
              { setting: 'Auto-approval threshold', value: '$500', description: 'Requests under this amount are auto-approved' },
              { setting: 'Escalation timeout', value: '3 days', description: 'Auto-escalate if no action taken' },
              { setting: 'Emergency approval', value: 'Enabled', description: 'Allow urgent requests bypass workflow' },
              { setting: 'Delegation support', value: 'Enabled', description: 'Approvers can delegate authority' }
            ].map((setting, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{setting.setting}</p>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <Badge variant="outline">{setting.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Requests</h1>
          <p className="text-gray-500 mt-1">Manage travel request submissions, approvals, and workflow processing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Travel Request
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'requests', label: 'Requests', icon: FileText },
            { id: 'approvals', label: 'Approvals', icon: CheckCircle },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'workflow', label: 'Workflow', icon: Building2 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === 'requests' && renderTravelRequests()}
          {activeTab === 'approvals' && renderApprovals()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'workflow' && renderWorkflow()}
        </div>
      </Card>
    </div>
  )
}

export default TravelRequestsPage