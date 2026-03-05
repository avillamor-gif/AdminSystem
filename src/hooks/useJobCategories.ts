import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { jobCategoryService, type JobCategory, type JobCategoryInsert, type JobCategoryUpdate, type JobCategoryFilters } from '@/services/jobCategory.service'

export const jobCategoryKeys = {
  all: ['jobCategories'] as const,
  lists: () => [...jobCategoryKeys.all, 'list'] as const,
  list: (filters: JobCategoryFilters) => [...jobCategoryKeys.lists(), filters] as const,
  details: () => [...jobCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobCategoryKeys.details(), id] as const,
}

export function useJobCategories(filters?: JobCategoryFilters) {
  return useQuery({
    queryKey: jobCategoryKeys.list(filters || {}),
    queryFn: () => jobCategoryService.getAll(filters),
  })
}

export function useJobCategory(id: string) {
  return useQuery({
    queryKey: jobCategoryKeys.detail(id),
    queryFn: () => jobCategoryService.getById(id),
    enabled: !!id,
  })
}

export function useCreateJobCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobCategoryInsert) => jobCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCategoryKeys.all })
      toast.success('Job category created successfully')
    },
    onError: (error) => {
      console.error('Error creating job category:', error)
      toast.error('Failed to create job category')
    },
  })
}

export function useUpdateJobCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobCategoryUpdate }) => jobCategoryService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobCategoryKeys.all })
      queryClient.invalidateQueries({ queryKey: jobCategoryKeys.detail(data.id) })
      toast.success('Job category updated successfully')
    },
    onError: (error) => {
      console.error('Error updating job category:', error)
      toast.error('Failed to update job category')
    },
  })
}

export function useDeleteJobCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => jobCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCategoryKeys.all })
      toast.success('Job category deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting job category:', error)
      toast.error('Failed to delete job category')
    },
  })
}