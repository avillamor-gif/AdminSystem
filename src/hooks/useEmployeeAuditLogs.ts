import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeAuditLogService, type EmployeeAuditLogInsert } from '@/services/employeeAuditLog.service'

export const auditLogKeys = {
  all: ['employee_audit_logs'] as const,
  byEmployee: (employeeId: string) => [...auditLogKeys.all, 'employee', employeeId] as const,
}

export function useEmployeeAuditLogs(employeeId: string) {
  return useQuery({
    queryKey: auditLogKeys.byEmployee(employeeId),
    queryFn: () => employeeAuditLogService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (log: EmployeeAuditLogInsert) => employeeAuditLogService.create(log),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auditLogKeys.byEmployee(variables.employee_id) })
    },
  })
}
