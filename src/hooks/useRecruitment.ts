import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recruitmentService } from '@/services'
import type { VacancyFilters, CandidateFilters, VacancyInsert, VacancyUpdate, CandidateInsert, CandidateUpdate } from '@/services'
import toast from 'react-hot-toast'

// Vacancies
export function useVacancies(filters?: VacancyFilters) {
  return useQuery({
    queryKey: ['vacancies', filters],
    queryFn: () => recruitmentService.getVacancies(filters),
  })
}

export function useVacancy(id: string) {
  return useQuery({
    queryKey: ['vacancy', id],
    queryFn: () => recruitmentService.getVacancyById(id),
    enabled: !!id,
  })
}

export function useCreateVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VacancyInsert) => recruitmentService.createVacancy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] })
      toast.success('Vacancy created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vacancy')
    },
  })
}

export function useUpdateVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VacancyUpdate }) =>
      recruitmentService.updateVacancy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] })
      toast.success('Vacancy updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vacancy')
    },
  })
}

export function useDeleteVacancy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentService.deleteVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancies'] })
      toast.success('Vacancy deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vacancy')
    },
  })
}

// Candidates
export function useCandidates(filters?: CandidateFilters) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => recruitmentService.getCandidates(filters),
  })
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => recruitmentService.getCandidateById(id),
    enabled: !!id,
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CandidateInsert) => recruitmentService.createCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add candidate')
    },
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CandidateUpdate }) =>
      recruitmentService.updateCandidate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update candidate')
    },
  })
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentService.deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete candidate')
    },
  })
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      recruitmentService.updateCandidateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate status updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })
}
