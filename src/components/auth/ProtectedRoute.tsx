'use client'

import { useCurrentUserPermissions } from '@/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRole?: string | string[]
  requireAny?: boolean // If true, user needs ANY of the permissions. If false, needs ALL
  fallbackUrl?: string
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [],
  requiredRole,
  requireAny = false,
  fallbackUrl = '/'
}: ProtectedRouteProps) {
  const { data: roleInfo, isPending } = useCurrentUserPermissions()
  const router = useRouter()

  useEffect(() => {
    if (isPending) return

    // No role info means no access
    if (!roleInfo) {
      router.push(fallbackUrl)
      return
    }

    // Check role requirement
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const hasRole = roles.some(role => roleInfo.role_name.toLowerCase() === role.toLowerCase())
      if (!hasRole) {
        router.push(fallbackUrl)
        return
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAccess = requireAny
        ? requiredPermissions.some(perm => roleInfo.permissions.includes(perm))
        : requiredPermissions.every(perm => roleInfo.permissions.includes(perm))

      if (!hasAccess) {
        router.push(fallbackUrl)
        return
      }
    }
  }, [roleInfo, isPending, requiredPermissions, requiredRole, requireAny, router, fallbackUrl])

  // Show loading state while checking permissions
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    )
  }

  // Show access denied if no role info
  if (!roleInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
