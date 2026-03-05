import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Employee = Tables<'employees'>
export type UserRole = Tables<'user_roles'>

export type SystemUser = {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
  employee_id?: string
  created_at: string
  updated_at: string
}

export type SystemUserWithRelations = SystemUser & {
  employee?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string | null
    employee_id?: string | null
    department?: { name: string } | null
    job_title?: { title: string } | null
  } | null
}

export type SystemUserInsert = {
  email: string
  role: string
  status?: 'active' | 'inactive' | 'suspended'
  employee_id?: string
}

export type SystemUserUpdate = Partial<SystemUserInsert>

export interface UserFilters {
  search?: string
  role?: string
  status?: string
  department?: string
}

export const userService = {
  async getAll(filters?: UserFilters): Promise<SystemUserWithRelations[]> {
    const supabase = createClient()
    
    console.log('Fetching system users with filters:', filters)
    
    try {
      // Get users from user_roles table with employee information
      let query = supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          updated_at,
          employee:employees(
            id,
            employee_id,
            first_name,
            last_name,
            email,
            status,
            avatar_url,
            department_id,
            job_title_id
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.role) {
        query = query.eq('role', filters.role as any)
      }

      const { data: userRoles, error } = await query
      
      if (error) {
        console.error('Error fetching user roles:', error)
        if (error.message?.includes('relation "user_roles" does not exist')) {
          console.warn('User roles table does not exist.')
          return []
        }
        throw error
      }

      // For users without linked employees, we need to fetch their emails from auth.users
      // We'll make a separate API call to get auth user data
      const userRolesData = userRoles || []
      console.log('Total user roles fetched:', userRolesData.length)
      
      const usersWithoutEmployee = userRolesData.filter((ur: any) => !ur.employee)
      console.log('Users without employee link:', usersWithoutEmployee.length)
      
      // Fetch auth user emails for users without employee links
      let authUsersMap: { [key: string]: { email: string } } = {}
      if (usersWithoutEmployee.length > 0 && typeof window !== 'undefined') {
        try {
          console.log('Fetching auth emails for users:', usersWithoutEmployee.map((ur: any) => ur.user_id))
          
          // Call our API route to get auth user emails
          const response = await fetch('/api/users/auth-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userIds: usersWithoutEmployee.map((ur: any) => ur.user_id) 
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            authUsersMap = data.users || {}
            console.log('Auth users map:', authUsersMap)
          } else {
            console.error('Failed to fetch auth emails:', response.status, response.statusText)
          }
        } catch (err) {
          console.error('Could not fetch auth user emails:', err)
        }
      }

      // Bulk-fetch departments and job_titles to resolve relations without ambiguous joins
      const departmentIds = [...new Set(
        userRolesData
          .map((ur: any) => ur.employee?.department_id)
          .filter(Boolean)
      )]
      const jobTitleIds = [...new Set(
        userRolesData
          .map((ur: any) => ur.employee?.job_title_id)
          .filter(Boolean)
      )]

      const [deptResult, jtResult] = await Promise.all([
        departmentIds.length > 0
          ? supabase.from('departments').select('id, name').in('id', departmentIds)
          : Promise.resolve({ data: [] }),
        jobTitleIds.length > 0
          ? supabase.from('job_titles').select('id, title').in('id', jobTitleIds)
          : Promise.resolve({ data: [] }),
      ])

      const deptMap: Record<string, string> = {}
      for (const d of (deptResult.data || [])) {
        deptMap[(d as any).id] = (d as any).name
      }
      const jtMap: Record<string, string> = {}
      for (const jt of (jtResult.data || [])) {
        jtMap[(jt as any).id] = (jt as any).title
      }

      // Transform data to match SystemUserWithRelations interface
      const users: SystemUserWithRelations[] = userRolesData.map((userRole: any) => {
        const employee = userRole.employee
        const authUser = authUsersMap[userRole.user_id]
        
        const email = employee?.email || authUser?.email || `user-${userRole.user_id.substring(0, 8)}@system.local`
        const name = employee 
          ? `${employee.first_name} ${employee.last_name}` 
          : authUser?.email?.split('@')[0] || `User ${userRole.user_id.substring(0, 8)}`
        
        const deptName = employee?.department_id ? deptMap[employee.department_id] : undefined
        const jtTitle = employee?.job_title_id ? jtMap[employee.job_title_id] : undefined

        return {
          id: userRole.user_id,
          email,
          name,
          role: userRole.role,
          status: employee?.status === 'active' ? 'active' : 'active', // Default to active if no employee
          employee_id: employee?.employee_id || null,
          created_at: userRole.created_at,
          updated_at: userRole.updated_at,
          employee: employee ? {
            id: employee.id,
            employee_id: employee.employee_id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            avatar_url: employee.avatar_url,
            department: deptName ? { name: deptName } : null,
            job_title: jtTitle ? { title: jtTitle } : null,
          } : null
        }
      })

      // Apply client-side filters
      let filteredUsers = users
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.employee?.job_title?.title || '').toLowerCase().includes(searchLower)
        )
      }

      if (filters?.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status)
      }

      if (filters?.department && filters.department !== '') {
        filteredUsers = filteredUsers.filter(user => 
          user.employee?.department?.name === filters.department
        )
      }

      console.log('Fetched system users:', filteredUsers)
      return filteredUsers
    } catch (error) {
      console.error('Error in user service:', error)
      return []
    }
  },

  async getById(id: string): Promise<SystemUserWithRelations | null> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          updated_at,
          employee:employees(
            id,
            employee_id,
            first_name,
            last_name,
            email,
            status,
            avatar_url,
            department_id,
            job_title_id
          )
        `)
        .eq('user_id', id)
        .single()
      
      if (error) {
        console.error('Error fetching user:', error)
        return null
      }

      const employee = (data as any).employee
      const name = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown User'
      
      return {
        id: data.user_id,
        email: employee?.email || 'no-email@system.local',
        name,
        role: data.role,
        status: employee?.status === 'active' ? 'active' : 'inactive',
        employee_id: employee?.employee_id,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
        employee: employee ? {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          avatar_url: employee.avatar_url,
          department: null, // Not fetching to avoid relationship ambiguity
          job_title: null   // Not fetching to avoid relationship ambiguity
        } : null
      }
    } catch (error) {
      console.error('Error in getById user:', error)
      return null
    }
  },

  async create(userData: SystemUserInsert): Promise<SystemUserWithRelations> {
    try {
      // Call API route to create user with auth
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          role: userData.role,
          employee_id: userData.employee_id || null,
          status: userData.status || 'active'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      console.log('User created successfully:', result.data)
      return result.data
    } catch (error) {
      console.error('Error in create user:', error)
      throw error
    }
  },

  async update(id: string, userData: SystemUserUpdate): Promise<SystemUserWithRelations> {
    try {
      // Call API route to update user (handles password changes via admin API)
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...userData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      console.log('User updated successfully:', result.data)
      return result.data
    } catch (error) {
      console.error('Error in update user:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Use API route with admin client to delete auth user and user_role
      const response = await fetch(`/api/users/delete?userId=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      console.log('User deleted successfully')
    } catch (error) {
      console.error('Error in delete user:', error)
      throw error
    }
  },

  async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const supabase = createClient()
    
    try {
      // Update the employee status if linked
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('employee_id')
        .eq('user_id', id)
        .single()

      if ((userRole as any)?.employee_id) {
        await supabase
          .from('employees')
          .update({
            status: status === 'active' ? 'active' : 'inactive'
          } as any)
          .eq('id', (userRole as any).employee_id)
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      throw error
    }
  }
}