import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { benefitsPlanService, type BenefitsPlan } from '@/services/benefitsPlan.service'

export type { BenefitsPlan }

export const benefitsPlanKeys = {
  all: ['benefits-plans'] as const,
  lists: () => [...benefitsPlanKeys.all, 'list'] as const,
  list: (filters: any) => [...benefitsPlanKeys.lists(), filters] as const,
  detail: (id: string) => [...benefitsPlanKeys.all, 'detail', id] as const
}

export function useBenefitsPlans() {
  return useQuery({
    queryKey: benefitsPlanKeys.lists(),
    queryFn: () => benefitsPlanService.getAll()
  })
}

export function useBenefitsPlan(id: string | undefined) {
  return useQuery({
    queryKey: benefitsPlanKeys.detail(id || ''),
    queryFn: () => id ? benefitsPlanService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateBenefitsPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BenefitsPlan>) => benefitsPlanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsPlanKeys.lists() })
      toast.success('Benefits plan created')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create benefits plan')
    }
  })
}

export function useUpdateBenefitsPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BenefitsPlan> }) => benefitsPlanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsPlanKeys.lists() })
      toast.success('Benefits plan updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update benefits plan')
    }
  })
}

export function useDeleteBenefitsPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => benefitsPlanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitsPlanKeys.lists() })
      toast.success('Benefits plan deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete benefits plan')
    }
  })
}
