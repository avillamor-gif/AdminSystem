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
    // These defaults are kept in sync with the DB role_permissions table.
    // They are only used as a last-resort fallback when the DB query returns
    // zero permissions (e.g. during initial setup or a transient DB error).
    const rolePermissions: Record<string, string[]> = {
      // ── Executive Director / ed ──────────────────────────────────────────
      'ed': [
        'admin.manage', 'assets.manage',
        'analytics.export', 'analytics.view',
        'attendance.edit', 'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.view', 'employees.view',
        'equipment.approve', 'equipment.create', 'equipment.manage', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.apply', 'leave.credits.approve',
        'leave.credits.view', 'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.approve', 'publications.create', 'publications.manage',
        'publications.request', 'publications.view',
        'recruitment.applications', 'recruitment.manage', 'recruitment.postings', 'recruitment.view',
        'reports.export', 'reports.view',
        'role.manage',
        'settings.edit', 'settings.view',
        'supplies.approve', 'supplies.create', 'supplies.manage', 'supplies.view',
        'system.config', 'system.logs', 'system.security',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.apply', 'travel.approve', 'travel.create', 'travel.manage', 'travel.view',
        'user.create', 'user.delete', 'user.edit', 'user.view',
      ],
      'executive director': [
        'admin.manage', 'assets.manage',
        'analytics.export', 'analytics.view',
        'attendance.edit', 'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.view', 'employees.view',
        'equipment.approve', 'equipment.create', 'equipment.manage', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.apply', 'leave.credits.approve',
        'leave.credits.view', 'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.approve', 'publications.create', 'publications.manage',
        'publications.request', 'publications.view',
        'recruitment.applications', 'recruitment.manage', 'recruitment.postings', 'recruitment.view',
        'reports.export', 'reports.view',
        'role.manage',
        'settings.edit', 'settings.view',
        'supplies.approve', 'supplies.create', 'supplies.manage', 'supplies.view',
        'system.config', 'system.logs', 'system.security',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.apply', 'travel.approve', 'travel.create', 'travel.manage', 'travel.view',
        'user.create', 'user.delete', 'user.edit', 'user.view',
      ],
      // ── Super Admin ──────────────────────────────────────────────────────
      'super admin': [
        'admin.manage', 'assets.manage',
        'analytics.export', 'analytics.view',
        'attendance.edit', 'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.create', 'employee.delete', 'employee.edit', 'employee.view', 'employees.view',
        'equipment.approve', 'equipment.create', 'equipment.manage', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.apply', 'leave.credits.approve',
        'leave.credits.view', 'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.approve', 'publications.create', 'publications.manage',
        'publications.request', 'publications.view',
        'recruitment.applications', 'recruitment.manage', 'recruitment.postings', 'recruitment.view',
        'reports.export', 'reports.view',
        'role.manage',
        'settings.edit', 'settings.view',
        'supplies.approve', 'supplies.create', 'supplies.manage', 'supplies.view',
        'system.config', 'system.logs', 'system.security',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.apply', 'travel.approve', 'travel.create', 'travel.manage', 'travel.view',
        'user.create', 'user.delete', 'user.edit', 'user.view',
      ],
      // ── Admin ────────────────────────────────────────────────────────────
      'admin': [
        'admin.manage', 'assets.manage',
        'analytics.export', 'analytics.view',
        'attendance.edit', 'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.create', 'employee.edit', 'employee.view', 'employees.view',
        'equipment.approve', 'equipment.create', 'equipment.manage', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.approve', 'leave.credits.view',
        'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.approve', 'publications.create', 'publications.manage',
        'publications.request', 'publications.view',
        'recruitment.applications', 'recruitment.manage', 'recruitment.postings', 'recruitment.view',
        'reports.export', 'reports.view',
        'role.manage',
        'settings.edit', 'settings.view',
        'supplies.approve', 'supplies.create', 'supplies.manage', 'supplies.view',
        'system.config', 'system.logs', 'system.security',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.apply', 'travel.approve', 'travel.create', 'travel.manage', 'travel.view',
        'user.create', 'user.delete', 'user.edit', 'user.view',
      ],
      // ── HR Manager / hr ──────────────────────────────────────────────────
      'hr': [
        'admin.manage',
        'analytics.export', 'analytics.view',
        'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.create', 'employee.edit', 'employee.view', 'employees.view',
        'equipment.approve', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.approve', 'leave.credits.view',
        'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.manage', 'publications.view',
        'recruitment.manage', 'recruitment.view',
        'reports.export', 'reports.view',
        'supplies.approve', 'supplies.view',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.approve', 'travel.view',
        'user.create', 'user.edit', 'user.view',
      ],
      'hr manager': [
        'admin.manage',
        'analytics.export', 'analytics.view',
        'attendance.export', 'attendance.view', 'attendance.view_all',
        'compliance.manage', 'compliance.view',
        'departments.manage', 'departments.view',
        'directory.view',
        'employee.create', 'employee.edit', 'employee.view', 'employees.view',
        'equipment.approve', 'equipment.view',
        'jobs.manage', 'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.approve', 'leave.credits.view',
        'leave.manage_balance', 'leave.manage_types', 'leave.reject', 'leave.view',
        'learning.manage', 'learning.view',
        'my_info.edit', 'my_info.view',
        'org.manage', 'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.manage', 'publications.view',
        'recruitment.manage', 'recruitment.view',
        'reports.export', 'reports.view',
        'supplies.approve', 'supplies.view',
        'terminations.manage', 'terminations.view',
        'time_attendance.manage',
        'travel.approve', 'travel.view',
        'user.create', 'user.edit', 'user.view',
      ],
      // ── Manager ──────────────────────────────────────────────────────────
      'manager': [
        'analytics.view',
        'attendance.view', 'attendance.view_all',
        'departments.view',
        'directory.view',
        'employee.view', 'employees.view',
        'equipment.view',
        'jobs.view',
        'leave.apply', 'leave.approve', 'leave.credits.apply', 'leave.credits.view',
        'leave.reject', 'leave.view',
        'learning.view',
        'my_info.edit', 'my_info.view',
        'org.view',
        'performance.conduct', 'performance.manage_goals', 'performance.view',
        'publications.request', 'publications.view',
        'reports.view',
        'supplies.view',
        'travel.apply', 'travel.approve', 'travel.view',
      ],
      // ── Employee ─────────────────────────────────────────────────────────
      'employee': [
        'attendance.view',
        'directory.view',
        'employee.view', 'employees.view',
        'equipment.view',
        'leave.apply', 'leave.credits.apply', 'leave.credits.view', 'leave.view',
        'learning.view',
        'my_info.edit', 'my_info.view',
        'publications.request', 'publications.view',
        'supplies.view',
        'travel.apply', 'travel.view',
      ],
      // ── Board Member ─────────────────────────────────────────────────────
      'board member': [
        'analytics.export', 'analytics.view',
        'directory.view',
        'employees.view',
        'leave.view',
        'org.view',
        'performance.view',
        'reports.view',
      ],
      'board_member': [
        'analytics.export', 'analytics.view',
        'directory.view',
        'employees.view',
        'leave.view',
        'org.view',
        'performance.view',
        'reports.view',
      ],
    }

    return rolePermissions[role.toLowerCase()] ?? rolePermissions['employee']
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
        .select('role')
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
        'board member': 'Board Member',
      }
      const roleName = roleDisplayNames[userRole.role.toLowerCase()] ?? userRole.role

      // user_roles.role string → roles.name in the roles table
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
        'board member': 'Board Member',
      }
      // For unknown/future roles, capitalise each word so "new role" → "New Role"
      const rolesTableName = roleNameMap[userRole.role.toLowerCase()]
        ?? userRole.role.replace(/\b\w/g, (c: string) => c.toUpperCase())

      // ── Step 2: query permissions by role name string from the roles table ─
      let permissionCodes: string[] = []
      let dbRoleId: string | null = null
      let dbRoleName: string | null = null
      let dbRoleDescription: string | null = null

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

      // ── Step 3: last-resort hardcoded defaults (should rarely be hit) ────
      if (permissionCodes.length === 0) {
        permissionCodes = this.getDefaultPermissionsByRole(userRole.role)
      }

      return {
        role_id: dbRoleId ?? userRole.role,
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
    
    return roleInfo.permissions.includes('admin.manage')
  }
}
