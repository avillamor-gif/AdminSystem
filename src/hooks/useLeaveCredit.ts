import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  leaveCreditService,
  type LeaveCreditRequestInsert,
} from '@/services/leaveCredit.service'
import {
  notifySupervisorsAndAdmins,
  notifyRequesterOfDecision,
} from '@/services/requestNotification.helper'

export const leaveCreditKeys = {
  all: ['leave_credit_requests'] as const,
  lists: () => [...leaveCreditKeys.all, 'list'] as const,
  list: () => [...leaveCreditKeys.lists()] as const,
  byEmployee: (id: string) => [...leaveCreditKeys.all, 'employee', id] as const,
}

export function useLeaveCreditRequests() {
  return useQuery({
    queryKey: leaveCreditKeys.list(),
    queryFn: () => leaveCreditService.getAll(),
  })
}

export function useMyLeaveCreditRequests(employee_id: string) {
  return useQuery({
    queryKey: leaveCreditKeys.byEmployee(employee_id),
    queryFn: () => leaveCreditService.getByEmployee(employee_id),
    enabled: !!employee_id,
  })
}

export function useCreateLeaveCreditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payload,
      employeeName,
    }: {
      payload: LeaveCreditRequestInsert
      employeeName: string
    }) => {
      const created = await leaveCreditService.create(payload)
      const creditTypeLabels: Record<string, string> = {
        travel: 'Business Travel',
        weekend_work: 'Weekend Work',
        holiday_work: 'Holiday Work',
        other: 'Other',
      }
      const label = creditTypeLabels[payload.credit_type] ?? payload.credit_type
      await notifySupervisorsAndAdmins(
        'leave_credit_notifications' as any,
        payload.employee_id,
        created.id,
        'New Leave Credit Request',
        `${employeeName} has submitted a leave credit request for ${payload.days_requested} day(s) — ${label} (${payload.work_date_from} to ${payload.work_date_to}).`,
        employeeName,
        undefined,
        'admin_dept_and_ed'
      )
      return created
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.byEmployee(vars.payload.employee_id) })
      toast.success('Leave credit request submitted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit request')
    },
  })
}

export function useApproveLeaveCreditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      days_approved,
      reviewed_by,
      reviewer_notes,
    }: {
      id: string
      days_approved: number
      reviewed_by: string
      reviewer_notes?: string
    }) => {
      return leaveCreditService.approve(id, days_approved, reviewed_by, reviewer_notes)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.byEmployee(data.employee_id) })
      // Notify the employee
      notifyRequesterOfDecision(
        'leave_credit_notifications' as any,
        'leave_credit_requests',
        data.id,
        'approved',
        'Leave Credit Request Approved',
        `Your leave credit request for ${data.days_approved} day(s) has been approved and credited to your leave balance.`
      )
      toast.success('Request approved — leave balance updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request')
    },
  })
}

export function useRejectLeaveCreditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      reviewed_by,
      reviewer_notes,
    }: {
      id: string
      reviewed_by: string
      reviewer_notes: string
    }) => {
      return leaveCreditService.reject(id, reviewed_by, reviewer_notes)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.byEmployee(data.employee_id) })
      notifyRequesterOfDecision(
        'leave_credit_notifications' as any,
        'leave_credit_requests',
        data.id,
        'rejected',
        'Leave Credit Request Rejected',
        `Your leave credit request has been rejected. ${data.reviewer_notes ? 'Reason: ' + data.reviewer_notes : ''}`
      )
      toast.success('Request rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request')
    },
  })
}

export function useDeleteLeaveCreditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leaveCreditService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveCreditKeys.lists() })
      toast.success('Request deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete request')
    },
  })
}
