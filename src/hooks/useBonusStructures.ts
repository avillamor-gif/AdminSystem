import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bonusStructureService } from '@/services/bonusStructure.service'
import type { BonusStructureInsert, BonusStructureUpdate } from '@/services/bonusStructure.service'
import toast from 'react-hot-toast'

export const bonusStructureKeys = {
  all: ['bonus_structures'] as const,
  lists: () => [...bonusStructureKeys.all, 'list'] as const,
}

export function useBonusStructures() {
  return useQuery({
    queryKey: bonusStructureKeys.lists(),
    queryFn: () => bonusStructureService.getAll(),
  })
}

export function useCreateBonusStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BonusStructureInsert) => bonusStructureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonusStructureKeys.lists() })
      toast.success('Bonus structure created')
    },
    onError: (e: any) => toast.error(e.message || 'Error creating bonus structure'),
  })
}

export function useUpdateBonusStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BonusStructureUpdate }) =>
      bonusStructureService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonusStructureKeys.lists() })
      toast.success('Bonus structure updated')
    },
    onError: (e: any) => toast.error(e.message || 'Error updating bonus structure'),
  })
}

export function useDeleteBonusStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bonusStructureService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonusStructureKeys.lists() })
      toast.success('Bonus structure deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Error deleting bonus structure'),
  })
}
