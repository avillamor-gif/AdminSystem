import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workflowConfigService, updateWorkflowConfig, type WorkflowConfigUpdate } from '@/services/workflowConfig.service'

export const workflowConfigKeys = {
  all: ['workflow_configs'] as const,
  lists: () => [...workflowConfigKeys.all, 'list'] as const,
  detail: (type: string) => [...workflowConfigKeys.all, 'detail', type] as const,
}

export function useWorkflowConfigs() {
  return useQuery({
    queryKey: workflowConfigKeys.lists(),
    queryFn: () => workflowConfigService.getAll(),
    staleTime: 0, // always fetch fresh — settings must reflect latest DB state
  })
}

export function useWorkflowConfig(requestType: string) {
  return useQuery({
    queryKey: workflowConfigKeys.detail(requestType),
    queryFn: () => workflowConfigService.getByType(requestType),
    enabled: !!requestType,
    staleTime: 0, // always fetch fresh
  })
}

export function useUpdateWorkflowConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: WorkflowConfigUpdate }) =>
      updateWorkflowConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowConfigKeys.all })
      toast.success('Workflow settings saved')
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message ?? 'Unknown error'}`)
    },
  })
}
