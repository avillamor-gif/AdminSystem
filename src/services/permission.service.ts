import { createClient } from '@/lib/supabase/client'

export type UserPermission = {
  user_id: string
  employee_id: string | null
  role_id: string
  role_name: string
  role_description: string
  permission_id: string
  permission_name: string
  permission_code: string
  permission_category: string
}

export type UserRoleInfo = {
  role_id: string
  role_name: string
  role_description: string
  permissions: string[] // Array of permission codes
}

export const permissionService = {
  /**
   * Default permissions by role
   */
  getDefaultPermissionsByRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'ed': [
        'user.view', 'user.create', 'user.edit', 'user.delete', 'role.manage',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employee.view', 'employee.create', 'employee.edit', 'employee.delete',
        'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.reject', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.apply', 'leave.credits.approve',
        'attendance.view', 'attendance.edit', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.apply', 'travel.approve', 'travel.manage',
        'equipment.view', 'equipment.request', 'equipment.approve', 'assets.manage',
        'supplies.view', 'supplies.request', 'supplies.approve', 'supplies.manage',
        'publications.view', 'publications.request', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'system.config', 'system.logs', 'system.security', 'admin.manage',
        'settings.view', 'settings.edit'
      ],
      'executive director': [
        'user.view', 'user.create', 'user.edit', 'user.delete', 'role.manage',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employee.view', 'employee.create', 'employee.edit', 'employee.delete',
        'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.reject', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.apply', 'leave.credits.approve',
        'attendance.view', 'attendance.edit', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.apply', 'travel.approve', 'travel.manage',
        'equipment.view', 'equipment.request', 'equipment.approve', 'assets.manage',
        'supplies.view', 'supplies.request', 'supplies.approve', 'supplies.manage',
        'publications.view', 'publications.request', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'system.config', 'system.logs', 'system.security', 'admin.manage',
        'settings.view', 'settings.edit'
      ],
      'super admin': [
        'user.view', 'user.create', 'user.edit', 'user.delete', 'role.manage',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employee.view', 'employee.create', 'employee.edit', 'employee.delete',
        'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.reject', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.apply', 'leave.credits.approve',
        'attendance.view', 'attendance.edit', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.apply', 'travel.approve', 'travel.manage',
        'equipment.view', 'equipment.request', 'equipment.approve', 'assets.manage',
        'supplies.view', 'supplies.request', 'supplies.approve', 'supplies.manage',
        'publications.view', 'publications.request', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'system.config', 'system.logs', 'system.security', 'admin.manage',
        'settings.view', 'settings.edit'
      ],
      'admin': [
        'user.view', 'user.create', 'user.edit', 'user.delete', 'role.manage',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employee.view', 'employee.create', 'employee.edit', 'employee.delete',
        'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.reject', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.approve',
        'attendance.view', 'attendance.edit', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.apply', 'travel.approve', 'travel.manage',
        'equipment.view', 'equipment.request', 'equipment.approve', 'assets.manage',
        'supplies.view', 'supplies.request', 'supplies.approve', 'supplies.manage',
        'publications.view', 'publications.request', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'system.config', 'system.logs', 'system.security', 'admin.manage',
        'settings.view', 'settings.edit'
      ],
      'hr': [
        'user.view', 'user.create', 'user.edit',
        'users.view', 'users.create', 'users.edit',
        'employees.view', 'employees.create', 'employees.edit',
        'employee.view', 'employee.create', 'employee.edit',
        'departments.view',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.approve',
        'attendance.view', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.approve',
        'equipment.view', 'equipment.approve',
        'supplies.view', 'supplies.approve',
        'publications.view', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'admin.manage'
      ],
      'hr manager': [
        'user.view', 'user.create', 'user.edit',
        'users.view', 'users.create', 'users.edit',
        'employees.view', 'employees.create', 'employees.edit',
        'employee.view', 'employee.create', 'employee.edit',
        'departments.view',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.manage_types', 'leave.manage_balance',
        'leave.credits.view', 'leave.credits.approve',
        'attendance.view', 'attendance.view_all', 'attendance.export',
        'travel.view', 'travel.approve',
        'equipment.view', 'equipment.approve',
        'supplies.view', 'supplies.approve',
        'publications.view', 'publications.manage',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'recruitment.view', 'recruitment.manage',
        'reports.view', 'reports.export',
        'admin.manage'
      ],
      'manager': [
        'employees.view', 'employees.edit',
        'employee.view', 'employee.edit',
        'leave.view', 'leave.apply', 'leave.approve', 'leave.reject',
        'leave.credits.view', 'leave.credits.apply',
        'attendance.view', 'attendance.view_all',
        'travel.view', 'travel.apply', 'travel.approve',
        'equipment.view', 'equipment.request',
        'supplies.view', 'supplies.request',
        'publications.view', 'publications.request',
        'performance.view', 'performance.conduct', 'performance.manage_goals',
        'reports.view'
      ],
      'employee': [
        'employees.view',
        'employee.view',
        'leave.view', 'leave.apply', 'leave.create',
        'leave.credits.view', 'leave.credits.apply',
        'attendance.view',
        'travel.view', 'travel.apply',
        'equipment.view', 'equipment.request',
        'supplies.view', 'supplies.request',
        'publications.view', 'publications.request',
        'performance.view'
      ]
    }
    
    return rolePermissions[role.toLowerCase()] || rolePermissions['employee']
  },

  /**
   * Get current user's permissions
   */
  async getCurrentUserPermissions(): Promise<UserRoleInfo | null> {
    const supabase = createClient()
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting current user:', userError)
        return null
      }

      // Try to get user permissions from view first
      const { data, error } = await supabase
        .from('user_permissions' as any)
        .select('*')
        .eq('user_id', user.id)

      // If view exists and has data, use it
      if (!error && data && data.length > 0) {
        const row = data[0] as any
        const roleInfo: UserRoleInfo = {
          role_id: row.role_id,
          role_name: row.role_name,
          role_description: row.role_description,
          permissions: data.map((p: any) => p.permission_code)
        }
        return roleInfo
      }

      // Fallback: Get role from user_roles table and use default permissions
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError || !userRole) {
        console.warn('No role found for user:', user.id)
        return null
      }

      // Return default permissions based on role
      const permissions = this.getDefaultPermissionsByRole(userRole.role)
      
      // Normalize role display name
      const roleDisplayNames: Record<string, string> = {
        'admin': 'Admin',
        'hr': 'HR Manager',
        'hr manager': 'HR Manager',
        'manager': 'Manager',
        'employee': 'Employee',
        'ed': 'Executive Director',
        'executive director': 'Executive Director',
        'super admin': 'Super Admin',
        'board_member': 'Board Member',
      }
      const roleName = roleDisplayNames[userRole.role.toLowerCase()] || userRole.role
      
      return {
        role_id: userRole.role, // Use role string as ID
        role_name: roleName,
        role_description: `${roleName} role with default permissions`,
        permissions
      }
    } catch (error) {
      console.error('Error in getCurrentUserPermissions:', error)
      return null
    }
  },

  /**
   * Check if current user has a specific permission
   */
  async hasPermission(permissionCode: string): Promise<boolean> {
    const roleInfo = await this.getCurrentUserPermissions()
    
    if (!roleInfo) return false
    
    return roleInfo.permissions.includes(permissionCode)
  },

  /**
   * Check if current user has any of the specified permissions
   */
  async hasAnyPermission(permissionCodes: string[]): Promise<boolean> {
    const roleInfo = await this.getCurrentUserPermissions()
    
    if (!roleInfo) return false
    
    return permissionCodes.some(code => roleInfo.permissions.includes(code))
  },

  /**
   * Check if current user has all of the specified permissions
   */
  async hasAllPermissions(permissionCodes: string[]): Promise<boolean> {
    const roleInfo = await this.getCurrentUserPermissions()
    
    if (!roleInfo) return false
    
    return permissionCodes.every(code => roleInfo.permissions.includes(code))
  },

  /**
   * Check if current user has a specific role
   */
  async hasRole(roleName: string): Promise<boolean> {
    const roleInfo = await this.getCurrentUserPermissions()
    
    if (!roleInfo) return false
    
    return roleInfo.role_name.toLowerCase() === roleName.toLowerCase()
  },

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const roleInfo = await this.getCurrentUserPermissions()
    
    if (!roleInfo) return false
    
    return roleInfo.role_name === 'Admin'
  }
}
