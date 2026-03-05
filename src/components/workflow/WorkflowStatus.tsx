import React from 'react'
import { Badge } from '@/components/ui'
import { useWorkflowHistory } from '@/hooks/useWorkflow'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface WorkflowStatusProps {
  requestId: string
  requestType: string
  currentStatus: string
}

export function WorkflowStatus({ requestId, requestType, currentStatus }: WorkflowStatusProps) {
  const { data: workflow, isLoading } = useWorkflowHistory(requestId, requestType)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'skipped': 'bg-gray-100 text-gray-800'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      'manager': 'Manager',
      'department_head': 'Department Head',
      'hr': 'HR',
      'finance': 'Finance',
      'admin': 'Administrator'
    }
    return labels[role as keyof typeof labels] || role
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">No workflow information available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Approval Workflow</h3>
          <Badge className={getStatusBadge(Array.isArray(workflow) ? 'pending' : workflow.status)}>
            {Array.isArray(workflow) ? 'pending' : workflow.status}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Step {workflow.current_level} of {workflow.total_levels}
        </p>
      </div>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round((workflow.current_level / workflow.total_levels) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(workflow.current_level / workflow.total_levels) * 100}%` }}
            />
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3">
          {workflow.steps?.map((step: any, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(step.status)}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getRoleLabel(step.approver_role)}
                    </p>
                    {step.approver_name && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {step.approver_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge className={getStatusBadge(step.status)}>
                      {step.status}
                    </Badge>
                    {step.action_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(step.action_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                {step.comments && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start space-x-1">
                      <ChatBubbleLeftRightIcon className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{step.comments}</p>
                    </div>
                  </div>
                )}
                
                {step.is_current_level && step.status === 'pending' && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Current Step
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Submitted: {new Date(workflow.submitted_date || workflow.created_at).toLocaleDateString()}
            </span>
            {workflow.completed_date && (
              <span>
                Completed: {new Date(workflow.completed_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Business Justification */}
        {workflow.business_justification && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-900 mb-2">Business Justification</h4>
            <p className="text-xs text-gray-600">{workflow.business_justification}</p>
          </div>
        )}
      </div>
    </div>
  )
}