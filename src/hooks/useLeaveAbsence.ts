import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  leaveTypeService,
  accrualRuleService,
  leavePolicyConfigService,
  holidayService,
  absenceCategoryService,
  approvalWorkflowService,
  type LeaveType,
  type AccrualRule,
  type LeavePolicyConfig,
  type Holiday,
  type AbsenceCategory,
  type ApprovalWorkflow,
} from '@/services/leaveAbsence.service'

// Re-export types for pages to use
export type {
  LeaveType,
  AccrualRule,
  LeavePolicyConfig,
  Holiday,
  AbsenceCategory,
  ApprovalWorkflow,
}

// =============================================
// QUERY KEYS
// =============================================
export const leaveAbsenceKeys = {
  all: ['leave-absence'] as const,
  
  leaveTypes: () => [...leaveAbsenceKeys.all, 'leave-types'] as const,
  leaveType: (id: string) => [...leaveAbsenceKeys.leaveTypes(), id] as const,
  
  accrualRules: () => [...leaveAbsenceKeys.all, 'accrual-rules'] as const,
  accrualRule: (id: string) => [...leaveAbsenceKeys.accrualRules(), id] as const,
  
  leavePolicies: () => [...leaveAbsenceKeys.all, 'leave-policies'] as const,
  leavePolicy: (id: string) => [...leaveAbsenceKeys.leavePolicies(), id] as const,
  
  holidays: () => [...leaveAbsenceKeys.all, 'holidays'] as const,
  holiday: (id: string) => [...leaveAbsenceKeys.holidays(), id] as const,
  
  absenceCategories: () => [...leaveAbsenceKeys.all, 'absence-categories'] as const,
  absenceCategory: (id: string) => [...leaveAbsenceKeys.absenceCategories(), id] as const,
  
  approvalWorkflows: () => [...leaveAbsenceKeys.all, 'approval-workflows'] as const,
  approvalWorkflow: (id: string) => [...leaveAbsenceKeys.approvalWorkflows(), id] as const,
}

// =============================================
// LEAVE TYPES HOOKS
// =============================================
export function useLeaveTypes(filters?: { category?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.leaveTypes(), filters || {}],
    queryFn: () => leaveTypeService.getAll(filters),
  })
}

export function useLeaveType(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.leaveType(id),
    queryFn: () => leaveTypeService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>) =>
      leaveTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leaveTypes() })
      toast.success('Leave type created successfully')
    },
    onError: () => {
      toast.error('Failed to create leave type')
    },
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveType> }) =>
      leaveTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leaveTypes() })
      toast.success('Leave type updated successfully')
    },
    onError: () => {
      toast.error('Failed to update leave type')
    },
  })
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leaveTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leaveTypes() })
      toast.success('Leave type deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete leave type')
    },
  })
}

// =============================================
// ACCRUAL RULES HOOKS
// =============================================
export function useAccrualRules(filters?: { leave_type_id?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.accrualRules(), filters || {}],
    queryFn: () => accrualRuleService.getAll(filters),
  })
}

export function useAccrualRule(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.accrualRule(id),
    queryFn: () => accrualRuleService.getById(id),
    enabled: !!id,
  })
}

export function useCreateAccrualRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<AccrualRule, 'id' | 'created_at' | 'updated_at'>) =>
      accrualRuleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.accrualRules() })
      toast.success('Accrual rule created successfully')
    },
    onError: () => {
      toast.error('Failed to create accrual rule')
    },
  })
}

export function useUpdateAccrualRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccrualRule> }) =>
      accrualRuleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.accrualRules() })
      toast.success('Accrual rule updated successfully')
    },
    onError: () => {
      toast.error('Failed to update accrual rule')
    },
  })
}

export function useDeleteAccrualRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accrualRuleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.accrualRules() })
      toast.success('Accrual rule deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete accrual rule')
    },
  })
}

// =============================================
// LEAVE POLICY CONFIGS HOOKS
// =============================================
export function useLeavePolicyConfigs(filters?: { leave_type_id?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.leavePolicies(), filters || {}],
    queryFn: () => leavePolicyConfigService.getAll(filters),
  })
}

export function useLeavePolicyConfig(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.leavePolicy(id),
    queryFn: () => leavePolicyConfigService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLeavePolicyConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<LeavePolicyConfig, 'id' | 'created_at' | 'updated_at'>) =>
      leavePolicyConfigService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leavePolicies() })
      toast.success('Leave policy created successfully')
    },
    onError: () => {
      toast.error('Failed to create leave policy')
    },
  })
}

export function useUpdateLeavePolicyConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeavePolicyConfig> }) =>
      leavePolicyConfigService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leavePolicies() })
      toast.success('Leave policy updated successfully')
    },
    onError: () => {
      toast.error('Failed to update leave policy')
    },
  })
}

export function useDeleteLeavePolicyConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leavePolicyConfigService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leavePolicies() })
      toast.success('Leave policy deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete leave policy')
    },
  })
}

export function useSetDefaultLeavePolicyConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leavePolicyConfigService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.leavePolicies() })
      toast.success('Default policy set successfully')
    },
    onError: () => {
      toast.error('Failed to set default policy')
    },
  })
}

// =============================================
// HOLIDAYS HOOKS
// =============================================
export function useHolidays(filters?: { year?: number; holiday_type?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.holidays(), filters || {}],
    queryFn: () => holidayService.getAll(filters),
  })
}

export function useHoliday(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.holiday(id),
    queryFn: () => holidayService.getById(id),
    enabled: !!id,
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>) =>
      holidayService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.holidays() })
      toast.success('Holiday created successfully')
    },
    onError: (error: any) => {
      console.error('Create holiday error:', error)
      toast.error(`Failed to create holiday: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) =>
      holidayService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.holidays() })
      toast.success('Holiday updated successfully')
    },
    onError: () => {
      toast.error('Failed to update holiday')
    },
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => holidayService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.holidays() })
      toast.success('Holiday deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete holiday')
    },
  })
}

// =============================================
// ABSENCE CATEGORIES HOOKS
// =============================================
export function useAbsenceCategories(filters?: { category_type?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.absenceCategories(), filters || {}],
    queryFn: () => absenceCategoryService.getAll(filters),
  })
}

export function useAbsenceCategory(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.absenceCategory(id),
    queryFn: () => absenceCategoryService.getById(id),
    enabled: !!id,
  })
}

export function useCreateAbsenceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<AbsenceCategory, 'id' | 'created_at' | 'updated_at'>) =>
      absenceCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.absenceCategories() })
      toast.success('Absence category created successfully')
    },
    onError: () => {
      toast.error('Failed to create absence category')
    },
  })
}

export function useUpdateAbsenceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AbsenceCategory> }) =>
      absenceCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.absenceCategories() })
      toast.success('Absence category updated successfully')
    },
    onError: () => {
      toast.error('Failed to update absence category')
    },
  })
}

export function useDeleteAbsenceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => absenceCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.absenceCategories() })
      toast.success('Absence category deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete absence category')
    },
  })
}

// =============================================
// APPROVAL WORKFLOWS HOOKS
// =============================================
export function useApprovalWorkflows(filters?: { leave_type_id?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...leaveAbsenceKeys.approvalWorkflows(), filters || {}],
    queryFn: () => approvalWorkflowService.getAll(filters),
  })
}

export function useApprovalWorkflow(id: string) {
  return useQuery({
    queryKey: leaveAbsenceKeys.approvalWorkflow(id),
    queryFn: () => approvalWorkflowService.getById(id),
    enabled: !!id,
  })
}

export function useCreateApprovalWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'>) =>
      approvalWorkflowService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.approvalWorkflows() })
      toast.success('Approval workflow created successfully')
    },
    onError: () => {
      toast.error('Failed to create approval workflow')
    },
  })
}

export function useUpdateApprovalWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApprovalWorkflow> }) =>
      approvalWorkflowService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.approvalWorkflows() })
      toast.success('Approval workflow updated successfully')
    },
    onError: () => {
      toast.error('Failed to update approval workflow')
    },
  })
}

export function useDeleteApprovalWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvalWorkflowService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.approvalWorkflows() })
      toast.success('Approval workflow deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete approval workflow')
    },
  })
}

export function useSetDefaultApprovalWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvalWorkflowService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveAbsenceKeys.approvalWorkflows() })
      toast.success('Default workflow set successfully')
    },
    onError: () => {
      toast.error('Failed to set default workflow')
    },
  })
}
