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
        'publications.view', 'publications.request'
      ]
    }
    
    return rolePermissions[role.toLowerCase()] || rolePermissions['employee']
  },

  /**
   * Get current user's permissions — always reads live from the database so
   * that changes made in the RBAC admin panel take effect immediately.
   *
   * Strategy (in order):
   *  1. Join user_roles → roles → role_permissions → permissions via role_id FK.
   *  2. If role_id is NULL, fall back to matching by role name string.
   *  3. Only if the DB returns nothing at all, use hardcoded defaults.
   */
  async getCurrentUserPermissions(): Promise<UserRoleInfo | null> {
    const supabase = createClient()

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return null

      // ── Step 1: get the user's role row ──────────────────────────────────
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, role_id')
        .eq('user_id', user.id)
        .single()

      if (roleError || !userRole) return null

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
      const roleName = roleDisplayNames[userRole.role.toLowerCase()] ?? userRole.role

      // Role-name → roles.name mapping (for fallback join by name)
      const roleNameMap: Record<string, string> = {
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
      const rolesTableName = roleNameMap[userRole.role.toLowerCase()] ?? userRole.role

      // ── Step 2: query permissions via role_id (preferred) ────────────────
      let permissionCodes: string[] = []
      let dbRoleId: string | null = null
      let dbRoleName: string | null = null
      let dbRoleDescription: string | null = null

      if (userRole.role_id) {
        const { data: rpRows } = await supabase
          .from('role_permissions' as any)
          .select('permission:permissions(id, code), role:roles!role_permissions_role_id_fkey(id, name, description)')
          .eq('role_id', userRole.role_id)

        if (rpRows && rpRows.length > 0) {
          const firstRow = rpRows[0] as any
          dbRoleId = firstRow.role?.id ?? userRole.role_id
          dbRoleName = firstRow.role?.name ?? roleName
          dbRoleDescription = firstRow.role?.description ?? null
          permissionCodes = rpRows.map((r: any) => r.permission?.code).filter(Boolean)
        }
      }

      // ── Step 3: fallback join by role name string ────────────────────────
      if (permissionCodes.length === 0) {
        const { data: roleRows } = await supabase
          .from('roles' as any)
          .select('id, name, description, role_permissions(permission:permissions(code))')
          .eq('name', rolesTableName)
          .eq('status', 'active')
          .single()

        if (roleRows) {
          const r = roleRows as any
          dbRoleId = r.id
          dbRoleName = r.name
          dbRoleDescription = r.description
          permissionCodes = (r.role_permissions ?? [])
            .map((rp: any) => rp.permission?.code)
            .filter(Boolean)
        }
      }

      // ── Step 4: last-resort hardcoded defaults (should rarely be hit) ────
      if (permissionCodes.length === 0) {
        permissionCodes = this.getDefaultPermissionsByRole(userRole.role)
      }

      return {
        role_id: dbRoleId ?? userRole.role_id ?? userRole.role,
        role_name: dbRoleName ?? roleName,
        role_description: dbRoleDescription ?? `${roleName} role`,
        permissions: permissionCodes,
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
