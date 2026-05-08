import { createClient } from '../lib/supabase/client'

export interface Role {
  id: string
  name: string
  description: string | null
  is_system_role: boolean
  status: string
  permissions?: Permission[]
  user_count?: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  code: string
  category: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
  user_count: number
}

export interface RoleInsert {
  name: string
  description?: string
  status?: string
}

export interface RoleUpdate {
  name?: string
  description?: string
  status?: string
}

export const rbacService = {
  // Roles
  async getAllRoles(): Promise<RoleWithPermissions[]> {
    const supabase = createClient()
    
    try {
      // Get roles with their permissions
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions (
            permission:permissions (*)
          )
        `)
        .order('name')

      if (rolesError) throw rolesError

      // Get user counts for each role
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role')

      if (userRolesError) throw userRolesError

      // Count users per role (user_roles.role stores lowercase strings like 'admin','hr','manager','employee')
      // Build a case-insensitive map: role name -> role string -> count
      const roleCounts: { [key: string]: number } = {}
      userRoles.forEach((ur: any) => {
        const key = (ur.role || '').toLowerCase()
        roleCounts[key] = (roleCounts[key] || 0) + 1
      })

      // Map roles.name → user_roles.role stored string values
      const roleNameToKey: Record<string, string> = {
        'super admin': 'super admin',
        'admin': 'admin',
        'hr manager': 'hr',
        'manager': 'manager',
        'employee': 'employee',
        'executive director': 'ed',
        'board member': 'board_member',
        'board of trustees': 'board_member',
      }

      // Transform data
      const transformedRoles: RoleWithPermissions[] = (roles || []).map((role: any) => {
        const key = roleNameToKey[role.name.toLowerCase()] ?? role.name.toLowerCase().replace(/\s+/g, '_')
        return {
          ...role,
          permissions: role.role_permissions?.map((rp: any) => rp.permission) || [],
          user_count: roleCounts[key] || 0
        }
      })

      return transformedRoles
    } catch (error) {
      console.error('Error fetching roles:', error)
      return []
    }
  },

  async createRole(data: RoleInsert): Promise<Role> {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async updateRole(id: string, data: RoleUpdate): Promise<Role> {
    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async deleteRole(id: string): Promise<void> {
    const res = await fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },

  // Permissions
  async getAllPermissions(): Promise<Permission[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error
    return (data || []) as any
  },

  async getPermissionsByCategory(): Promise<{ [key: string]: Permission[] }> {
    const permissions = await this.getAllPermissions()
    
    const grouped: { [key: string]: Permission[] } = {}
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = []
      }
      grouped[permission.category].push(permission)
    })
    
    return grouped
  },

  // Role Permissions
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const res = await fetch('/api/admin/roles/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissionIds }),
    })
    if (!res.ok) throw new Error(await res.text())
  },

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions (*)
      `)
      .eq('role_id', roleId)

    if (error) throw error
    return (data || []).map((rp: any) => rp.permission)
  }
}
