import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { probationaryService } from '@/services'
import type { ProbationaryReviewFilters, ProbationaryReviewUpdate, ProbationaryRecommendation } from '@/services'
import toast from 'react-hot-toast'

export const probationaryKeys = {
  all: ['probationary_reviews'] as const,
  lists: () => [...probationaryKeys.all, 'list'] as const,
  list: (filters: ProbationaryReviewFilters) => [...probationaryKeys.lists(), filters] as const,
  byEmployee: (id: string) => [...probationaryKeys.all, 'employee', id] as const,
}

export function useProbationaryReviews(filters: ProbationaryReviewFilters = {}) {
  return useQuery({
    queryKey: probationaryKeys.list(filters),
    queryFn: () => probationaryService.getAll(filters),
  })
}

export function useProbationaryReviewsByEmployee(employeeId: string) {
  return useQuery({
    queryKey: probationaryKeys.byEmployee(employeeId),
    queryFn: () => probationaryService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useUpdateProbationaryReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProbationaryReviewUpdate }) =>
      probationaryService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: probationaryKeys.lists() })
      toast.success('Review updated')
    },
    onError: () => toast.error('Failed to update review'),
  })
}

export function useCompleteProbationaryReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      recommendation,
      reviewer_id,
      performance_score,
      notes,
    }: {
      id: string
      recommendation: ProbationaryRecommendation
      reviewer_id: string
      performance_score?: number | null
      notes?: string | null
    }) =>
      probationaryService.complete(id, { recommendation, reviewer_id, performance_score, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: probationaryKeys.lists() })
      toast.success('Review completed successfully')
    },
    onError: () => toast.error('Failed to complete review'),
  })
}
