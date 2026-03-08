import { useQuery } from '@tanstack/react-query'
import { permissionService, type UserRoleInfo } from '@/services/permission.service'

export const permissionKeys = {
  all: ['permissions'] as const,
  current: () => [...permissionKeys.all, 'current'] as const,
}

/**
 * Hook to get current user's role and permissions
 */
export function useCurrentUserPermissions() {
  return useQuery({
    queryKey: permissionKeys.current(),
    queryFn: () => permissionService.getCurrentUserPermissions(),
    staleTime: 0, // always re-fetch so RBAC changes are reflected immediately
    retry: 1,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permissionCode: string) {
  const { data: roleInfo } = useCurrentUserPermissions()
  
  if (!roleInfo) return false
  
  return roleInfo.permissions.includes(permissionCode)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissionCodes: string[]) {
  const { data: roleInfo } = useCurrentUserPermissions()
  
  if (!roleInfo) return false
  
  return permissionCodes.some(code => roleInfo.permissions.includes(code))
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissionCodes: string[]) {
  const { data: roleInfo } = useCurrentUserPermissions()
  
  if (!roleInfo) return false
  
  return permissionCodes.every(code => roleInfo.permissions.includes(code))
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { data: roleInfo } = useCurrentUserPermissions()
  
  if (!roleInfo) return false
  
  return roleInfo.permissions.includes('admin.manage')
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roleName: string) {
  const { data: roleInfo } = useCurrentUserPermissions()
  
  if (!roleInfo) return false
  
  return roleInfo.role_name.toLowerCase() === roleName.toLowerCase()
}
