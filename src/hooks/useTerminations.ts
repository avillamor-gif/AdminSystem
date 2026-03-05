import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { terminationService, terminationKeys, TerminationRequestFilters, TerminationRequestInsert, TerminationRequestUpdate } from '@/services/termination.service'
import { toast } from 'sonner'

// Get all termination requests
export function useTerminationRequests(filters: TerminationRequestFilters = {}) {
  return useQuery({
    queryKey: terminationKeys.list(filters),
    queryFn: () => terminationService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get termination request by ID
export function useTerminationRequest(id: string) {
  return useQuery({
    queryKey: terminationKeys.detail(id),
    queryFn: () => terminationService.getById(id),
    enabled: !!id,
  })
}

// Get termination requests requiring approval
export function useTerminationApprovalsForUser(userId: string) {
  return useQuery({
    queryKey: terminationKeys.approvals(userId),
    queryFn: () => terminationService.getRequiringApproval(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Get termination statistics
export function useTerminationStats() {
  return useQuery({
    queryKey: terminationKeys.stats(),
    queryFn: () => terminationService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get upcoming terminations
export function useUpcomingTerminations() {
  return useQuery({
    queryKey: terminationKeys.upcoming(),
    queryFn: () => terminationService.getUpcomingTerminations(),
    refetchInterval: 60000, // Check every minute
  })
}

// Get resignations
export function useResignations() {
  return useQuery({
    queryKey: terminationKeys.resignations(),
    queryFn: () => terminationService.getResignations(),
    staleTime: 10 * 60 * 1000,
  })
}

// Create termination request
export function useCreateTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<TerminationRequestInsert, 'request_number'>) => 
      terminationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request created successfully')
    },
    onError: (error) => {
      console.error('Error creating termination request:', error)
      toast.error('Failed to create termination request')
    },
  })
}

// Update termination request
export function useUpdateTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TerminationRequestUpdate }) =>
      terminationService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      queryClient.setQueryData(terminationKeys.detail(data.id), data)
      toast.success('Termination request updated successfully')
    },
    onError: (error) => {
      console.error('Error updating termination request:', error)
      toast.error('Failed to update termination request')
    },
  })
}

// Submit termination request
export function useSubmitTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      employeeId, 
      employeeName, 
      department 
    }: { 
      id: string
      employeeId: string
      employeeName: string
      department?: string 
    }) => terminationService.submit(id, employeeId, employeeName, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request submitted for approval')
    },
    onError: (error) => {
      console.error('Error submitting termination request:', error)
      toast.error('Failed to submit termination request')
    },
  })
}

// Approve termination request
export function useApproveTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      comments 
    }: { 
      id: string
      approverId: string
      comments?: string 
    }) => terminationService.approve(id, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request approved')
    },
    onError: (error) => {
      console.error('Error approving termination request:', error)
      toast.error('Failed to approve termination request')
    },
  })
}

// Reject termination request
export function useRejectTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      reason 
    }: { 
      id: string
      approverId: string
      reason: string 
    }) => terminationService.reject(id, approverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request rejected')
    },
    onError: (error) => {
      console.error('Error rejecting termination request:', error)
      toast.error('Failed to reject termination request')
    },
  })
}

// Process termination (final step - updates employee status)
export function useProcessTermination() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      actualLastWorkingDate, 
      hrNotes 
    }: { 
      id: string
      actualLastWorkingDate?: string
      hrNotes?: string 
    }) => terminationService.process(id, actualLastWorkingDate, hrNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      // Also invalidate employees list since status changed
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Termination processed successfully')
    },
    onError: (error) => {
      console.error('Error processing termination:', error)
      toast.error('Failed to process termination')
    },
  })
}

// Cancel termination request
export function useCancelTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => terminationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request cancelled')
    },
    onError: (error) => {
      console.error('Error cancelling termination request:', error)
      toast.error('Failed to cancel termination request')
    },
  })
}

// Delete termination request
export function useDeleteTerminationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => terminationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.all })
      toast.success('Termination request deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting termination request:', error)
      toast.error('Failed to delete termination request')
    },
  })
}

// Calculate notice period helper hook
export function useCalculateNoticePeriod(hireDate: string, terminationType: string) {
  return useQuery({
    queryKey: ['notice-period', hireDate, terminationType],
    queryFn: () => terminationService.calculateNoticePeriod(hireDate, terminationType),
    enabled: !!(hireDate && terminationType),
  })
}