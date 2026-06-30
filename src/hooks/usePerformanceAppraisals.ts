import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { performanceAppraisalService } from '@/services/performanceAppraisal.service'
import type { AdminAppraisalFilters, SavePerformanceAppraisalInput } from '@/services/performanceAppraisal.service'

export const appraisalKeys = {
  all: ['performance-appraisals'] as const,
  mine: () => [...appraisalKeys.all, 'mine'] as const,
  adminList: (filters: AdminAppraisalFilters) => [...appraisalKeys.all, 'admin-list', filters] as const,
  adminDetail: (id: string) => [...appraisalKeys.all, 'admin-detail', id] as const,
}

export function useMyPerformanceAppraisals() {
  return useQuery({
    queryKey: appraisalKeys.mine(),
    queryFn: () => performanceAppraisalService.getMyAppraisals(),
  })
}

export function useSavePerformanceAppraisalDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SavePerformanceAppraisalInput) => performanceAppraisalService.saveDraft(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appraisalKeys.mine() })
      queryClient.invalidateQueries({ queryKey: appraisalKeys.all })
      toast.success('Draft saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save draft')
    },
  })
}

export function useSubmitPerformanceAppraisal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SavePerformanceAppraisalInput) => performanceAppraisalService.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appraisalKeys.mine() })
      queryClient.invalidateQueries({ queryKey: appraisalKeys.all })
      toast.success('Appraisal submitted for review')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit appraisal')
    },
  })
}

export function useAdminPerformanceAppraisals(filters: AdminAppraisalFilters = {}) {
  return useQuery({
    queryKey: appraisalKeys.adminList(filters),
    queryFn: () => performanceAppraisalService.getAdminAppraisals(filters),
  })
}

export function useAdminPerformanceAppraisal(id: string) {
  return useQuery({
    queryKey: appraisalKeys.adminDetail(id),
    queryFn: () => performanceAppraisalService.getAdminAppraisalById(id),
    enabled: !!id,
  })
}

export function useUpdateAdminPerformanceAppraisal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; appraiser_employee_id?: string | null; form_data?: any } }) =>
      performanceAppraisalService.updateAdminAppraisal(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: appraisalKeys.all })
      queryClient.invalidateQueries({ queryKey: appraisalKeys.adminDetail(vars.id) })
      toast.success('Appraisal updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update appraisal')
    },
  })
}
