import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationService, type LocationWithRelations, type LocationFilters, type Location, type LocationInsert, type LocationUpdate } from '@/services/location.service'
import { toast } from 'sonner'

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (filters: LocationFilters) => [...locationKeys.lists(), filters] as const,
  withDetails: () => [...locationKeys.all, 'with-details'] as const,
  headquarters: () => [...locationKeys.all, 'headquarters'] as const,
  byCountry: (country: string) => [...locationKeys.all, 'country', country] as const,
  byType: (type: string) => [...locationKeys.all, 'type', type] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
  metrics: () => [...locationKeys.all, 'metrics'] as const,
  countries: () => [...locationKeys.all, 'countries'] as const,
}

export function useLocations(filters?: LocationFilters) {
  return useQuery({
    queryKey: locationKeys.list(filters || {}),
    queryFn: () => locationService.getAll(filters),
  })
}

export function useLocation(id: string): UseQueryResult<LocationWithRelations | null> {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => locationService.getById(id),
    enabled: !!id,
  })
}

export function useLocationsWithDetails() {
  return useQuery({
    queryKey: locationKeys.withDetails(),
    queryFn: () => locationService.getWithDetails(),
  })
}

export function useLocationsByCountry(country: string) {
  return useQuery({
    queryKey: locationKeys.byCountry(country),
    queryFn: () => locationService.getByCountry(country),
    enabled: !!country,
  })
}

export function useLocationsByType(type: string) {
  return useQuery({
    queryKey: locationKeys.byType(type),
    queryFn: () => locationService.getByType(type),
    enabled: !!type,
  })
}

export function useHeadquarters() {
  return useQuery({
    queryKey: locationKeys.headquarters(),
    queryFn: () => locationService.getHeadquarters(),
  })
}

export function useLocationMetrics() {
  return useQuery({
    queryKey: locationKeys.metrics(),
    queryFn: () => locationService.getMetrics(),
  })
}

export function useLocationCountries() {
  return useQuery({
    queryKey: locationKeys.countries(),
    queryFn: () => locationService.getCountries(),
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LocationInsert) => locationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      toast.success('Location created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating location:', error)
      toast.error('Failed to create location')
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationUpdate }) =>
      locationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
      toast.success('Location updated successfully')
    },
    onError: (error: Error) => {
      console.error('Error updating location:', error)
      toast.error('Failed to update location')
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => locationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      toast.success('Location deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Error deleting location:', error)
      toast.error('Failed to delete location')
    },
  })
}
