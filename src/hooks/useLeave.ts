import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveService, type LeaveRequestInsert, type LeaveTypeInsert, type LeaveTypeUpdate } from '@/services'
import type { WorkStatusEntry } from '@/services/leave.service'
import toast from 'react-hot-toast'

export type { WorkStatusEntry }

export const leaveKeys = {
  all: ['leave'] as const,
  requests: () => [...leaveKeys.all, 'requests'] as const,
  requestsByEmployee: (id: string) => [...leaveKeys.requests(), id] as const,
  types: () => [...leaveKeys.all, 'types'] as const,
  onLeaveToday: () => [...leaveKeys.all, 'on_leave_today'] as const,
  workStatusToday: () => [...leaveKeys.all, 'work_status_today'] as const,
}

export function useLeaveRequests(employeeId?: string) {
  return useQuery({
    queryKey: employeeId ? leaveKeys.requestsByEmployee(employeeId) : leaveKeys.requests(),
    queryFn: () => leaveService.getRequests(employeeId),
  })
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types(),
    queryFn: () => leaveService.getLeaveTypes(),
  })
}

export function useEmployeesOnLeaveToday() {
  return useQuery({
    queryKey: leaveKeys.onLeaveToday(),
    queryFn: () => leaveService.getEmployeesOnLeaveToday(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEmployeesWorkStatusToday() {
  return useQuery({
    queryKey: leaveKeys.workStatusToday(),
    queryFn: () => leaveService.getEmployeesWorkStatusToday(),
    staleTime: 5 * 60 * 1000,
  })
}
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ request, employee }: { request: LeaveRequestInsert; employee?: any }) => 
      leaveService.createRequest(request, employee),
    onSuccess: () => {
      // Invalidate all leave request queries (both filtered and unfiltered)
      queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success('Leave request submitted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit leave request')
    },
  })
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      approverId,
    }: {
      id: string
      status: 'approved' | 'rejected'
      approverId: string
    }) => leaveService.updateRequestStatus(id, status, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() })
      toast.success('Leave request updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update leave request')
    },
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LeaveTypeInsert) => leaveService.createLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.types() })
      toast.success('Leave type created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create leave type')
    },
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveTypeUpdate }) => 
      leaveService.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.types() })
      toast.success('Leave type updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update leave type')
    },
  })
}

export function useWithdrawLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) => 
      leaveService.withdrawRequest(id, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all })
      toast.success('Leave request withdrawn')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw leave request')
    },
  })
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.types() })
      toast.success('Leave type deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete leave type')
    },
  })
}
