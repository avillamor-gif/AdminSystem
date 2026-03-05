import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { passwordPolicyService } from '@/services/passwordPolicy.service'
import type { PasswordPolicyUpdate } from '@/services/passwordPolicy.service'

export const passwordPolicyKeys = {
  all: ['password-policies'] as const,
  policies: () => [...passwordPolicyKeys.all, 'policies'] as const,
  statuses: () => [...passwordPolicyKeys.all, 'statuses'] as const,
}

export function usePasswordPolicies() {
  return useQuery({
    queryKey: passwordPolicyKeys.policies(),
    queryFn: () => passwordPolicyService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePasswordStatuses() {
  return useQuery({
    queryKey: passwordPolicyKeys.statuses(),
    queryFn: () => passwordPolicyService.getUserPasswordStatuses(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUpdatePasswordPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PasswordPolicyUpdate }) => 
      passwordPolicyService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passwordPolicyKeys.policies() })
      toast.success('Password policy updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update password policy error:', error)
      toast.error(error.message || 'Failed to update password policy')
    },
  })
}

export function useForcePasswordReset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => passwordPolicyService.forcePasswordReset(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passwordPolicyKeys.statuses() })
      toast.success('Password reset forced successfully')
    },
    onError: (error: Error) => {
      console.error('Force password reset error:', error)
      toast.error(error.message || 'Failed to force password reset')
    },
  })
}
