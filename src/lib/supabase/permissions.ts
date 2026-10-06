/**
 * Server-side permission checking utilities using RBAC system.
 * Used by API routes to verify user access based on assigned roles and permissions.
 */

import { createAdminClient } from './admin'

/**
 * Check if a user has a specific permission code
 * Works with the RBAC system: user_role_assignments → roles → role_permissions → permissions
 *
 * @param userId - Supabase auth user ID
 * @param permissionCode - Permission code to check (e.g., 'leave.approve', 'travel.approve')
 * @returns true if user has the permission, false otherwise
 */
export async function checkUserPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  if (!userId || !permissionCode) return false

  try {
    const admin = createAdminClient()

    // Step 1: Get all role assignments for this user
    const { data: assignments, error: assignmentError } = await admin
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId)

    if (assignmentError) {
      console.error('[checkUserPermission] Error fetching role assignments:', assignmentError)
      return false
    }

    if (!assignments || assignments.length === 0) {
      // No role assignments found
      return false
    }

    const roleIds = assignments.map((a: any) => a.role_id)

    // Step 2: Get all permissions for those roles
    const { data: rolePermissions, error: permError } = await admin
      .from('role_permissions')
      .select('permission:permissions(code)')
      .in('role_id', roleIds)

    if (permError) {
      console.error('[checkUserPermission] Error fetching role permissions:', permError)
      return false
    }

    if (!rolePermissions || rolePermissions.length === 0) {
      // No permissions found
      return false
    }

    // Step 3: Check if any role has the requested permission
    const hasPermission = rolePermissions.some(
      (rp: any) => rp.permission?.code === permissionCode
    )

    return hasPermission
  } catch (error) {
    console.error('[checkUserPermission] Unexpected error:', error)
    return false
  }
}

/**
 * Check if a user has ANY of the specified permission codes
 *
 * @param userId - Supabase auth user ID
 * @param permissionCodes - Array of permission codes (e.g., ['leave.approve', 'admin.manage'])
 * @returns true if user has at least one of the permissions, false otherwise
 */
export async function checkUserHasAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  if (!userId || !permissionCodes || permissionCodes.length === 0) return false

  try {
    const admin = createAdminClient()

    // Get all role assignments for this user
    const { data: assignments, error: assignmentError } = await admin
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId)

    if (assignmentError || !assignments || assignments.length === 0) {
      return false
    }

    const roleIds = assignments.map((a: any) => a.role_id)

    // Get all permissions for those roles
    const { data: rolePermissions, error: permError } = await admin
      .from('role_permissions')
      .select('permission:permissions(code)')
      .in('role_id', roleIds)

    if (permError || !rolePermissions || rolePermissions.length === 0) {
      return false
    }

    // Check if any role has any of the requested permissions
    const userPermCodes = rolePermissions
      .map((rp: any) => rp.permission?.code)
      .filter(Boolean)

    return permissionCodes.some(code => userPermCodes.includes(code))
  } catch (error) {
    console.error('[checkUserHasAnyPermission] Unexpected error:', error)
    return false
  }
}

/**
 * Check if a user has ALL of the specified permission codes
 *
 * @param userId - Supabase auth user ID
 * @param permissionCodes - Array of permission codes
 * @returns true if user has all of the permissions, false otherwise
 */
export async function checkUserHasAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  if (!userId || !permissionCodes || permissionCodes.length === 0) return false

  try {
    const admin = createAdminClient()

    // Get all role assignments for this user
    const { data: assignments, error: assignmentError } = await admin
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId)

    if (assignmentError || !assignments || assignments.length === 0) {
      return false
    }

    const roleIds = assignments.map((a: any) => a.role_id)

    // Get all permissions for those roles
    const { data: rolePermissions, error: permError } = await admin
      .from('role_permissions')
      .select('permission:permissions(code)')
      .in('role_id', roleIds)

    if (permError || !rolePermissions || rolePermissions.length === 0) {
      return false
    }

    // Check if all requested permissions are present
    const userPermCodes = rolePermissions
      .map((rp: any) => rp.permission?.code)
      .filter(Boolean)

    return permissionCodes.every(code => userPermCodes.includes(code))
  } catch (error) {
    console.error('[checkUserHasAllPermissions] Unexpected error:', error)
    return false
  }
}

/**
 * Get all permission codes for a user
 *
 * @param userId - Supabase auth user ID
 * @returns Array of permission codes the user has, empty array if none
 */
export async function getUserPermissionCodes(userId: string): Promise<string[]> {
  if (!userId) return []

  try {
    const admin = createAdminClient()

    // Get all role assignments for this user
    const { data: assignments, error: assignmentError } = await admin
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId)

    if (assignmentError || !assignments || assignments.length === 0) {
      return []
    }

    const roleIds = assignments.map((a: any) => a.role_id)

    // Get all permissions for those roles
    const { data: rolePermissions, error: permError } = await admin
      .from('role_permissions')
      .select('permission:permissions(code)')
      .in('role_id', roleIds)

    if (permError || !rolePermissions) {
      return []
    }

    // Extract unique permission codes
    const codes = rolePermissions
      .map((rp: any) => rp.permission?.code)
      .filter(Boolean)

    return Array.from(new Set(codes)) as string[]
  } catch (error) {
    console.error('[getUserPermissionCodes] Unexpected error:', error)
    return []
  }
}
