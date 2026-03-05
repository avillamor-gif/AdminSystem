import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { employmentTypeService, type EmploymentType, type EmploymentTypeInsert, type EmploymentTypeUpdate, type EmploymentTypeFilters } from '@/services/employmentType.service'

export const employmentTypeKeys = {
  all: ['employmentTypes'] as const,
  lists: () => [...employmentTypeKeys.all, 'list'] as const,
  list: (filters: EmploymentTypeFilters) => [...employmentTypeKeys.lists(), filters] as const,
  details: () => [...employmentTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employmentTypeKeys.details(), id] as const,
}

export function useEmploymentTypes(filters?: EmploymentTypeFilters) {
  return useQuery({
    queryKey: employmentTypeKeys.list(filters || {}),
    queryFn: () => employmentTypeService.getAll(filters),
  })
}

export function useEmploymentType(id: string) {
  return useQuery({
    queryKey: employmentTypeKeys.detail(id),
    queryFn: () => employmentTypeService.getById(id),
    enabled: !!id,
  })
}

export function useCreateEmploymentType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: EmploymentTypeInsert) => employmentTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employmentTypeKeys.all })
      toast.success('Employment type created successfully')
    },
    onError: (error) => {
      console.error('Error creating employment type:', error)
      toast.error('Failed to create employment type')
    },
  })
}

export function useUpdateEmploymentType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmploymentTypeUpdate }) => employmentTypeService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employmentTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: employmentTypeKeys.detail(data.id) })
      toast.success('Employment type updated successfully')
    },
    onError: (error) => {
      console.error('Error updating employment type:', error)
      toast.error('Failed to update employment type')
    },
  })
}

export function useDeleteEmploymentType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => employmentTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employmentTypeKeys.all })
      toast.success('Employment type deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting employment type:', error)
      toast.error('Failed to delete employment type')
    },
  })
}