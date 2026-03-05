import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacService } from '@/services/rbac.service'
import type { RoleInsert, RoleUpdate } from '@/services/rbac.service'
import { toast } from 'react-hot-toast'

export const rbacKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  permissions: () => [...rbacKeys.all, 'permissions'] as const,
  permissionsByCategory: () => [...rbacKeys.permissions(), 'byCategory'] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => rbacService.getAllRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: () => rbacService.getAllPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function usePermissionsByCategory() {
  return useQuery({
    queryKey: rbacKeys.permissionsByCategory(),
    queryFn: () => rbacService.getPermissionsByCategory(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: RoleInsert) => rbacService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() })
      toast.success('Role created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role')
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleUpdate }) => 
      rbacService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() })
      toast.success('Role updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role')
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() })
      toast.success('Role deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete role')
    },
  })
}

export function useAssignPermissions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      rbacService.assignPermissionsToRole(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() })
      toast.success('Permissions updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions')
    },
  })
}
