import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { twoFactorService } from '@/services/twoFactor.service'
import type { TwoFactorAuthUpdate } from '@/services/twoFactor.service'
import { toast } from 'react-hot-toast'

export const twoFactorKeys = {
  all: ['twoFactor'] as const,
  list: () => [...twoFactorKeys.all, 'list'] as const,
  byUser: (userId: string) => [...twoFactorKeys.all, 'user', userId] as const,
}

export function useTwoFactorAuth() {
  return useQuery({
    queryKey: twoFactorKeys.list(),
    queryFn: () => twoFactorService.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTwoFactorByUser(userId: string) {
  return useQuery({
    queryKey: twoFactorKeys.byUser(userId),
    queryFn: () => twoFactorService.getByUserId(userId),
    enabled: !!userId,
  })
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, method }: { userId: string; method: 'app' | 'sms' | 'email' }) => 
      twoFactorService.enable(userId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: twoFactorKeys.all })
      toast.success('Two-factor authentication enabled')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enable 2FA')
    },
  })
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => twoFactorService.disable(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: twoFactorKeys.all })
      toast.success('Two-factor authentication disabled')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disable 2FA')
    },
  })
}

export function useUpdateTwoFactor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: TwoFactorAuthUpdate }) => 
      twoFactorService.update(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: twoFactorKeys.all })
      toast.success('Two-factor authentication updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update 2FA')
    },
  })
}

export function useResetBackupCodes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => twoFactorService.resetBackupCodes(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: twoFactorKeys.all })
      toast.success('Backup codes reset successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset backup codes')
    },
  })
}
