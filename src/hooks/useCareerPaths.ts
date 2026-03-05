import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { careerPathService, type CareerPathFilters, type CareerPathInsert, type CareerPathUpdate } from '@/services/careerPath.service'
import toast from 'react-hot-toast'

export const careerPathKeys = {
  all: ['career-paths'] as const,
  lists: () => [...careerPathKeys.all, 'list'] as const,
  list: (filters: CareerPathFilters) => [...careerPathKeys.lists(), filters] as const,
  details: () => [...careerPathKeys.all, 'detail'] as const,
  detail: (id: string) => [...careerPathKeys.details(), id] as const,
}

export function useCareerPaths(filters?: CareerPathFilters) {
  return useQuery({
    queryKey: careerPathKeys.list(filters || {}),
    queryFn: () => careerPathService.getAll(filters),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useCareerPath(id: string) {
  return useQuery({
    queryKey: careerPathKeys.detail(id),
    queryFn: () => careerPathService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCareerPath() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CareerPathInsert) => careerPathService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careerPathKeys.lists() })
      toast.success('Career path created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create career path')
    },
  })
}

export function useUpdateCareerPath() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CareerPathUpdate }) =>
      careerPathService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careerPathKeys.all })
      toast.success('Career path updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update career path')
    },
  })
}

export function useDeleteCareerPath() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => careerPathService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careerPathKeys.lists() })
      toast.success('Career path deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete career path')
    },
  })
}
