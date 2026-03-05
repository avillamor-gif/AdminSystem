import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { jobTitleService, type JobTitle, type JobTitleInsert, type JobTitleUpdate, type JobTitleFilters } from '@/services/jobTitle.service'

export const jobTitleKeys = {
  all: ['jobTitles'] as const,
  lists: () => [...jobTitleKeys.all, 'list'] as const,
  list: (filters: JobTitleFilters) => [...jobTitleKeys.lists(), filters] as const,
  details: () => [...jobTitleKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobTitleKeys.details(), id] as const,
}

export function useJobTitles(filters?: JobTitleFilters) {
  return useQuery({
    queryKey: jobTitleKeys.list(filters || {}),
    queryFn: () => jobTitleService.getAll(filters),
  })
}

export function useJobTitle(id: string) {
  return useQuery({
    queryKey: jobTitleKeys.detail(id),
    queryFn: () => jobTitleService.getById(id),
    enabled: !!id,
  })
}

export function useCreateJobTitle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobTitleInsert) => jobTitleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.all })
      toast.success('Job title created successfully')
    },
    onError: (error) => {
      console.error('Error creating job title:', error)
      toast.error('Failed to create job title')
    },
  })
}

export function useUpdateJobTitle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobTitleUpdate }) => jobTitleService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.all })
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.detail(data.id) })
      toast.success('Job title updated successfully')
    },
    onError: (error) => {
      console.error('Error updating job title:', error)
      toast.error('Failed to update job title')
    },
  })
}

export function useDeleteJobTitle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => jobTitleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTitleKeys.all })
      toast.success('Job title deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting job title:', error)
      toast.error('Failed to delete job title')
    },
  })
}