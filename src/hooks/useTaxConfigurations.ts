import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taxConfigurationService } from '@/services/taxConfiguration.service'
import type { TaxConfigurationInsert, TaxConfigurationUpdate } from '@/services/taxConfiguration.service'
import toast from 'react-hot-toast'

export const taxConfigurationKeys = {
  all: ['tax_configurations'] as const,
  lists: () => [...taxConfigurationKeys.all, 'list'] as const,
  list: (filters: object) => [...taxConfigurationKeys.lists(), filters] as const,
}

export function useTaxConfigurations() {
  return useQuery({
    queryKey: taxConfigurationKeys.lists(),
    queryFn: () => taxConfigurationService.getAll(),
  })
}

export function useCreateTaxConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TaxConfigurationInsert) => taxConfigurationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxConfigurationKeys.lists() })
      toast.success('Tax configuration created')
    },
    onError: (e: any) => toast.error(e.message || 'Error creating tax configuration'),
  })
}

export function useUpdateTaxConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxConfigurationUpdate }) => taxConfigurationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxConfigurationKeys.lists() })
      toast.success('Tax configuration updated')
    },
    onError: (e: any) => toast.error(e.message || 'Error updating tax configuration'),
  })
}

export function useDeleteTaxConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taxConfigurationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxConfigurationKeys.lists() })
      toast.success('Tax configuration deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Error deleting tax configuration'),
  })
}
