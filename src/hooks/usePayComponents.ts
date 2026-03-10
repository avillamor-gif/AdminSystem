import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payComponentService } from '@/services/payComponent.service'
import type { PayComponentInsert, PayComponentUpdate } from '@/services/payComponent.service'
import toast from 'react-hot-toast'

export const payComponentKeys = {
  all: ['pay_components'] as const,
  lists: () => [...payComponentKeys.all, 'list'] as const,
  list: (filters: object) => [...payComponentKeys.lists(), filters] as const,
}

export function usePayComponents() {
  return useQuery({
    queryKey: payComponentKeys.lists(),
    queryFn: () => payComponentService.getAll(),
  })
}

export function useCreatePayComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PayComponentInsert) => payComponentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payComponentKeys.lists() })
      toast.success('Pay component created')
    },
    onError: (e: any) => toast.error(e.message || 'Error creating pay component'),
  })
}

export function useUpdatePayComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayComponentUpdate }) => payComponentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payComponentKeys.lists() })
      toast.success('Pay component updated')
    },
    onError: (e: any) => toast.error(e.message || 'Error updating pay component'),
  })
}

export function useDeletePayComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payComponentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payComponentKeys.lists() })
      toast.success('Pay component deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Error deleting pay component'),
  })
}
