import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '@/services/session.service'
import { toast } from 'react-hot-toast'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionKeys.all, 'list'] as const,
}

export function useActiveSessions() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: () => sessionService.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

export function useTerminateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => sessionService.terminateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('Session terminated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to terminate session')
    },
  })
}

export function useTerminateAllUserSessions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => sessionService.terminateAllUserSessions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('All user sessions terminated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to terminate sessions')
    },
  })
}
