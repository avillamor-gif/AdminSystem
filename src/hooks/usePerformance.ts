import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceService } from '@/services'
import type { ReviewFilters, GoalFilters, PerformanceReviewInsert, PerformanceReviewUpdate, GoalInsert, GoalUpdate } from '@/services'
import toast from 'react-hot-toast'

// Performance Reviews
export function usePerformanceReviews(filters?: ReviewFilters) {
  return useQuery({
    queryKey: ['performance-reviews', filters],
    queryFn: () => performanceService.getReviews(filters),
  })
}

export function usePerformanceReview(id: string) {
  return useQuery({
    queryKey: ['performance-review', id],
    queryFn: () => performanceService.getReviewById(id),
    enabled: !!id,
  })
}

export function useCreatePerformanceReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PerformanceReviewInsert) => performanceService.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] })
      toast.success('Review created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create review')
    },
  })
}

export function useUpdatePerformanceReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PerformanceReviewUpdate }) =>
      performanceService.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] })
      toast.success('Review updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update review')
    },
  })
}

export function useDeletePerformanceReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => performanceService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] })
      toast.success('Review deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete review')
    },
  })
}

// Goals
export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: () => performanceService.getGoals(filters),
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GoalInsert) => performanceService.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create goal')
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalUpdate }) =>
      performanceService.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update goal')
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => performanceService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete goal')
    },
  })
}
