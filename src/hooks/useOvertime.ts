import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { overtimeService } from '@/services'
import type { OvertimeFilters, OvertimeRequestInsert } from '@/services'
import toast from 'react-hot-toast'

export const overtimeKeys = {
  all: ['overtime_requests'] as const,
  lists: () => [...overtimeKeys.all, 'list'] as const,
  list: (filters: OvertimeFilters) => [...overtimeKeys.lists(), filters] as const,
  byEmployee: (id: string) => [...overtimeKeys.all, 'employee', id] as const,
}

export function useOvertimeRequests(filters: OvertimeFilters = {}) {
  return useQuery({
    queryKey: overtimeKeys.list(filters),
    queryFn: () => overtimeService.getAll(filters),
  })
}

export function useMyOvertimeRequests(employeeId: string) {
  return useQuery({
    queryKey: overtimeKeys.byEmployee(employeeId),
    queryFn: () => overtimeService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateOvertimeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OvertimeRequestInsert) => overtimeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() })
      toast.success('Request submitted')
    },
    onError: () => toast.error('Failed to submit request'),
  })
}

export function useApproveOvertimeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      overtimeService.approve(id, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() })
      toast.success('Request approved')
    },
    onError: () => toast.error('Failed to approve request'),
  })
}

export function useRejectOvertimeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approverId, reason }: { id: string; approverId: string; reason: string }) =>
      overtimeService.reject(id, approverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() })
      toast.success('Request rejected')
    },
    onError: () => toast.error('Failed to reject request'),
  })
}

export function useCancelOvertimeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => overtimeService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() })
      toast.success('Request cancelled')
    },
    onError: () => toast.error('Failed to cancel request'),
  })
}
