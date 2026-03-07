import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { travelService, travelKeys, TravelRequestFilters, TravelRequestInsert, TravelRequestUpdate } from '@/services/travel.service'
import { toast } from 'react-hot-toast'

// Get all travel requests
export function useTravelRequests(filters: TravelRequestFilters = {}) {
  return useQuery({
    queryKey: travelKeys.list(filters),
    queryFn: () => travelService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get travel request by ID
export function useTravelRequest(id: string) {
  return useQuery({
    queryKey: travelKeys.detail(id),
    queryFn: () => travelService.getById(id),
    enabled: !!id,
  })
}

// Get travel requests requiring approval
export function useTravelApprovalsForUser(userId: string) {
  return useQuery({
    queryKey: travelKeys.approvals(userId),
    queryFn: () => travelService.getRequiringApproval(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Get travel statistics
export function useTravelStats() {
  return useQuery({
    queryKey: travelKeys.stats(),
    queryFn: () => travelService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create travel request
export function useCreateTravelRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<TravelRequestInsert, 'request_number'>) => 
      travelService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      if (result.employee_id) {
        logAction({
          employee_id: result.employee_id,
          action: 'Travel Request Created',
          details: `Travel request created to ${result.destination || 'unknown destination'}`,
        })
      }
      toast.success('Travel request created successfully')
    },
    onError: (error) => {
      console.error('Error creating travel request:', error)
      toast.error('Failed to create travel request')
    },
  })
}

// Update travel request
export function useUpdateTravelRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TravelRequestUpdate }) =>
      travelService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      queryClient.setQueryData(travelKeys.detail(data.id), data)
      toast.success('Travel request updated successfully')
    },
    onError: (error) => {
      console.error('Error updating travel request:', error)
      toast.error('Failed to update travel request')
    },
  })
}

// Submit travel request
export function useSubmitTravelRequest() {
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
    }) => travelService.submit(id, employeeId, employeeName, department),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      logAction({
        employee_id: variables.employeeId,
        action: 'Travel Request Submitted',
        details: `Travel request submitted for approval by ${variables.employeeName}`,
      })
      toast.success('Travel request submitted for approval')
    },
    onError: (error) => {
      console.error('Error submitting travel request:', error)
      toast.error('Failed to submit travel request')
    },
  })
}

// Approve travel request
export function useApproveTravelRequest() {
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
    }) => travelService.approve(id, approverId, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      if (variables.approverId) {
        logAction({
          employee_id: variables.approverId,
          action: 'Travel Request Approved',
          details: `Travel request approved`,
        })
      }
      toast.success('Travel request approved')
    },
    onError: (error) => {
      console.error('Error approving travel request:', error)
      toast.error('Failed to approve travel request')
    },
  })
}

// Reject travel request
export function useRejectTravelRequest() {
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
    }) => travelService.reject(id, approverId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      if (variables.approverId) {
        logAction({
          employee_id: variables.approverId,
          action: 'Travel Request Rejected',
          details: `Travel request rejected: ${variables.reason}`,
        })
      }
      toast.success('Travel request rejected')
    },
    onError: (error) => {
      console.error('Error rejecting travel request:', error)
      toast.error('Failed to reject travel request')
    },
  })
}

// Cancel travel request
export function useCancelTravelRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => travelService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      toast.success('Travel request cancelled')
    },
    onError: (error) => {
      console.error('Error cancelling travel request:', error)
      toast.error('Failed to cancel travel request')
    },
  })
}

// Delete travel request
export function useDeleteTravelRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => travelService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: travelKeys.all })
      toast.success('Travel request deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting travel request:', error)
      toast.error('Failed to delete travel request')
    },
  })
}