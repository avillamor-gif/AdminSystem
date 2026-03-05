import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { orgService } from '@/services/org.service'
import type { OrgNode, DepartmentNode, OrgFilters } from '@/services/org.service'

// Query Keys
export const orgKeys = {
  all: ['org'] as const,
  chart: () => [...orgKeys.all, 'chart'] as const,
  departments: () => [...orgKeys.all, 'departments'] as const,
}

// Queries
export function useOrgChartLegacy() {
  return useQuery({
    queryKey: orgKeys.chart(),
    queryFn: () => orgService.getOrgChart(),
    staleTime: 10 * 60 * 1000, // 10 minutes - org data doesn't change frequently
  })
}

export function useDepartmentHierarchy() {
  return useQuery({
    queryKey: orgKeys.departments(),
    queryFn: () => orgService.getDepartmentHierarchy(),
    staleTime: 10 * 60 * 1000,
  })
}

// Mutations
export function useUpdateEmployeeManager() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ employeeId, managerId }: { employeeId: string; managerId: string | null }) =>
      orgService.updateEmployeeManager(employeeId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all })
      toast.success('Employee manager updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update employee manager error:', error)
      toast.error(error.message || 'Failed to update employee manager')
    },
  })
}

export function useUpdateDepartmentParent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ departmentId, parentId }: { departmentId: string; parentId: string | null }) =>
      orgService.updateDepartmentParent(departmentId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all })
      toast.success('Department hierarchy updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update department parent error:', error)
      toast.error(error.message || 'Failed to update department hierarchy')
    },
  })
}