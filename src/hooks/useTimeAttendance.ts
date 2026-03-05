import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  workScheduleService, 
  shiftPatternService,
  overtimeRuleService,
  breakPolicyService,
  timeTrackingMethodService,
  attendancePolicyService,
  type WorkSchedule,
  type ShiftPattern,
  type OvertimeRule,
  type BreakPolicy,
  type TimeTrackingMethod,
  type AttendancePolicy
} from '@/services/timeAttendance.service'
import { toast } from 'sonner'

// =====================================================
// WORK SCHEDULES HOOKS
// =====================================================

export function useWorkSchedules() {
  return useQuery({
    queryKey: ['work-schedules'],
    queryFn: () => workScheduleService.getAll()
  })
}

export function useWorkSchedule(id: string | undefined) {
  return useQuery({
    queryKey: ['work-schedules', id],
    queryFn: () => id ? workScheduleService.getById(id) : null,
    enabled: !!id
  })
}

export function useWorkScheduleDays(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ['work-schedule-days', scheduleId],
    queryFn: () => scheduleId ? workScheduleService.getDays(scheduleId) : [],
    enabled: !!scheduleId
  })
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<WorkSchedule>) => workScheduleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      toast.success('Work schedule created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create work schedule')
    }
  })
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkSchedule> }) => 
      workScheduleService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      toast.success('Work schedule updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update work schedule')
    }
  })
}

export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => workScheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      toast.success('Work schedule deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete work schedule')
    }
  })
}

export function useSetDefaultWorkSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => workScheduleService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] })
      toast.success('Default work schedule updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default work schedule')
    }
  })
}

export function useEmployeeSchedules(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee-schedules', employeeId],
    queryFn: () => employeeId ? workScheduleService.getEmployeeSchedules(employeeId) : [],
    enabled: !!employeeId
  })
}

export function useAssignScheduleToEmployee() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { employee_id: string; schedule_id: string; effective_from: string }) => 
      workScheduleService.assignToEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] })
      toast.success('Schedule assigned to employee')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign schedule')
    }
  })
}

// =====================================================
// SHIFT PATTERNS HOOKS
// =====================================================

export function useShiftPatterns() {
  return useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => shiftPatternService.getAll()
  })
}

export function useShiftPattern(id: string | undefined) {
  return useQuery({
    queryKey: ['shift-patterns', id],
    queryFn: () => id ? shiftPatternService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateShiftPattern() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ShiftPattern>) => shiftPatternService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] })
      toast.success('Shift pattern created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create shift pattern')
    }
  })
}

export function useUpdateShiftPattern() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ShiftPattern> }) => 
      shiftPatternService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] })
      toast.success('Shift pattern updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update shift pattern')
    }
  })
}

export function useDeleteShiftPattern() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => shiftPatternService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] })
      toast.success('Shift pattern deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete shift pattern')
    }
  })
}

// =====================================================
// OVERTIME RULES HOOKS
// =====================================================

export function useOvertimeRules() {
  return useQuery({
    queryKey: ['overtime-rules'],
    queryFn: () => overtimeRuleService.getAll()
  })
}

export function useOvertimeRule(id: string | undefined) {
  return useQuery({
    queryKey: ['overtime-rules', id],
    queryFn: () => id ? overtimeRuleService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateOvertimeRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<OvertimeRule>) => overtimeRuleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] })
      toast.success('Overtime rule created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create overtime rule')
    }
  })
}

export function useUpdateOvertimeRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<OvertimeRule> }) => 
      overtimeRuleService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] })
      toast.success('Overtime rule updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update overtime rule')
    }
  })
}

export function useDeleteOvertimeRule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => overtimeRuleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] })
      toast.success('Overtime rule deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete overtime rule')
    }
  })
}

// =====================================================
// BREAK POLICIES HOOKS
// =====================================================

export function useBreakPolicies() {
  return useQuery({
    queryKey: ['break-policies'],
    queryFn: () => breakPolicyService.getAll()
  })
}

export function useBreakPolicy(id: string | undefined) {
  return useQuery({
    queryKey: ['break-policies', id],
    queryFn: () => id ? breakPolicyService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateBreakPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<BreakPolicy>) => breakPolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-policies'] })
      toast.success('Break policy created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create break policy')
    }
  })
}

export function useUpdateBreakPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BreakPolicy> }) => 
      breakPolicyService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-policies'] })
      toast.success('Break policy updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update break policy')
    }
  })
}

export function useDeleteBreakPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => breakPolicyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-policies'] })
      toast.success('Break policy deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete break policy')
    }
  })
}

// =====================================================
// TIME TRACKING METHODS HOOKS
// =====================================================

export function useTimeTrackingMethods() {
  return useQuery({
    queryKey: ['time-tracking-methods'],
    queryFn: () => timeTrackingMethodService.getAll()
  })
}

export function useTimeTrackingMethod(id: string | undefined) {
  return useQuery({
    queryKey: ['time-tracking-methods', id],
    queryFn: () => id ? timeTrackingMethodService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateTimeTrackingMethod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<TimeTrackingMethod>) => timeTrackingMethodService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking-methods'] })
      toast.success('Time tracking method created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create time tracking method')
    }
  })
}

export function useUpdateTimeTrackingMethod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeTrackingMethod> }) => 
      timeTrackingMethodService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking-methods'] })
      toast.success('Time tracking method updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update time tracking method')
    }
  })
}

export function useDeleteTimeTrackingMethod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => timeTrackingMethodService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking-methods'] })
      toast.success('Time tracking method deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete time tracking method')
    }
  })
}

export function useSetDefaultTimeTrackingMethod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => timeTrackingMethodService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking-methods'] })
      toast.success('Default time tracking method set successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default time tracking method')
    }
  })
}

// =====================================================
// ATTENDANCE POLICIES HOOKS
// =====================================================

export function useAttendancePolicies() {
  return useQuery({
    queryKey: ['attendance-policies'],
    queryFn: () => attendancePolicyService.getAll()
  })
}

export function useAttendancePolicy(id: string | undefined) {
  return useQuery({
    queryKey: ['attendance-policies', id],
    queryFn: () => id ? attendancePolicyService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAttendancePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AttendancePolicy>) => attendancePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Attendance policy created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create attendance policy')
    }
  })
}

export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AttendancePolicy> }) => 
      attendancePolicyService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Attendance policy updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update attendance policy')
    }
  })
}

export function useDeleteAttendancePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => attendancePolicyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Attendance policy deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete attendance policy')
    }
  })
}

export function useSetDefaultAttendancePolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => attendancePolicyService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Default attendance policy set successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default attendance policy')
    }
  })
}

export function useAssignPolicyToEmployee() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { employee_id: string; policy_id: string; effective_from: string }) => 
      attendancePolicyService.assignToEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Policy assigned to employee')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign policy')
    }
  })
}
