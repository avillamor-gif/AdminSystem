'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Plus, Eye, CheckCircle, XCircle, Clock,
  Search, Filter, Download, MapPin, Calendar,
  DollarSign, AlertTriangle, Building2, Plane,
  Settings, Bell, GitBranch, ExternalLink, User, Briefcase
} from 'lucide-react'
import { Card, Button, Badge, Input, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import { useTravelRequests, useApproveTravelRequest, useRejectTravelRequest } from '@/hooks/useTravel'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { useCurrentUserPermissions, useWorkflowConfig, useDepartments } from '@/hooks'
import { ROLE_SLUG_LABELS } from '@/services/workflowConfig.service'

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
  const [approveModal, setApproveModal] = useState<{ open: boolean; requestId: string; comments: string }>({ open: false, requestId: '', comments: '' })
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string; reason: string }>({ open: false, requestId: '', reason: '' })

  const { data: travelRequests = [], isLoading } = useTravelRequests()
  const { data: currentEmployee } = useCurrentEmployee()
  const approveMutation = useApproveTravelRequest()
  const rejectMutation = useRejectTravelRequest()
  const { data: roleInfo } = useCurrentUserPermissions()
  const isED = roleInfo?.role_name?.toLowerCase() === 'ed'
  const { data: travelWorkflowConfig } = useWorkflowConfig('travel')
  const { data: departments = [] } = useDepartments()
  const router = useRouter()
  // Allow approve/reject if the user's role matches any step in the workflow config
  const canApprove = travelWorkflowConfig?.approval_steps?.some(
    s => s.approver_role === roleInfo?.role_name?.toLowerCase()
  ) ?? isED

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
    setApproveModal({ open: true, requestId, comments: '' })
  }

  const handleReject = async (requestId: string) => {
    setRejectModal({ open: true, requestId, reason: '' })
  }

  const confirmApprove = async () => {
    await approveMutation.mutateAsync({
      id: approveModal.requestId,
      approverId: currentEmployee?.id ?? '',
      comments: approveModal.comments || undefined,
    })
    setApproveModal({ open: false, requestId: '', comments: '' })
    setSelectedRequest(null)
  }

  const confirmReject = async () => {
    if (!rejectModal.reason.trim()) return
    await rejectMutation.mutateAsync({
      id: rejectModal.requestId,
      approverId: currentEmployee?.id ?? '',
      reason: rejectModal.reason,
    })
    setRejectModal({ open: false, requestId: '', reason: '' })
    setSelectedRequest(null)
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
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
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
            {(request as any).budget_plan_url && (
              <a
                href={(request as any).budget_plan_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Budget Plan
                </Button>
              </a>
            )}
            {(request.status === 'pending_approval' || request.status === 'submitted') && canApprove && (
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

  const renderApprovals = () => {
    const pending = travelRequests.filter(r => r.status === 'submitted' || r.status === 'pending_approval')
    const approved = travelRequests.filter(r => r.status === 'approved')
    const today = new Date().toDateString()
    const approvedToday = approved.filter(r => r.approved_date && new Date(r.approved_date).toDateString() === today)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="p-4 bg-yellow-100 rounded-lg inline-block mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Awaiting Approval</h4>
            <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-sm text-gray-500">Requests pending action</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Approved Today</h4>
            <p className="text-2xl font-bold text-green-600">{approvedToday.length}</p>
            <p className="text-sm text-gray-500">Processed today</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Total Approved</h4>
            <p className="text-2xl font-bold text-blue-600">{approved.length}</p>
            <p className="text-sm text-gray-500">All time</p>
          </Card>
        </div>

        {pending.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Requests Awaiting Approval</h3>
            <div className="space-y-3">
              {pending.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{request.request_number}</span>
                      <Badge variant="warning" className="text-xs">
                        {request.status?.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.employee?.first_name} {request.employee?.last_name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {request.destination}
                    </p>
                  </div>
                  <div className="text-right">
                  <p className="font-bold text-gray-900">₱{(request.estimated_cost ?? 0).toLocaleString()}</p>
                  {(request as any).budget_plan_url && (
                    <a href={(request as any).budget_plan_url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center justify-end gap-1 text-xs text-green-700 hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      Open Budget Plan
                    </a>
                  )}
                  {canApprove && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="primary" onClick={() => handleApprove(request.id)} disabled={approveMutation.isPending}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(request.id)} disabled={rejectMutation.isPending}>
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {pending.length === 0 && (
          <Card className="p-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No travel requests awaiting approval.</p>
          </Card>
        )}
      </div>
    )
  }

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

  const renderWorkflow = () => {
    if (!travelWorkflowConfig) {
      return (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
          Loading workflow configuration...
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <GitBranch className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-800">Travel Approval Workflow</h3>
                <p className="text-purple-700 mt-1 text-sm">
                  {travelWorkflowConfig.description ?? 'Live configuration from Workflow & Notification Settings.'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/admin/system-config/workflow-settings')}
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit Settings
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Approval Steps</h3>
            {travelWorkflowConfig.approval_steps.length === 0 ? (
              <p className="text-gray-500 text-sm">No approval steps configured.</p>
            ) : (
              <div className="space-y-3">
                {travelWorkflowConfig.approval_steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-orange-600">{step.level}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{step.label}</p>
                      <p className="text-sm text-gray-500">
                        {ROLE_SLUG_LABELS[step.approver_role] ?? step.approver_role}
                        {' · '}Timeout: {step.timeout_days} day{step.timeout_days !== 1 ? 's' : ''}
                        {step.escalation_role && ` · Escalates to: ${ROLE_SLUG_LABELS[step.escalation_role] ?? step.escalation_role}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notification Recipients</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-700">On Request Submission</p>
                </div>
                {travelWorkflowConfig.notify_on_submit.length === 0 ? (
                  <p className="text-xs text-gray-400 ml-6">No recipients configured</p>
                ) : (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {travelWorkflowConfig.notify_on_submit.map(slug => (
                      <span key={slug} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {ROLE_SLUG_LABELS[slug] ?? slug}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-700">On Decision (CC)</p>
                </div>
                {travelWorkflowConfig.notify_on_decision.length === 0 ? (
                  <p className="text-xs text-gray-400 ml-6">Only the requester is notified</p>
                ) : (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {travelWorkflowConfig.notify_on_decision.map(slug => (
                      <span key={slug} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ROLE_SLUG_LABELS[slug] ?? slug}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

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
          <Button onClick={() => router.push('/travel/travel-request')}>
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

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="lg">
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedRequest.request_number}</h2>
                <p className="text-sm text-gray-500">Travel Request Details</p>
              </div>
              <Badge variant={getStatusColor(selectedRequest.status ?? '')} className="ml-2">
                {selectedRequest.status?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* Employee */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Requested by</p>
                  <p className="font-medium text-gray-900">{selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}</p>
                </div>
              </div>

              {/* Destination & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Destination</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />{selectedRequest.destination || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Travel Dates</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {selectedRequest.start_date ? new Date(selectedRequest.start_date).toLocaleDateString() : '—'} – {selectedRequest.end_date ? new Date(selectedRequest.end_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="font-medium text-gray-900">{selectedRequest.duration || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Urgency</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedRequest.urgency || '—'}</p>
                </div>
              </div>

              {/* Purpose & Justification */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Purpose</p>
                <p className="text-gray-800">{selectedRequest.purpose || '—'}</p>
              </div>
              {selectedRequest.business_justification && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Business Justification</p>
                  <p className="text-gray-800">{selectedRequest.business_justification}</p>
                </div>
              )}

              {/* Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimated Cost</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {selectedRequest.currency || '₱'}{(selectedRequest.estimated_cost ?? 0).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.budget_code && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget Code</p>
                    <p className="font-medium text-gray-900">{selectedRequest.budget_code}</p>
                  </div>
                )}
              </div>

              {/* Budget Plan */}
              {selectedRequest.budget_plan_url && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Budget Plan</p>
                  <a
                    href={selectedRequest.budget_plan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-700 font-medium hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {selectedRequest.budget_plan_filename || 'Open Budget Plan in Google Drive'}
                  </a>
                </div>
              )}

              {/* Itinerary */}
              {Array.isArray(selectedRequest.itinerary) && selectedRequest.itinerary.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Itinerary</p>
                  <div className="space-y-2">
                    {selectedRequest.itinerary.map((item: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                        <span className="font-medium">{item.date || item.day}</span>
                        {item.activity && <span className="text-gray-600"> — {item.activity}</span>}
                        {item.location && <span className="text-gray-500"> ({item.location})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destinations detail */}
              {Array.isArray(selectedRequest.destinations_detail) && selectedRequest.destinations_detail.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Destinations Detail</p>
                  <div className="space-y-2">
                    {selectedRequest.destinations_detail.map((dest: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{typeof dest === 'string' ? dest : dest.location || dest.city || JSON.stringify(dest)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {Array.isArray(selectedRequest.equipment_requested) && selectedRequest.equipment_requested.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Equipment Requested</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.equipment_requested.map((eq: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        {typeof eq === 'string' ? eq : eq.name || eq.type || JSON.stringify(eq)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {Array.isArray(selectedRequest.publications_requested) && selectedRequest.publications_requested.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Publications Requested</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.publications_requested.map((pub: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
                        {typeof pub === 'string' ? pub : pub.title || pub.name || JSON.stringify(pub)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                  <p className="text-red-800 text-sm">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-2 w-full">
              {(selectedRequest.status === 'pending_approval' || selectedRequest.status === 'submitted') && canApprove && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </>
              )}
              <Button variant="secondary" className="ml-auto" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* Approve Modal */}
      <Modal isOpen={approveModal.open} onClose={() => setApproveModal({ open: false, requestId: '', comments: '' })}>
        <ModalHeader>Approve Travel Request</ModalHeader>
        <ModalBody>
          <p className="text-gray-600 mb-3">Add optional approval notes before approving this travel request.</p>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
            placeholder="Approval notes (optional)..."
            value={approveModal.comments}
            onChange={(e) => setApproveModal(prev => ({ ...prev, comments: e.target.value }))}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setApproveModal({ open: false, requestId: '', comments: '' })}>Cancel</Button>
          <Button variant="primary" onClick={confirmApprove} disabled={approveMutation.isPending}>
            <CheckCircle className="w-4 h-4 mr-1" />
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, requestId: '', reason: '' })}>
        <ModalHeader>Reject Travel Request</ModalHeader>
        <ModalBody>
          <p className="text-gray-600 mb-3">Please provide a reason for rejecting this travel request.</p>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="Rejection reason (required)..."
            value={rejectModal.reason}
            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, requestId: '', reason: '' })}>Cancel</Button>
          <Button
            variant="danger"
            onClick={confirmReject}
            disabled={rejectMutation.isPending || !rejectModal.reason.trim()}
          >
            <XCircle className="w-4 h-4 mr-1" />
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default TravelRequestsPage