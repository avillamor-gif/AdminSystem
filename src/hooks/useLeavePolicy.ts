import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavePolicyService } from '@/services/leavePolicy.service'
import type {
  LeavePolicyInsert,
  LeavePolicyUpdate,
  LeaveBalanceInsert,
  LeaveBalanceUpdate,
  LeavePolicyFilters,
  LeaveBalanceFilters,
} from '@/services/leavePolicy.service'
import toast from 'react-hot-toast'

export const leavePolicyKeys = {
  all: ['leave-policies'] as const,
  lists: () => [...leavePolicyKeys.all, 'list'] as const,
  list: (filters: LeavePolicyFilters) => [...leavePolicyKeys.lists(), filters] as const,
  details: () => [...leavePolicyKeys.all, 'detail'] as const,
  detail: (id: string) => [...leavePolicyKeys.details(), id] as const,
  balances: () => [...leavePolicyKeys.all, 'balances'] as const,
  balanceList: (filters: LeaveBalanceFilters) => [...leavePolicyKeys.balances(), filters] as const,
  employeeBalance: (employeeId: string, leaveTypeId: string) =>
    [...leavePolicyKeys.balances(), 'employee', employeeId, leaveTypeId] as const,
}

// Leave Policies Hooks
export function useLeavePolicies(filters?: LeavePolicyFilters) {
  return useQuery({
    queryKey: leavePolicyKeys.list(filters || {}),
    queryFn: () => leavePolicyService.getAll(filters),
  })
}

export function useLeavePolicy(id: string) {
  return useQuery({
    queryKey: leavePolicyKeys.detail(id),
    queryFn: () => leavePolicyService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLeavePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LeavePolicyInsert) => leavePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() })
      toast.success('Leave policy created successfully')
    },
    onError: (error: any) => {
      console.error('Create leave policy error:', error)
      toast.error(error.message || 'Failed to create leave policy')
    },
  })
}

export function useUpdateLeavePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeavePolicyUpdate }) =>
      leavePolicyService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.detail(variables.id) })
      toast.success('Leave policy updated successfully')
    },
    onError: (error: any) => {
      console.error('Update leave policy error:', error)
      toast.error(error.message || 'Failed to update leave policy')
    },
  })
}

export function useDeleteLeavePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leavePolicyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() })
      toast.success('Leave policy deleted successfully')
    },
    onError: (error: any) => {
      console.error('Delete leave policy error:', error)
      toast.error(error.message || 'Failed to delete leave policy')
    },
  })
}

// Leave Balances Hooks
export function useLeaveBalances(filters?: LeaveBalanceFilters) {
  return useQuery({
    queryKey: leavePolicyKeys.balanceList(filters || {}),
    queryFn: () => leavePolicyService.getAllBalances(filters),
  })
}

export function useEmployeeBalance(employeeId: string, leaveTypeId: string, periodStart?: string) {
  return useQuery({
    queryKey: leavePolicyKeys.employeeBalance(employeeId, leaveTypeId),
    queryFn: () => leavePolicyService.getEmployeeBalance(employeeId, leaveTypeId, periodStart),
    enabled: !!employeeId && !!leaveTypeId,
  })
}

export function useCreateLeaveBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LeaveBalanceInsert) => leavePolicyService.createBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.balances() })
      toast.success('Leave balance created successfully')
    },
    onError: (error: any) => {
      console.error('Create leave balance error:', error)
      toast.error(error.message || 'Failed to create leave balance')
    },
  })
}

export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveBalanceUpdate }) =>
      leavePolicyService.updateBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.balances() })
      toast.success('Leave balance updated successfully')
    },
    onError: (error: any) => {
      console.error('Update leave balance error:', error)
      toast.error(error.message || 'Failed to update leave balance')
    },
  })
}

export function useDeleteLeaveBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leavePolicyService.deleteBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.balances() })
      toast.success('Leave balance deleted successfully')
    },
    onError: (error: any) => {
      console.error('Delete leave balance error:', error)
      toast.error(error.message || 'Failed to delete leave balance')
    },
  })
}

// Utility Hooks
export function useInitializeEmployeeBalances() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      employeeId,
      policyId,
      periodStart,
      periodEnd,
    }: {
      employeeId: string
      policyId: string
      periodStart: string
      periodEnd: string
    }) => leavePolicyService.initializeEmployeeBalances(employeeId, policyId, periodStart, periodEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.balances() })
      toast.success('Employee balances initialized successfully')
    },
    onError: (error: any) => {
      console.error('Initialize balances error:', error)
      toast.error(error.message || 'Failed to initialize employee balances')
    },
  })
}

export function useApplyPolicyToEmployees() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      policyId,
      employeeIds,
      periodStart,
      periodEnd,
    }: {
      policyId: string
      employeeIds: string[]
      periodStart: string
      periodEnd: string
    }) => leavePolicyService.applyPolicyToEmployees(policyId, employeeIds, periodStart, periodEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.balances() })
      toast.success('Policy applied to employees successfully')
    },
    onError: (error: any) => {
      console.error('Apply policy error:', error)
      toast.error(error.message || 'Failed to apply policy to employees')
    },
  })
}
