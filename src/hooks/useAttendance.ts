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

/** Admin: save (create or update) an attendance record and refresh all related caches */
export function useUpsertAttendanceRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof attendanceService.upsertRecord>[0]) =>
      attendanceService.upsertRecord(payload),
    onSuccess: (result) => {
      // Invalidate all attendance queries so every calendar/report view refreshes
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      // Also invalidate leave balances in case the edit affects leave count tracking
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id: result.employee_id,
        action: 'Attendance Record Edited',
        details: `Admin updated attendance for ${result.date}`,
      })
      toast.success('Attendance record saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save attendance record')
    },
  })
}

/** Admin: delete an attendance record and refresh all related caches */
export function useDeleteAttendanceRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employee_id, date }: { id: string; employee_id: string; date: string }) =>
      attendanceService.deleteRecord(id).then(() => ({ employee_id, date })),
    onSuccess: ({ employee_id, date }) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] })
      logAction({
        employee_id,
        action: 'Attendance Record Deleted',
        details: `Admin deleted attendance record for ${date}`,
      })
      toast.success('Attendance record deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete attendance record')
    },
  })
}
