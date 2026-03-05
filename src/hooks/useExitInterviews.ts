import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exitInterviewService, ExitInterviewInsert, ExitInterviewUpdate } from '@/services/exitInterview.service'
import { toast } from 'sonner'

export const exitInterviewKeys = {
  all: ['exit-interviews'] as const,
  byTermination: (terminationRequestId: string) => [...exitInterviewKeys.all, 'termination', terminationRequestId] as const,
  byEmployee: (employeeId: string) => [...exitInterviewKeys.all, 'employee', employeeId] as const,
}

/**
 * Hook to fetch exit interview by termination request
 */
export function useExitInterviewByTermination(terminationRequestId: string) {
  return useQuery({
    queryKey: exitInterviewKeys.byTermination(terminationRequestId),
    queryFn: () => exitInterviewService.getByTerminationRequest(terminationRequestId),
    enabled: !!terminationRequestId,
  })
}

/**
 * Hook to fetch exit interviews by employee
 */
export function useExitInterviewsByEmployee(employeeId: string) {
  return useQuery({
    queryKey: exitInterviewKeys.byEmployee(employeeId),
    queryFn: () => exitInterviewService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Hook to create exit interview
 */
export function useCreateExitInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (interview: ExitInterviewInsert) => exitInterviewService.create(interview),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byTermination(data.termination_request_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byEmployee(data.employee_id) 
      })
      toast.success('Exit interview scheduled successfully')
    },
    onError: (error: Error) => {
      console.error('Create exit interview error:', error)
      toast.error('Failed to schedule exit interview')
    },
  })
}

/**
 * Hook to update exit interview
 */
export function useUpdateExitInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates, terminationRequestId, employeeId }: { 
      id: string
      updates: ExitInterviewUpdate
      terminationRequestId: string
      employeeId: string
    }) => exitInterviewService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byTermination(variables.terminationRequestId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byEmployee(variables.employeeId) 
      })
      toast.success('Exit interview updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update exit interview error:', error)
      toast.error('Failed to update exit interview')
    },
  })
}

/**
 * Hook to mark exit interview as completed
 */
export function useCompleteExitInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      completedBy, 
      terminationRequestId, 
      employeeId 
    }: { 
      id: string
      completedBy: string
      terminationRequestId: string
      employeeId: string
    }) => exitInterviewService.markAsCompleted(id, completedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byTermination(variables.terminationRequestId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byEmployee(variables.employeeId) 
      })
      toast.success('Exit interview marked as completed')
    },
    onError: (error: Error) => {
      console.error('Complete exit interview error:', error)
      toast.error('Failed to mark exit interview as completed')
    },
  })
}

/**
 * Hook to cancel exit interview
 */
export function useCancelExitInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      terminationRequestId, 
      employeeId 
    }: { 
      id: string
      terminationRequestId: string
      employeeId: string
    }) => exitInterviewService.cancel(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byTermination(variables.terminationRequestId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byEmployee(variables.employeeId) 
      })
      toast.success('Exit interview cancelled')
    },
    onError: (error: Error) => {
      console.error('Cancel exit interview error:', error)
      toast.error('Failed to cancel exit interview')
    },
  })
}

/**
 * Hook to delete exit interview
 */
export function useDeleteExitInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      terminationRequestId, 
      employeeId 
    }: { 
      id: string
      terminationRequestId: string
      employeeId: string
    }) => exitInterviewService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byTermination(variables.terminationRequestId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: exitInterviewKeys.byEmployee(variables.employeeId) 
      })
      toast.success('Exit interview deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete exit interview error:', error)
      toast.error('Failed to delete exit interview')
    },
  })
}
