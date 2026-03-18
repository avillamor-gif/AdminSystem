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
        'internship.manage',
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
        'internship.manage',
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
        'internship.manage',
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
        'internship.manage',
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
        'internship.manage',
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
        'internship.manage',
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
      // ── Board of Trustees ──────────────────────────────────────────────────
      'board member': [
        'analytics.export', 'analytics.view',
        'directory.view',
        'employees.view',
        'leave.view',
        'org.view',
        'performance.view',
        'reports.view',
      ],
      'board of trustees': [
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
   * Get current user's permissions — aggregates across ALL assigned roles
   * (multi-role support via user_role_assignments table).
   *
   * Strategy (in order):
   *  1. Fetch all role assignments from user_role_assignments for this user.
   *  2. Also include the legacy user_roles.role as a role name lookup.
   *  3. Union all permissions from every assigned role.
   *  4. Only if the DB returns nothing at all, use hardcoded defaults.
   */
  async getCurrentUserPermissions(): Promise<UserRoleInfo | null> {
    const supabase = createClient()

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return null

      // ── Step 1: get the legacy role row (primary role for display) ────────
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
        'board_member': 'Board of Trustees',
        'board member': 'Board of Trustees',
        'intern': 'Intern',
        'volunteer': 'Volunteer',
        'consultant': 'Consultant',
      }
      const primaryRoleName = roleDisplayNames[userRole.role.toLowerCase()] ?? userRole.role

      // ── Step 2: fetch ALL role assignments (multi-role) ───────────────────
      const { data: assignments } = await supabase
        .from('user_role_assignments' as any)
        .select('role_id')
        .eq('user_id', user.id)

      let permissionCodes: string[] = []
      let dbRoleId: string | null = null
      let dbRoleName: string | null = null
      let dbRoleDescription: string | null = null

      if (assignments && assignments.length > 0) {
        // Fetch permissions for all assigned roles at once
        const roleIds = (assignments as any[]).map((a: any) => a.role_id)

        const { data: rolesData } = await supabase
          .from('roles' as any)
          .select('id, name, description, role_permissions(permission:permissions(code))')
          .in('id', roleIds)
          .eq('status', 'active')

        if (rolesData && (rolesData as any[]).length > 0) {
          const allCodes = new Set<string>()
          for (const role of rolesData as any[]) {
            for (const rp of role.role_permissions ?? []) {
              if (rp.permission?.code) allCodes.add(rp.permission.code)
            }
          }
          permissionCodes = Array.from(allCodes)

          // Primary role for display = the one matching the legacy enum value
          const primaryRoleData = (rolesData as any[]).find(
            r => r.name.toLowerCase() === primaryRoleName.toLowerCase()
          ) ?? (rolesData as any[])[0]
          dbRoleId = primaryRoleData.id
          dbRoleName = primaryRoleData.name
          dbRoleDescription = primaryRoleData.description
        }
      }

      // ── Step 3: fallback — look up by primary role name directly ──────────
      if (permissionCodes.length === 0) {
        const roleNameMap: Record<string, string> = {
          'admin': 'Admin', 'hr': 'HR Manager', 'hr manager': 'HR Manager',
          'manager': 'Manager', 'employee': 'Employee', 'ed': 'Executive Director',
          'executive director': 'Executive Director', 'super admin': 'Super Admin',
          'board_member': 'Board of Trustees', 'board member': 'Board of Trustees',
          'intern': 'Intern', 'volunteer': 'Volunteer', 'consultant': 'Consultant',
        }
        const rolesTableName = roleNameMap[userRole.role.toLowerCase()]
          ?? userRole.role.replace(/\b\w/g, (c: string) => c.toUpperCase())

        const { data: roleRow } = await supabase
          .from('roles' as any)
          .select('id, name, description, role_permissions(permission:permissions(code))')
          .eq('name', rolesTableName)
          .eq('status', 'active')
          .single()

        if (roleRow) {
          const r = roleRow as any
          dbRoleId = r.id
          dbRoleName = r.name
          dbRoleDescription = r.description
          permissionCodes = (r.role_permissions ?? [])
            .map((rp: any) => rp.permission?.code)
            .filter(Boolean)
        }
      }

      // ── Step 4: last-resort hardcoded defaults ────────────────────────────
      if (permissionCodes.length === 0) {
        permissionCodes = this.getDefaultPermissionsByRole(userRole.role)
      }

      return {
        role_id: dbRoleId ?? userRole.role,
        role_name: dbRoleName ?? primaryRoleName,
        role_description: dbRoleDescription ?? `${primaryRoleName} role`,
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
