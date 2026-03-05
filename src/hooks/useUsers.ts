import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { userService } from '@/services'
import type { SystemUserWithRelations, SystemUserInsert, SystemUserUpdate, UserFilters } from '@/services'

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// Queries
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters || {}),
    queryFn: () => userService.getAll(filters),
    staleTime: 30 * 1000,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  })
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SystemUserInsert) => userService.create(data),
    onSuccess: (data) => {
      console.log('User created successfully:', data)
      
      // Invalidate and refetch all user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.refetchQueries({ queryKey: userKeys.all })
      
      toast.success(`User ${data.name} created successfully`)
    },
    onError: (error: Error) => {
      console.error('Create user error:', error)
      toast.error(error.message || 'Failed to create user')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SystemUserUpdate }) => 
      userService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) })
      toast.success(`User ${data.name} updated successfully`)
    },
    onError: (error: Error) => {
      console.error('Update user error:', error)
      toast.error(error.message || 'Failed to update user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete user error:', error)
      toast.error(error.message || 'Failed to delete user')
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) =>
      userService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('User status updated successfully')
    },
    onError: (error: Error) => {
      console.error('Update user status error:', error)
      toast.error(error.message || 'Failed to update user status')
    },
  })
}