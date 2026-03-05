import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { jobDescriptionService, type JobDescriptionWithRelations, type JobDescriptionInsert, type JobDescriptionUpdate, type JobDescriptionFilters } from '@/services/jobDescription.service'

export const jobDescriptionKeys = {
  all: ['jobDescriptions'] as const,
  lists: () => [...jobDescriptionKeys.all, 'list'] as const,
  list: (filters: JobDescriptionFilters) => [...jobDescriptionKeys.lists(), filters] as const,
  details: () => [...jobDescriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobDescriptionKeys.details(), id] as const,
}

export function useJobDescriptions(filters?: JobDescriptionFilters) {
  return useQuery({
    queryKey: jobDescriptionKeys.list(filters || {}),
    queryFn: () => jobDescriptionService.getAll(filters),
  })
}

export function useJobDescription(id: string) {
  return useQuery({
    queryKey: jobDescriptionKeys.detail(id),
    queryFn: () => jobDescriptionService.getById(id),
    enabled: !!id,
  })
}

export function useCreateJobDescription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: JobDescriptionInsert) => jobDescriptionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.all })
      toast.success('Job description created successfully')
    },
    onError: (error) => {
      console.error('Error creating job description:', error)
      toast.error('Failed to create job description')
    },
  })
}

export function useUpdateJobDescription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobDescriptionUpdate }) => jobDescriptionService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.all })
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.detail(data.id) })
      toast.success('Job description updated successfully')
    },
    onError: (error) => {
      console.error('Error updating job description:', error)
      toast.error('Failed to update job description')
    },
  })
}

export function useDeleteJobDescription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => jobDescriptionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.all })
      toast.success('Job description deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting job description:', error)
      toast.error('Failed to delete job description')
    },
  })
}