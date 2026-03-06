import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type LeavePolicy = Tables<'leave_policies'>
export type LeavePolicyInsert = InsertTables<'leave_policies'>
export type LeavePolicyUpdate = UpdateTables<'leave_policies'>

export type LeaveBalance = Tables<'leave_balances'>
export type LeaveBalanceInsert = InsertTables<'leave_balances'>
export type LeaveBalanceUpdate = UpdateTables<'leave_balances'>

export type LeavePolicyWithRelations = LeavePolicy & {
  department?: { id: string; name: string } | null
  employment_type?: { id: string; name: string } | null
}

export type LeaveBalanceWithRelations = LeaveBalance & {
  employee?: { 
    id: string
    first_name: string
    last_name: string
    email: string
    employee_id: string | null
  } | null
  leave_type?: { id: string; name: string } | null
  leave_policy?: { id: string; name: string } | null
}

export interface LeavePolicyFilters {
  department_id?: string
  employment_type_id?: string
  is_active?: boolean
  applies_to_all?: boolean
}

export interface LeaveBalanceFilters {
  employee_id?: string
  leave_type_id?: string
  period_start?: string
  period_end?: string
}

export const leavePolicyService = {
  // Leave Policies CRUD
  async getAll(filters?: LeavePolicyFilters): Promise<LeavePolicyWithRelations[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('leave_policies')
      .select(`
        *,
        department:departments(id, name),
        employment_type:employment_types(id, name)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    if (filters?.employment_type_id) {
      query = query.eq('employment_type_id', filters.employment_type_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.applies_to_all !== undefined) {
      query = query.eq('applies_to_all', filters.applies_to_all)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching leave policies:', error)
      throw error
    }
    
    return (data || []) as any
  },

  async getById(id: string): Promise<LeavePolicyWithRelations> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_policies')
      .select(`
        *,
        department:departments(id, name),
        employment_type:employment_types(id, name)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching leave policy:', error)
      throw error
    }
    
    return data as any
  },

  async create(policy: LeavePolicyInsert): Promise<LeavePolicy> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_policies')
      .insert(policy as any)
      .select()
    
    if (error) {
      console.error('Error creating leave policy:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Leave policy not found after creation')
    }
    
    return Array.isArray(data) ? data[0] : data
  },

  async update(id: string, policy: LeavePolicyUpdate): Promise<LeavePolicy> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_policies')
      .update(policy)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Error updating leave policy:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Leave policy not found')
    }
    
    return Array.isArray(data) ? data[0] : data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('leave_policies')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting leave policy:', error)
      throw error
    }
  },

  // Leave Balances CRUD
  async getAllBalances(filters?: LeaveBalanceFilters): Promise<LeaveBalanceWithRelations[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('leave_balances')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, employee_id),
        leave_type:leave_types(id, name),
        leave_policy:leave_policies(id, name)
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id)
    }
    if (filters?.period_start) {
      query = query.gte('period_end', filters.period_start)
    }
    if (filters?.period_end) {
      query = query.lte('period_start', filters.period_end)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching leave balances:', error)
      throw error
    }
    
    return (data || []) as any
  },

  async getBalanceById(id: string): Promise<LeaveBalanceWithRelations> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, employee_id),
        leave_type:leave_types(id, name),
        leave_policy:leave_policies(id, name)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching leave balance:', error)
      throw error
    }
    
    return data as any
  },

  async getEmployeeBalance(
    employeeId: string,
    leaveTypeId: string,
    periodStart?: string
  ): Promise<LeaveBalance | null> {
    const supabase = createClient()
    
    let query = supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
    
    if (periodStart) {
      query = query.eq('period_start', periodStart)
    } else {
      // Get current period balance
      const now = new Date().toISOString()
      query = query.lte('period_start', now).gte('period_end', now)
    }
    
    const { data, error } = await query.single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No balance found
        return null
      }
      console.error('Error fetching employee balance:', error)
      throw error
    }
    
    return data as any
  },

  async createBalance(balance: LeaveBalanceInsert): Promise<LeaveBalance> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_balances')
      .insert(balance as any)
      .select()
    
    if (error) {
      console.error('Error creating leave balance:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Leave balance not found after creation')
    }
    
    return Array.isArray(data) ? data[0] : data
  },

  async updateBalance(id: string, balance: LeaveBalanceUpdate): Promise<LeaveBalance> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leave_balances')
      .update(balance)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Error updating leave balance:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Leave balance not found')
    }
    
    return Array.isArray(data) ? data[0] : data
  },

  async deleteBalance(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('leave_balances')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting leave balance:', error)
      throw error
    }
  },

  // Utility Functions
  async initializeEmployeeBalances(
    employeeId: string,
    policyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    const supabase = createClient()
    
    // Get policy details
    const policy = await this.getById(policyId)
    
    // Get all leave types
    const { data: leaveTypes, error: typesError } = await supabase
      .from('leave_types')
      .select('id, leave_type_name')
    
    if (typesError) throw typesError
    
    // Create balances for each leave type based on policy
    const balances: LeaveBalanceInsert[] = []
    
    for (const leaveType of leaveTypes || []) {
      let allocatedDays = 0
      
      // Map leave type to policy days
      const ltName = (leaveType.leave_type_name ?? '').toLowerCase()
      if (ltName.includes('annual') || ltName.includes('vacation')) {
        allocatedDays = policy.annual_leave_days || 0
      } else if (ltName.includes('sick')) {
        allocatedDays = policy.sick_leave_days || 0
      } else if (ltName.includes('personal')) {
        allocatedDays = policy.personal_leave_days || 0
      }
      
      balances.push({
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year: new Date(periodStart).getFullYear(),
        total_allocated: allocatedDays,
        used_days: 0,
        pending_days: 0,
        carried_over: 0,
      })
    }
    
    const { error } = await supabase
      .from('leave_balances')
      .insert(balances as any)
    
    if (error) {
      console.error('Error initializing employee balances:', error)
      throw error
    }
  },

  async applyPolicyToEmployees(
    policyId: string,
    employeeIds: string[],
    periodStart: string,
    periodEnd: string
  ): Promise<void> {
    for (const employeeId of employeeIds) {
      await this.initializeEmployeeBalances(employeeId, policyId, periodStart, periodEnd)
    }
  },
}
