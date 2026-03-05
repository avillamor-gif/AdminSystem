import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { securityPolicyService } from '@/services/securityPolicy.service'
import type { SecurityPolicyUpdate } from '@/services/securityPolicy.service'
import { toast } from 'react-hot-toast'

export const securityPolicyKeys = {
  all: ['securityPolicies'] as const,
  list: () => [...securityPolicyKeys.all, 'list'] as const,
  byCategory: () => [...securityPolicyKeys.all, 'byCategory'] as const,
}

export function useSecurityPolicies() {
  return useQuery({
    queryKey: securityPolicyKeys.list(),
    queryFn: () => securityPolicyService.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSecurityPoliciesByCategory() {
  return useQuery({
    queryKey: securityPolicyKeys.byCategory(),
    queryFn: () => securityPolicyService.getByCategory(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSecurityPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SecurityPolicyUpdate }) => 
      securityPolicyService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityPolicyKeys.all })
      toast.success('Security policy updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update security policy')
    },
  })
}

export function useMarkPolicyAsReviewed() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => securityPolicyService.markAsReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityPolicyKeys.all })
      toast.success('Policy marked as reviewed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark policy as reviewed')
    },
  })
}
