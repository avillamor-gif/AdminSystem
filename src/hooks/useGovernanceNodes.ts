import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { governanceNodeService, type GovernanceNodeInsert } from '@/services/governanceNode.service'
import toast from 'react-hot-toast'

export const governanceNodeKeys = {
  all: ['governance_nodes'] as const,
  lists: () => [...governanceNodeKeys.all, 'list'] as const,
}

export function useGovernanceNodes() {
  return useQuery({
    queryKey: governanceNodeKeys.lists(),
    queryFn: () => governanceNodeService.getAll(),
  })
}

export function useCreateGovernanceNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GovernanceNodeInsert) => governanceNodeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceNodeKeys.lists() })
      toast.success('Governance tier created')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to create'),
  })
}

export function useUpdateGovernanceNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GovernanceNodeInsert> }) =>
      governanceNodeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceNodeKeys.lists() })
      toast.success('Governance tier updated')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update'),
  })
}

export function useDeleteGovernanceNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => governanceNodeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceNodeKeys.lists() })
      toast.success('Governance tier deleted')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to delete'),
  })
}
