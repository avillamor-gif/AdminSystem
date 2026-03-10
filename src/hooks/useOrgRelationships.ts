import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { orgRelationshipService, type OrgRelationshipWithRelations, type OrgRelationshipFilters, type OrgChartNode, type OrgRelationship, type OrgRelationshipInsert, type OrgRelationshipUpdate } from '@/services/orgRelationship.service'
import { toast } from 'sonner'

export const orgRelationshipKeys = {
  all: ['org_relationships'] as const,
  lists: () => [...orgRelationshipKeys.all, 'list'] as const,
  list: (filters: OrgRelationshipFilters) => [...orgRelationshipKeys.lists(), filters] as const,
  directReports: (employeeId: string) => [...orgRelationshipKeys.all, 'direct-reports', employeeId] as const,
  manager: (employeeId: string) => [...orgRelationshipKeys.all, 'manager', employeeId] as const,
  orgChart: (rootId?: string) => [...orgRelationshipKeys.all, 'org-chart', rootId || 'root'] as const,
  details: () => [...orgRelationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...orgRelationshipKeys.details(), id] as const,
  metrics: () => [...orgRelationshipKeys.all, 'metrics'] as const,
}

export function useOrgRelationships(filters?: OrgRelationshipFilters) {
  return useQuery({
    queryKey: orgRelationshipKeys.list(filters || {}),
    queryFn: () => orgRelationshipService.getAll(filters),
  })
}

export function useOrgRelationship(id: string): UseQueryResult<OrgRelationshipWithRelations | null> {
  return useQuery({
    queryKey: orgRelationshipKeys.detail(id),
    queryFn: () => orgRelationshipService.getById(id),
    enabled: !!id,
  })
}

export function useDirectReports(employeeId: string) {
  return useQuery({
    queryKey: orgRelationshipKeys.directReports(employeeId),
    queryFn: () => orgRelationshipService.getDirectReports(employeeId),
    enabled: !!employeeId,
  })
}

export function useManager(employeeId: string) {
  return useQuery({
    queryKey: orgRelationshipKeys.manager(employeeId),
    queryFn: () => orgRelationshipService.getManager(employeeId),
    enabled: !!employeeId,
  })
}

export function useOrgChart(rootEmployeeId?: string): UseQueryResult<OrgChartNode[]> {
  return useQuery({
    queryKey: orgRelationshipKeys.orgChart(rootEmployeeId),
    queryFn: () => orgRelationshipService.buildOrgChart(rootEmployeeId),
  })
}

export function useOrgRelationshipMetrics() {
  return useQuery({
    queryKey: orgRelationshipKeys.metrics(),
    queryFn: () => orgRelationshipService.getMetrics(),
  })
}

export function useCreateOrgRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OrgRelationshipInsert) => orgRelationshipService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgRelationshipKeys.all })
      toast.success('Organizational relationship created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating org relationship:', error)
      toast.error('Failed to create organizational relationship')
    },
  })
}

export function useUpdateOrgRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrgRelationshipUpdate }) =>
      orgRelationshipService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgRelationshipKeys.all })
      queryClient.invalidateQueries({ queryKey: orgRelationshipKeys.detail(variables.id) })
      toast.success('Organizational relationship updated successfully')
    },
    onError: (error: Error) => {
      console.error('Error updating org relationship:', error)
      toast.error('Failed to update organizational relationship')
    },
  })
}

export function useDeleteOrgRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => orgRelationshipService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgRelationshipKeys.all })
      toast.success('Organizational relationship deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Error deleting org relationship:', error)
      toast.error('Failed to delete organizational relationship')
    },
  })
}
