import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowService } from '../services/workflow.service'
import { toast } from 'react-hot-toast'

// Get workflow request by request ID and type
export function useWorkflowRequest(requestId: string, requestType: string, employeeId: string, metadata: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['workflow-requests', requestType, requestId],
    queryFn: () => workflowService.createWorkflowRequest({
      requestId,
      requestType,
      employeeId,
      metadata
    }),
    enabled: !!(requestId && requestType && employeeId),
  })
}

// Get workflows requiring approval for a specific user
export function useWorkflowApprovalsForUser(userId: string, role: string = 'manager') {
  return useQuery({
    queryKey: ['workflow-approvals', userId, role],
    queryFn: () => workflowService.getWorkflowsByApprover(userId, role),
    enabled: !!(userId && role),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    staleTime: 10000, // 10 seconds
  })
}

// Get workflow history for a request
export function useWorkflowHistory(requestId: string, requestType: string) {
  return useQuery({
    queryKey: ['workflow-history', requestType, requestId],
    queryFn: () => workflowService.getWorkflowsByEmployee(requestId),
    enabled: !!(requestId && requestType),
  })
}

// Get all pending workflows (admin view)
export function usePendingWorkflows() {
  return useQuery({
    queryKey: ['workflows', 'pending'],
    queryFn: () => workflowService.getWorkflowsByApprover('', 'admin'),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  })
}

// Get workflow statistics
export function useWorkflowStats() {
  return useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => workflowService.getWorkflowsByApprover('', 'admin'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get workflows by type
export function useWorkflowsByType(requestType: string) {
  return useQuery({
    queryKey: ['workflows', 'by-type', requestType],
    queryFn: () => workflowService.getWorkflowsByApprover('', 'admin'),
    enabled: !!requestType,
  })
}

// Get workflows by status
export function useWorkflowsByStatus(status: string) {
  return useQuery({
    queryKey: ['workflows', 'by-status', status],
    queryFn: () => workflowService.getWorkflowsByApprover('', 'admin'),
    enabled: !!status,
  })
}

// Get employee workflows (all workflows for a specific employee)
export function useEmployeeWorkflows(employeeId: string) {
  return useQuery({
    queryKey: ['workflows', 'employee', employeeId],
    queryFn: () => workflowService.getWorkflowsByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

// Create workflow request
export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: workflowService.createWorkflowRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow created successfully')
    },
    onError: (error) => {
      console.error('Error creating workflow:', error)
      toast.error('Failed to create workflow')
    },
  })
}

// Process approval
export function useProcessApproval() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      requestId, 
      requestType, 
      approverId, 
      action, 
      comments 
    }: { 
      requestId: string
      requestType: string
      approverId: string
      action: 'approved' | 'rejected'
      comments?: string 
    }) => workflowService.processApproval(requestId, requestType, approverId, action, comments),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['workflow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] })
      
      // Also invalidate the specific request type queries
      const requestTypeKeys: Record<string, string[]> = {
        leave: ['leave-requests'],
        travel: ['travel-requests'],
        expense: ['expense-requests'],
        asset: ['asset-assignments'],
        publication: ['publication-requests'],
        termination: ['termination-requests']
      }
      
      if (requestTypeKeys[variables.requestType]) {
        queryClient.invalidateQueries({ queryKey: requestTypeKeys[variables.requestType] })
      }
      
      const actionText = variables.action === 'approved' ? 'approved' : 'rejected'
      toast.success(`Request ${actionText} successfully`)
    },
    onError: (error) => {
      console.error('Error processing approval:', error)
      toast.error('Failed to process approval')
    },
  })
}

// Cancel workflow
export function useCancelWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      requestId, 
      requestType 
    }: { 
      requestId: string
      requestType: string 
    }) => workflowService.cancelWorkflow(requestId, requestType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow cancelled successfully')
    },
    onError: (error) => {
      console.error('Error cancelling workflow:', error)
      toast.error('Failed to cancel workflow')
    },
  })
}

// Get workflow templates
export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => workflowService.getWorkflowTemplates('general'),
    staleTime: 30 * 60 * 1000, // 30 minutes (templates don't change often)
  })
}

// Get workflow template by request type
export function useWorkflowTemplate(requestType: string) {
  return useQuery({
    queryKey: ['workflow-templates', requestType],
    queryFn: () => workflowService.getWorkflowTemplate(requestType, {}),
    enabled: !!requestType,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Update workflow template (admin only)
export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: any 
    }) => workflowService.getWorkflowTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
      toast.success('Workflow template updated successfully')
    },
    onError: (error) => {
      console.error('Error updating workflow template:', error)
      toast.error('Failed to update workflow template')
    },
  })
}

// Escalate workflow (when timeout occurs)
export function useEscalateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      requestType,
      requestId,
      employee,
      metadata
    }: { 
      requestType: string
      requestId: string
      employee: any
      metadata: Record<string, any>
    }) => workflowService.createWorkflow(requestType, requestId, employee, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-approvals'] })
      toast.success('Workflow escalated successfully')
    },
    onError: (error) => {
      console.error('Error escalating workflow:', error)
      toast.error('Failed to escalate workflow')
    },
  })
}

// Get overdue workflows
export function useOverdueWorkflows() {
  return useQuery({
    queryKey: ['workflows', 'overdue'],
    queryFn: () => workflowService.getWorkflowsByApprover('', 'admin'),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  })
}