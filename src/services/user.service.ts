import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = 'admin' | 'hr' | 'manager' | 'employee' | 'board_member'

export interface SystemUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: 'active' | 'inactive'
  employee_id: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface SystemUserWithRelations extends SystemUser {
  employee?: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    employee_id?: string | null
    department?: {
      name: string
    } | null
    job_title?: {
      title: string
    } | null
  } | null
}

export interface SystemUserInsert {
  email: string
  name?: string
  role: UserRole
  status?: 'active' | 'inactive'
  employee_id?: string | null
  password?: string
}

export interface SystemUserUpdate {
  email?: string
  name?: string
  role?: UserRole
  status?: 'active' | 'inactive'
  employee_id?: string | null
  password?: string
}

export interface UserFilters {
  search?: string
  role?: string
  status?: string
  department?: string
}

async function getAll(filters?: UserFilters): Promise<SystemUserWithRelations[]> {
  try {
    console.log('Fetching users from API with filters:', filters)
    
    // Build query params
    const params = new URLSearchParams()
    if (filters?.role) params.append('role', filters.role)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.department) params.append('department', filters.department)
    
    const response = await fetch(`/api/admin/users?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }
    
    const users = await response.json()
    console.log('Fetched users from API:', users.length)
    
    return users
    
  } catch (error) {
    console.error('Error in getAll users:', error)
    throw error
  }
}

async function getById(id: string): Promise<SystemUserWithRelations | null> {
  const supabase = createClient()
  
  try {
    console.log('Fetching user by id:', id)
    
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        email,
        employee_id,
        created_at,
        updated_at,
        employees:employee_id (
          id,
          first_name,
          last_name,
          avatar_url,
          department_id,
          job_title_id
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    if (!userRole) return null
    
    const ur = userRole as any
    const employee = ur.employees
    const email = ur.email || employee?.email || 'unknown@example.com'
    
    return {
      id: ur.id,
      email: email,
      name: employee ? `${employee.first_name} ${employee.last_name}` : email.split('@')[0],
      role: ur.role,
      status: 'active',
      employee_id: ur.employee_id,
      last_login: null,
      created_at: ur.created_at,
      updated_at: ur.updated_at,
      employee: employee ? {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_url: employee.avatar_url,
        department: null,
        job_title: null,
      } : null
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

async function create(userData: SystemUserInsert): Promise<SystemUserWithRelations> {
  const supabase = createClient()
  
  try {
    console.log('Creating user:', userData)
    
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || Math.random().toString(36).slice(-12) + 'A1!',
      email_confirm: true,
      user_metadata: {
        name: userData.name || userData.email.split('@')[0]
      }
    })
    
    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create auth user')
    
    // Create user_role entry
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: userData.role,
        employee_id: userData.employee_id || null
      })
      .select(`
        id,
        user_id,
        role,
        employee_id,
        created_at,
        updated_at
      `)
      .single()
    
    if (roleError) throw roleError
    
    return {
      id: userRole.id,
      email: authData.user.email!,
      name: userData.name || authData.user.email!.split('@')[0],
      role: userRole.role,
      status: 'active',
      employee_id: userRole.employee_id,
      last_login: null,
      created_at: userRole.created_at ?? '',
      updated_at: userRole.updated_at ?? '',
      employee: null
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

async function update(id: string, userData: SystemUserUpdate): Promise<SystemUserWithRelations> {
  const supabase = createClient()
  
  try {
    console.log('Updating user:', id, userData)
    
    // Build update object — only columns that exist in user_roles:
    // id, user_id, role, employee_id, created_at, updated_at
    // NOTE: no 'status', 'email' columns in this table
    const updateFields: any = {
      updated_at: new Date().toISOString()
    }
    
    if (userData.role !== undefined) {
      updateFields.role = userData.role
    }
    
    // Allow null to explicitly clear the employee link
    if ('employee_id' in userData) {
      updateFields.employee_id = userData.employee_id ?? null
    }
    
    console.log('Update fields:', updateFields)
    
    // Update user_role — use select('*') to avoid PGRST200 join errors
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error updating user_role:', error)
      throw error
    }
    
    console.log('User role updated:', userRole)

    // Update password/email via API route if provided (auth.admin not available in browser client)
    if (userData.password || userData.email) {
      try {
        await fetch('/api/admin/users/update-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userRole.user_id,
            email: userData.email,
            password: userData.password,
          }),
        })
      } catch (authUpdateErr) {
        console.warn('Auth update failed (non-critical):', authUpdateErr)
      }
    }

    // Fetch linked employee separately (avoid join alias PGRST200 risk)
    let employee: any = null
    if (userRole.employee_id) {
      const { data: empData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', userRole.employee_id)
        .single()
      employee = empData ?? null
    }

    const storedEmail = (userRole as any).email || userData.email

    return {
      id: userRole.id,
      email: storedEmail || 'unknown@example.com',
      name: employee ? `${employee.first_name} ${employee.last_name}` : (userData.name || storedEmail?.split('@')[0] || 'Unknown User'),
      role: userRole.role,
      status: 'active',
      employee_id: userRole.employee_id,
      last_login: null,
      created_at: userRole.created_at ?? '',
      updated_at: userRole.updated_at ?? '',
      employee: employee ? {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_url: employee.avatar_url,
        department: null,
        job_title: null,
      } : null
    }
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

async function deleteUser(id: string): Promise<void> {
  const supabase = createClient()
  
  try {
    console.log('Deleting user:', id)
    
    // Get user_id before deleting
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (userRole) {
      // Delete auth user (will cascade to user_roles)
      await supabase.auth.admin.deleteUser(userRole.user_id)
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

async function updateStatus(id: string, status: 'active' | 'inactive'): Promise<SystemUserWithRelations> {
  // For now, status is stored in user_roles or can be added as a column
  // This is a placeholder implementation
  return update(id, { status })
}

export const userService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteUser,
  updateStatus,
}