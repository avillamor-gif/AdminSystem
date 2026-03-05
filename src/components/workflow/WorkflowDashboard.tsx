import React from 'react'
import { Badge } from '@/components/ui'
import { 
  useWorkflowApprovalsForUser, 
  useWorkflowStats,
  useProcessApproval,
  useOverdueWorkflows
} from '@/hooks/useWorkflow'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface WorkflowDashboardProps {
  userId: string
  userRole: string
}

export function WorkflowDashboard({ userId, userRole }: WorkflowDashboardProps) {
  const { data: approvals = [], isLoading: approvalsLoading } = useWorkflowApprovalsForUser(userId)
  const { data: stats, isLoading: statsLoading } = useWorkflowStats()
  const { data: overdueWorkflows = [] } = useOverdueWorkflows()
  const { mutate: processApproval, isPending: processingApproval } = useProcessApproval()

  const handleApproval = (requestId: string, requestType: string, action: 'approved' | 'rejected', comments?: string) => {
    processApproval({ requestId, requestType, approverId: userId, action, comments })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-purple-100 text-purple-800'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      'leave': 'Leave Request',
      'travel': 'Travel Request',
      'expense': 'Expense Request',
      'asset': 'Asset Assignment',
      'publication': 'Publication Request',
      'termination': 'Termination Request'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (approvalsLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Workflows</h3>
            <p className="text-2xl font-bold text-gray-900">{Array.isArray(stats) ? stats.length : 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">{Array.isArray(stats) ? stats.filter((w: any) => w.status === 'pending').length : 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="text-2xl font-bold text-green-600">{Array.isArray(stats) ? stats.filter((w: any) => w.status === 'approved').length : 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
            <p className="text-2xl font-bold text-red-600">{overdueWorkflows.length}</p>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Pending Approvals</h2>
          <p className="text-sm text-gray-500">Requests requiring your approval</p>
        </div>
        
        {approvals.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {approvals.map((workflow) => (
              <div key={workflow.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getPriorityIcon(workflow.priority || 'medium')}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {getRequestTypeLabel(workflow.requestType)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {workflow.employeeName} • {workflow.department}
                      </p>
                      {workflow.business_justification && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {workflow.business_justification}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {workflow.amount && (
                      <span className="text-sm font-medium text-gray-900">
                        {workflow.currency} {workflow.amount.toLocaleString()}
                      </span>
                    )}
                    <Badge className={getStatusBadge(workflow.status)}>
                      {workflow.status}
                    </Badge>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproval(workflow.requestId, workflow.requestType, 'approved')}
                        disabled={processingApproval}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(workflow.requestId, workflow.requestType, 'rejected', 'Rejected by approver')}
                        disabled={processingApproval}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Workflow Progress */}
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Step {workflow.currentLevel} of {workflow.totalLevels}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(workflow.currentLevel / workflow.totalLevels) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(workflow.submittedDate || (workflow as any).created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overdue Workflows (Admin/HR view) */}
      {(userRole === 'admin' || userRole === 'hr') && overdueWorkflows.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg">
          <div className="px-6 py-4 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-medium text-red-900">Overdue Workflows</h2>
            </div>
            <p className="text-sm text-red-700">These workflows require immediate attention</p>
          </div>
          
          <div className="divide-y divide-red-200">
            {overdueWorkflows.slice(0, 5).map((workflow: any) => (
              <div key={workflow.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-900">
                      {getRequestTypeLabel(workflow.request_type)}
                    </h3>
                    <p className="text-sm text-red-700">
                      {workflow.employee_name} • Overdue by {Math.floor((Date.now() - new Date(workflow.submitted_date || workflow.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  <button className="text-red-600 hover:text-red-700">
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}