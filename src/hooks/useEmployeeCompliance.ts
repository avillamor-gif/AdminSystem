import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeComplianceService } from '@/services/employeeCompliance.service'
import toast from 'react-hot-toast'

export const complianceKeys = {
  all: ['employee_compliance_items'] as const,
  byEmployee: (employeeId: string) => [...complianceKeys.all, 'employee', employeeId] as const,
}

export function useEmployeeCompliance(employeeId: string) {
  return useQuery({
    queryKey: complianceKeys.byEmployee(employeeId),
    queryFn: () => employeeComplianceService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useToggleComplianceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isComplete, employeeId, completedBy }: {
      id: string
      isComplete: boolean
      employeeId: string
      completedBy?: string
    }) => employeeComplianceService.toggle(id, isComplete, completedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.byEmployee(variables.employeeId) })
      toast.success(variables.isComplete ? 'Marked as complete' : 'Marked as incomplete')
    },
    onError: () => {
      toast.error('Failed to update compliance item')
    },
  })
}

export function useCreateDefaultComplianceItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId: string) => employeeComplianceService.createDefaultItems(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.byEmployee(employeeId) })
    },
  })
}
