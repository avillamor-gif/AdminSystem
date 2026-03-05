import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/auditLog.service'

export const auditLogKeys = {
  all: ['audit_logs'] as const,
  recent: (limit?: number) => [...auditLogKeys.all, 'recent', limit] as const,
  byEmployee: (employeeId: string) => [...auditLogKeys.all, 'employee', employeeId] as const,
}

/**
 * Hook to fetch recent audit logs
 */
export function useRecentAuditLogs(limit = 10) {
  return useQuery({
    queryKey: auditLogKeys.recent(limit),
    queryFn: () => auditLogService.getRecent(limit),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch audit logs for a specific employee
 */
export function useEmployeeAuditLogs(employeeId: string) {
  return useQuery({
    queryKey: auditLogKeys.byEmployee(employeeId),
    queryFn: () => auditLogService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}
