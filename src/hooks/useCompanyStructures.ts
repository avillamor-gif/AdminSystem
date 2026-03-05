import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { companyStructureService, type CompanyStructureWithRelations, type CompanyStructureFilters } from '@/services/companyStructure.service'
import type { Database } from '@/lib/supabase/database.types'
import { toast } from 'sonner'

type CompanyStructure = Database['public']['Tables']['company_structures']['Row']
type CompanyStructureInsert = Database['public']['Tables']['company_structures']['Insert']
type CompanyStructureUpdate = Database['public']['Tables']['company_structures']['Update']

export const companyStructureKeys = {
  all: ['company_structures'] as const,
  lists: () => [...companyStructureKeys.all, 'list'] as const,
  list: (filters: CompanyStructureFilters) => [...companyStructureKeys.lists(), filters] as const,
  hierarchy: () => [...companyStructureKeys.all, 'hierarchy'] as const,
  topLevel: () => [...companyStructureKeys.all, 'top-level'] as const,
  children: (parentId: string) => [...companyStructureKeys.all, 'children', parentId] as const,
  details: () => [...companyStructureKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyStructureKeys.details(), id] as const,
  metrics: () => [...companyStructureKeys.all, 'metrics'] as const,
}

export function useCompanyStructures(filters?: CompanyStructureFilters) {
  return useQuery({
    queryKey: companyStructureKeys.list(filters || {}),
    queryFn: () => companyStructureService.getAll(filters),
  })
}

export function useCompanyStructure(id: string): UseQueryResult<CompanyStructureWithRelations | null> {
  return useQuery({
    queryKey: companyStructureKeys.detail(id),
    queryFn: () => companyStructureService.getById(id),
    enabled: !!id,
  })
}

export function useCompanyStructureHierarchy() {
  return useQuery({
    queryKey: companyStructureKeys.hierarchy(),
    queryFn: () => companyStructureService.getHierarchy(),
  })
}

export function useCompanyStructureChildren(parentId: string) {
  return useQuery({
    queryKey: companyStructureKeys.children(parentId),
    queryFn: () => companyStructureService.getChildren(parentId),
    enabled: !!parentId,
  })
}

export function useCompanyStructureTopLevel() {
  return useQuery({
    queryKey: companyStructureKeys.topLevel(),
    queryFn: () => companyStructureService.getTopLevel(),
  })
}

export function useCompanyStructureMetrics() {
  return useQuery({
    queryKey: companyStructureKeys.metrics(),
    queryFn: () => companyStructureService.getMetrics(),
  })
}

export function useCreateCompanyStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompanyStructureInsert) => companyStructureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyStructureKeys.all })
      toast.success('Company structure created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating company structure:', error)
      toast.error('Failed to create company structure')
    },
  })
}

export function useUpdateCompanyStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyStructureUpdate }) =>
      companyStructureService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyStructureKeys.all })
      queryClient.invalidateQueries({ queryKey: companyStructureKeys.detail(variables.id) })
      toast.success('Company structure updated successfully')
    },
    onError: (error: Error) => {
      console.error('Error updating company structure:', error)
      toast.error('Failed to update company structure')
    },
  })
}

export function useDeleteCompanyStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => companyStructureService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyStructureKeys.all })
      toast.success('Company structure deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Error deleting company structure:', error)
      toast.error('Failed to delete company structure')
    },
  })
}
