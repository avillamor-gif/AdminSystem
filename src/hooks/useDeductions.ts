import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deductionService } from '@/services/deduction.service'
import type { DeductionInsert, DeductionUpdate } from '@/services/deduction.service'
import toast from 'react-hot-toast'

export const deductionKeys = {
  all: ['deductions'] as const,
  lists: () => [...deductionKeys.all, 'list'] as const,
}

export function useDeductions() {
  return useQuery({
    queryKey: deductionKeys.lists(),
    queryFn: () => deductionService.getAll(),
  })
}

export function useCreateDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeductionInsert) => deductionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.lists() })
      toast.success('Deduction created')
    },
    onError: (e: any) => toast.error(e.message || 'Error creating deduction'),
  })
}

export function useUpdateDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeductionUpdate }) =>
      deductionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.lists() })
      toast.success('Deduction updated')
    },
    onError: (e: any) => toast.error(e.message || 'Error updating deduction'),
  })
}

export function useDeleteDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deductionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.lists() })
      toast.success('Deduction deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Error deleting deduction'),
  })
}
