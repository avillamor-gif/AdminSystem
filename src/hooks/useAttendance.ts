import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '@/services'
import { logAction } from '@/services/auditLog.service'
import toast from 'react-hot-toast'

export const attendanceKeys = {
  all: ['attendance'] as const,
  records: (params: { employeeId?: string; date?: string }) => [...attendanceKeys.all, params] as const,
}

export function useAttendanceRecords(params: { employeeId?: string; date?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: attendanceKeys.records(params),
    queryFn: () => attendanceService.getRecords(params),
    enabled: !!params.employeeId || !!params.date, // Only fetch when we have employeeId or date filter
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) => attendanceService.clockIn(employeeId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      logAction({
        employee_id: result.employee_id,
        action: 'Clocked In',
        details: `Employee clocked in at ${new Date().toLocaleTimeString()}`,
      })
      toast.success('Clocked in successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock in')
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recordId: string) => attendanceService.clockOut(recordId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      logAction({
        employee_id: result.employee_id,
        action: 'Clocked Out',
        details: `Employee clocked out at ${new Date().toLocaleTimeString()}`,
      })
      toast.success('Clocked out successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock out')
    },
  })
}
