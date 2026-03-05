import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salaryStructureService, type SalaryStructureFilters, type SalaryStructureInsert, type SalaryStructureUpdate } from '@/services/salaryStructure.service'
import toast from 'react-hot-toast'

export const salaryStructureKeys = {
  all: ['salary-structures'] as const,
  lists: () => [...salaryStructureKeys.all, 'list'] as const,
  list: (filters: SalaryStructureFilters) => [...salaryStructureKeys.lists(), filters] as const,
  details: () => [...salaryStructureKeys.all, 'detail'] as const,
  detail: (id: string) => [...salaryStructureKeys.details(), id] as const,
}

export function useSalaryStructures(filters?: SalaryStructureFilters) {
  return useQuery({
    queryKey: salaryStructureKeys.list(filters || {}),
    queryFn: () => salaryStructureService.getAll(filters),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useSalaryStructure(id: string) {
  return useQuery({
    queryKey: salaryStructureKeys.detail(id),
    queryFn: () => salaryStructureService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SalaryStructureInsert) => salaryStructureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() })
      toast.success('Salary structure created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create salary structure')
    },
  })
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalaryStructureUpdate }) =>
      salaryStructureService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.all })
      toast.success('Salary structure updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update salary structure')
    },
  })
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salaryStructureService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() })
      toast.success('Salary structure deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete salary structure')
    },
  })
}
