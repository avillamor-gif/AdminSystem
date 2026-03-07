import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { logAction } from '@/services/auditLog.service'
import {
  leaveRequestService,
  leaveApprovalService,
  leaveBalanceService,
  type LeaveRequest,
  type LeaveApproval,
  type LeaveBalance,
} from '@/services/leaveRequest.service'

// Re-export types
export type { LeaveRequest, LeaveApproval, LeaveBalance }

// Query keys
export const leaveRequestKeys = {
  all: ['leaveRequests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  list: (filters: any) => [...leaveRequestKeys.lists(), filters] as const,
  details: () => [...leaveRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaveRequestKeys.details(), id] as const,
  pendingApprovals: (employeeId: string) => [...leaveRequestKeys.all, 'pendingApprovals', employeeId] as const,
  balances: (employeeId: string, year?: number) => ['leaveBalances', employeeId, year] as const,
}

// =============================================
// LEAVE REQUEST HOOKS
// =============================================
export function useLeaveRequests(filters?: Parameters<typeof leaveRequestService.getAll>[0]) {
  return useQuery({
    queryKey: leaveRequestKeys.list(filters || {}),
    queryFn: () => leaveRequestService.getAll(filters),
    enabled: filters?.employee_id !== undefined ? !!filters.employee_id : true,
  })
}

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: leaveRequestKeys.detail(id),
    queryFn: () => leaveRequestService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof leaveRequestService.create>[0]) =>
      leaveRequestService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id: result.employee_id,
        action: 'Leave Request Submitted',
        details: `Submitted a leave request (status: pending)`,
      })
      toast.success('Leave request submitted successfully')
    },
    onError: (error: any) => {
      console.error('Create leave request error:', error)
      toast.error(`Failed to submit leave request: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveRequest> }) =>
      leaveRequestService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.details() })
      toast.success('Leave request updated successfully')
    },
    onError: (error: any) => {
      console.error('Update leave request error:', error)
      toast.error(`Failed to update leave request: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cancelled_by }: { id: string; cancelled_by: string }) =>
      leaveRequestService.cancel(id, cancelled_by),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.details() })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id: result.employee_id,
        action: 'Leave Request Cancelled',
        details: `Leave request cancelled`,
      })
      toast.success('Leave request cancelled')
    },
    onError: (error: any) => {
      console.error('Cancel leave request error:', error)
      toast.error(`Failed to cancel leave request: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leaveRequestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() })
      toast.success('Leave request deleted successfully')
    },
    onError: (error: any) => {
      console.error('Delete leave request error:', error)
      toast.error(`Failed to delete leave request: ${error.message || 'Unknown error'}`)
    },
  })
}

export function usePendingApprovals(employee_id: string) {
  return useQuery({
    queryKey: leaveRequestKeys.pendingApprovals(employee_id),
    queryFn: () => leaveRequestService.getPendingApprovals(employee_id),
    enabled: !!employee_id,
  })
}

export function useTeamPendingRequests(manager_employee_id: string) {
  return useQuery({
    queryKey: [...leaveRequestKeys.all, 'teamPending', manager_employee_id],
    queryFn: () => leaveRequestService.getTeamPendingRequests(manager_employee_id),
    enabled: !!manager_employee_id,
  })
}

// =============================================
// LEAVE APPROVAL HOOKS
// =============================================
export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ approval_id, comments }: { approval_id: string; comments?: string }) =>
      leaveApprovalService.approve(approval_id, comments),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      const employeeId = result?.leave_request?.employee_id ?? result?.employee_id
      if (employeeId) {
        logAction({
          employee_id: employeeId,
          action: 'Leave Request Approved',
          details: `Leave request approved`,
        })
      }
      toast.success('Leave request approved')
    },
    onError: (error: any) => {
      console.error('Approve leave request error:', error)
      toast.error(`Failed to approve: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ approval_id, comments }: { approval_id: string; comments: string }) =>
      leaveApprovalService.reject(approval_id, comments),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      const employeeId = result?.leave_request?.employee_id ?? result?.employee_id
      if (employeeId) {
        logAction({
          employee_id: employeeId,
          action: 'Leave Request Rejected',
          details: `Leave request rejected`,
        })
      }
      toast.success('Leave request rejected')
    },
    onError: (error: any) => {
      console.error('Reject leave request error:', error)
      toast.error(`Failed to reject: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useApproveDirectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leave_request_id, comments }: { leave_request_id: string; comments?: string }) =>
      leaveRequestService.approveRequest(leave_request_id, comments),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id: result.employee_id,
        action: 'Leave Request Approved',
        details: `Leave request approved directly`,
      })
      toast.success('Leave request approved')
    },
    onError: (error: any) => {
      console.error('Approve leave request error:', error)
      toast.error(`Failed to approve: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useRejectDirectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leave_request_id, comments }: { leave_request_id: string; comments: string }) =>
      leaveRequestService.rejectRequest(leave_request_id, comments),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id: result.employee_id,
        action: 'Leave Request Rejected',
        details: `Leave request rejected directly`,
      })
      toast.success('Leave request rejected')
    },
    onError: (error: any) => {
      console.error('Reject leave request error:', error)
      toast.error(`Failed to reject: ${error.message || 'Unknown error'}`)
    },
  })
}

// =============================================
// LEAVE BALANCE HOOKS
// =============================================
export function useAllLeaveBalances(year?: number) {
  return useQuery({
    queryKey: ['leaveBalances', 'all', year],
    queryFn: () => leaveBalanceService.getAll(year),
  })
}

export function useLeaveBalances(employee_id: string, year?: number) {
  return useQuery({
    queryKey: leaveRequestKeys.balances(employee_id, year),
    queryFn: () => leaveBalanceService.getByEmployee(employee_id, year),
    enabled: !!employee_id,
  })
}

export function useAllocateLeaveBalance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employee_id,
      leave_type_id,
      year,
      days,
    }: {
      employee_id: string
      leave_type_id: string
      year: number
      days: number
    }) => leaveBalanceService.allocate(employee_id, leave_type_id, year, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      toast.success('Leave balance updated successfully')
    },
    onError: (error: any) => {
      console.error('Allocate leave balance error:', error)
      toast.error(`Failed to update balance: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useBulkInitializeLeaveBalances() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ year, defaultDays }: { year: number; defaultDays: Record<string, number> }) =>
      leaveBalanceService.bulkInitialize(year, defaultDays),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      if (count === 0) {
        toast.success('All employees already have balances for this year')
      } else {
        toast.success(`Initialized ${count} leave balance records`)
      }
    },
    onError: (error: any) => {
      console.error('Bulk initialize error:', error)
      toast.error(`Failed to initialize balances: ${error.message || 'Unknown error'}`)
    },
  })
}
