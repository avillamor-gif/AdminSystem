import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationTypeService, locationTypeKeys, type LocationType, type LocationTypeInsert, type LocationTypeUpdate, type LocationTypeFilters } from '@/services/locationType.service'
import { toast } from 'sonner'

export function useLocationTypes(filters?: LocationTypeFilters) {
  return useQuery({
    queryKey: locationTypeKeys.list(filters || {}),
    queryFn: () => locationTypeService.getAll(filters),
  })
}

export function useLocationType(id: string) {
  return useQuery({
    queryKey: locationTypeKeys.detail(id),
    queryFn: () => locationTypeService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLocationType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LocationTypeInsert) => locationTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all })
      toast.success('Location type created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating location type:', error)
      toast.error('Failed to create location type')
    },
  })
}

export function useUpdateLocationType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationTypeUpdate }) => locationTypeService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.detail(data.id) })
      toast.success('Location type updated successfully')
    },
    onError: (error: Error) => {
      console.error('Error updating location type:', error)
      toast.error('Failed to update location type')
    },
  })
}

export function useDeleteLocationType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => locationTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all })
      toast.success('Location type deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Error deleting location type:', error)
      toast.error('Failed to delete location type')
    },
  })
}
