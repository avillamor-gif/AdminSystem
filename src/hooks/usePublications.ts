import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { publicationService, publicationKeys, PublicationRequestFilters, PublicationRequestInsert, PublicationRequestUpdate } from '@/services/publication.service'
import { toast } from 'react-hot-toast'

// Get all publication requests
export function usePublicationRequests(filters: PublicationRequestFilters = {}) {
  return useQuery({
    queryKey: publicationKeys.list(filters),
    queryFn: () => publicationService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get publication request by ID
export function usePublicationRequest(id: string) {
  return useQuery({
    queryKey: publicationKeys.detail(id),
    queryFn: () => publicationService.getById(id),
    enabled: !!id,
  })
}

// Get publication requests requiring approval
export function usePublicationApprovalsForUser(userId: string) {
  return useQuery({
    queryKey: publicationKeys.approvals(userId),
    queryFn: () => publicationService.getRequiringApproval(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Get publication statistics
export function usePublicationStats() {
  return useQuery({
    queryKey: publicationKeys.stats(),
    queryFn: () => publicationService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get urgent publication requests
export function useUrgentPublications() {
  return useQuery({
    queryKey: publicationKeys.urgent(),
    queryFn: () => publicationService.getUrgentRequests(),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  })
}

// Search publications
export function useSearchPublications(searchTerm: string) {
  return useQuery({
    queryKey: publicationKeys.search(searchTerm),
    queryFn: () => publicationService.search(searchTerm),
    enabled: searchTerm.length > 2,
    staleTime: 30000,
  })
}

// Create publication request
export function useCreatePublicationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<PublicationRequestInsert, 'request_number'>) => 
      publicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
    },
    onError: (error: any) => {
      console.error('Error creating publication request:', error)
      toast.error(error?.message ?? 'Failed to save publication')
    },
  })
}

// Update publication request
export function useUpdatePublicationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PublicationRequestUpdate }) =>
      publicationService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      queryClient.setQueryData(publicationKeys.detail(data.id), data)
    },
    onError: (error: any) => {
      console.error('Error updating publication request:', error)
      toast.error(error?.message ?? 'Failed to update publication')
    },
  })
}

// Submit publication request
export function useSubmitPublicationRequest() {
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
    }) => publicationService.submit(id, employeeId, employeeName, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request submitted for approval')
    },
    onError: (error) => {
      console.error('Error submitting publication request:', error)
      toast.error('Failed to submit publication request')
    },
  })
}

// Approve publication request
export function useApprovePublicationRequest() {
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
    }) => publicationService.approve(id, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request approved')
    },
    onError: (error) => {
      console.error('Error approving publication request:', error)
      toast.error('Failed to approve publication request')
    },
  })
}

// Reject publication request
export function useRejectPublicationRequest() {
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
    }) => publicationService.reject(id, approverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request rejected')
    },
    onError: (error) => {
      console.error('Error rejecting publication request:', error)
      toast.error('Failed to reject publication request')
    },
  })
}

// Mark publication request as fulfilled
export function useFulfillPublicationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      publicationService.fulfill(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request marked as fulfilled')
    },
    onError: (error) => {
      console.error('Error fulfilling publication request:', error)
      toast.error('Failed to fulfill publication request')
    },
  })
}

// Cancel publication request
export function useCancelPublicationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => publicationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request cancelled')
    },
    onError: (error) => {
      console.error('Error cancelling publication request:', error)
      toast.error('Failed to cancel publication request')
    },
  })
}

// Delete publication request
export function useDeletePublicationRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => publicationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationKeys.all })
      toast.success('Publication request deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting publication request:', error)
      toast.error('Failed to delete publication request')
    },
  })
}