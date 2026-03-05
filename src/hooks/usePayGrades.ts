import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { payGradeService, type PayGrade, type PayGradeInsert, type PayGradeUpdate, type PayGradeFilters } from '@/services/payGrade.service'

export const payGradeKeys = {
  all: ['payGrades'] as const,
  lists: () => [...payGradeKeys.all, 'list'] as const,
  list: (filters: PayGradeFilters) => [...payGradeKeys.lists(), filters] as const,
  details: () => [...payGradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...payGradeKeys.details(), id] as const,
}

export function usePayGrades(filters?: PayGradeFilters) {
  return useQuery({
    queryKey: payGradeKeys.list(filters || {}),
    queryFn: () => payGradeService.getAll(filters),
  })
}

export function usePayGrade(id: string) {
  return useQuery({
    queryKey: payGradeKeys.detail(id),
    queryFn: () => payGradeService.getById(id),
    enabled: !!id,
  })
}

export function useCreatePayGrade() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PayGradeInsert) => payGradeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payGradeKeys.all })
      toast.success('Pay grade created successfully')
    },
    onError: (error) => {
      console.error('Error creating pay grade:', error)
      toast.error('Failed to create pay grade')
    },
  })
}

export function useUpdatePayGrade() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayGradeUpdate }) => payGradeService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payGradeKeys.all })
      queryClient.setQueryData(payGradeKeys.detail(data.id), data)
      toast.success('Pay grade updated successfully')
    },
    onError: (error) => {
      console.error('Error updating pay grade:', error)
      toast.error('Failed to update pay grade')
    },
  })
}

export function useDeletePayGrade() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => payGradeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payGradeKeys.all })
      toast.success('Pay grade deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting pay grade:', error)
      toast.error('Failed to delete pay grade')
    },
  })
}