import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { internationalOperationService, type InternationalOperationWithRelations, type InternationalOperationFilters, type InternationalOperation, type InternationalOperationInsert, type InternationalOperationUpdate } from '@/services/internationalOperation.service'
import { toast } from 'sonner'

export const internationalOperationKeys = {
  all: ['international_operations'] as const,
  lists: () => [...internationalOperationKeys.all, 'list'] as const,
  list: (filters: InternationalOperationFilters) => [...internationalOperationKeys.lists(), filters] as const,
  summary: () => [...internationalOperationKeys.all, 'summary'] as const,
  byCountry: (country: string) => [...internationalOperationKeys.all, 'country', country] as const,
  byRegion: (region: string) => [...internationalOperationKeys.all, 'region', region] as const,
  details: () => [...internationalOperationKeys.all, 'detail'] as const,
  detail: (id: string) => [...internationalOperationKeys.details(), id] as const,
  metrics: () => [...internationalOperationKeys.all, 'metrics'] as const,
  countries: () => [...internationalOperationKeys.all, 'countries'] as const,
  regions: () => [...internationalOperationKeys.all, 'regions'] as const,
}

export function useInternationalOperations(filters?: InternationalOperationFilters) {
  return useQuery({
    queryKey: internationalOperationKeys.list(filters || {}),
    queryFn: () => internationalOperationService.getAll(filters),
  })
}

export function useInternationalOperation(id: string): UseQueryResult<InternationalOperationWithRelations | null> {
  return useQuery({
    queryKey: internationalOperationKeys.detail(id),
    queryFn: () => internationalOperationService.getById(id),
    enabled: !!id,
  })
}

export function useInternationalOperationsSummary() {
  return useQuery({
    queryKey: internationalOperationKeys.summary(),
    queryFn: () => internationalOperationService.getSummary(),
  })
}

export function useInternationalOperationsByCountry(country: string) {
  return useQuery({
    queryKey: internationalOperationKeys.byCountry(country),
    queryFn: () => internationalOperationService.getByCountry(country),
    enabled: !!country,
  })
}

export function useInternationalOperationsByRegion(region: string) {
  return useQuery({
    queryKey: internationalOperationKeys.byRegion(region),
    queryFn: () => internationalOperationService.getByRegion(region),
    enabled: !!region,
  })
}

export function useInternationalOperationMetrics() {
  return useQuery({
    queryKey: internationalOperationKeys.metrics(),
    queryFn: () => internationalOperationService.getMetrics(),
  })
}

export function useInternationalOperationCountries() {
  return useQuery({
    queryKey: internationalOperationKeys.countries(),
    queryFn: () => internationalOperationService.getCountries(),
  })
}

export function useInternationalOperationRegions() {
  return useQuery({
    queryKey: internationalOperationKeys.regions(),
    queryFn: () => internationalOperationService.getRegions(),
  })
}

export function useCreateInternationalOperation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InternationalOperationInsert) => internationalOperationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internationalOperationKeys.all })
      toast.success('International operation created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating international operation:', error)
      toast.error('Failed to create international operation')
    },
  })
}

export function useUpdateInternationalOperation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InternationalOperationUpdate }) =>
      internationalOperationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: internationalOperationKeys.all })
      queryClient.invalidateQueries({ queryKey: internationalOperationKeys.detail(variables.id) })
      toast.success('International operation updated successfully')
    },
    onError: (error: Error) => {
      console.error('Error updating international operation:', error)
      toast.error('Failed to update international operation')
    },
  })
}

export function useDeleteInternationalOperation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => internationalOperationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internationalOperationKeys.all })
      toast.success('International operation deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Error deleting international operation:', error)
      toast.error('Failed to delete international operation')
    },
  })
}
