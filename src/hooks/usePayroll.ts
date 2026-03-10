import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  payrollService,
  type PayrollRun,
  type PayrollRunInsert,
  type PayrollRunStatus,
} from '@/services/payroll.service'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const payrollKeys = {
  all:      ['payroll'] as const,
  runs:     () => [...payrollKeys.all, 'runs']             as const,
  run:      (id: string) => [...payrollKeys.runs(), id]    as const,
  payslips: (runId: string) => [...payrollKeys.all, 'payslips', runId] as const,
  mySlips:  (empId: string) => [...payrollKeys.all, 'my-payslips', empId] as const,
}

// ─── Payroll Runs ─────────────────────────────────────────────────────────────

export function usePayrollRuns() {
  return useQuery({
    queryKey: payrollKeys.runs(),
    queryFn:  () => payrollService.getAllRuns(),
    staleTime: 1000 * 30,
  })
}

export function usePayrollRun(id: string) {
  return useQuery({
    queryKey: payrollKeys.run(id),
    queryFn:  () => payrollService.getRunById(id),
    enabled:  !!id,
  })
}

export function useCreatePayrollRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PayrollRunInsert) => payrollService.createRun(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() })
      toast.success('Payroll run created')
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to create payroll run'),
  })
}

export function useUpdatePayrollRunStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, approvedBy }: { id: string; status: PayrollRunStatus; approvedBy?: string }) =>
      payrollService.updateRunStatus(id, status, approvedBy),
    onSuccess: (run) => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() })
      qc.invalidateQueries({ queryKey: payrollKeys.run(run.id) })
      toast.success(`Payroll run marked as ${run.status}`)
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update status'),
  })
}

export function useDeletePayrollRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollService.deleteRun(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.runs() })
      toast.success('Payroll run deleted')
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete payroll run'),
  })
}

// ─── Payslips ─────────────────────────────────────────────────────────────────

export function usePayslipsByRun(runId: string) {
  return useQuery({
    queryKey: payrollKeys.payslips(runId),
    queryFn:  () => payrollService.getPayslipsByRun(runId),
    enabled:  !!runId,
    staleTime: 1000 * 30,
  })
}

export function useMyPayslips(employeeId: string) {
  return useQuery({
    queryKey: payrollKeys.mySlips(employeeId),
    queryFn:  () => payrollService.getMyPayslips(employeeId),
    enabled:  !!employeeId,
  })
}

export function useGeneratePayslips() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (run: PayrollRun) => payrollService.generatePayslips(run),
    onSuccess: (_, run) => {
      qc.invalidateQueries({ queryKey: payrollKeys.payslips(run.id) })
      qc.invalidateQueries({ queryKey: payrollKeys.runs() })
      toast.success('Payslips generated successfully')
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to generate payslips'),
  })
}

export function useUpdatePayslip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, runId, patch }: { id: string; runId: string; patch: any }) =>
      payrollService.updatePayslip(id, patch),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: payrollKeys.payslips(vars.runId) })
      toast.success('Payslip updated')
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update payslip'),
  })
}
