import { createClient } from '@/lib/supabase/client'

// =============================================
// TYPES
// =============================================

export interface LeaveType {
  id: string
  leave_type_name: string
  leave_type_code: string
  description?: string
  category: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other'
  is_paid: boolean
  requires_approval: boolean
  color_code: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccrualRule {
  id: string
  rule_name: string
  rule_code: string
  leave_type_id: string
  accrual_frequency: 'monthly' | 'annually' | 'per_pay_period' | 'on_hire'
  accrual_rate: number
  max_balance?: number
  carry_over_enabled: boolean
  max_carry_over?: number
  waiting_period_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  leave_type?: LeaveType
}

export interface LeavePolicyConfig {
  id: string
  policy_name: string
  policy_code: string
  leave_type_id?: string
  eligibility_criteria?: string
  min_service_months: number
  requires_approval: boolean
  max_consecutive_days?: number
  min_notice_days: number
  blackout_period_enabled: boolean
  can_split_leave: boolean
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  leave_type?: LeaveType
}

export interface Holiday {
  id: string
  holiday_name: string
  holiday_date: string
  holiday_type: 'regular' | 'special_non_working' | 'special_working'
  description?: string
  is_recurring: boolean
  is_paid: boolean
  is_mandatory: boolean
  year: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AbsenceCategory {
  id: string
  category_name: string
  category_code: string
  category_type: 'unauthorized' | 'lateness' | 'early_departure' | 'medical' | 'emergency' | 'other'
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  affects_pay: boolean
  requires_approval: boolean
  max_occurrences_per_month?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApprovalWorkflow {
  id: string
  workflow_name: string
  workflow_code: string
  leave_type_id?: string
  workflow_steps: any[]
  is_sequential: boolean
  escalation_enabled: boolean
  escalation_days?: number
  priority: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  leave_type?: LeaveType
}

// =============================================
// LEAVE TYPES SERVICE
// =============================================
export const leaveTypeService = {
  async getAll(filters?: { category?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('leave_types')
      .select('*')
      .order('display_order', { ascending: true })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as LeaveType[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as LeaveType
  },

  async create(leaveType: Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .insert(leaveType as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as LeaveType
  },

  async update(id: string, leaveType: Partial<LeaveType>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .update(leaveType)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as LeaveType
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('leave_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// =============================================
// ACCRUAL RULES SERVICE
// =============================================
export const accrualRuleService = {
  async getAll(filters?: { leave_type_id?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('accrual_rules')
      .select('*, leave_type:leave_types(*)')
      .order('rule_name', { ascending: true })

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as (AccrualRule & { leave_type: LeaveType })[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accrual_rules')
      .select('*, leave_type:leave_types(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as AccrualRule & { leave_type: LeaveType }
  },

  async create(rule: Omit<AccrualRule, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accrual_rules')
      .insert(rule as any)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as AccrualRule & { leave_type: LeaveType }
  },

  async update(id: string, rule: Partial<AccrualRule>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accrual_rules')
      .update(rule)
      .eq('id', id)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as AccrualRule & { leave_type: LeaveType }
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('accrual_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// =============================================
// LEAVE POLICY CONFIGS SERVICE
// =============================================
export const leavePolicyConfigService = {
  async getAll(filters?: { leave_type_id?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('leave_policy_configs')
      .select('*, leave_type:leave_types(*)')
      .order('policy_name', { ascending: true })

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as (LeavePolicyConfig & { leave_type: LeaveType })[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_policy_configs')
      .select('*, leave_type:leave_types(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as LeavePolicyConfig & { leave_type: LeaveType }
  },

  async create(policy: Omit<LeavePolicyConfig, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_policy_configs')
      .insert(policy as any)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as LeavePolicyConfig & { leave_type: LeaveType }
  },

  async update(id: string, policy: Partial<LeavePolicyConfig>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_policy_configs')
      .update(policy)
      .eq('id', id)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as LeavePolicyConfig & { leave_type: LeaveType }
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('leave_policy_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async setDefault(id: string) {
    const supabase = createClient()
    
    // First, unset all defaults
    await supabase
      .from('leave_policy_configs')
      .update({ is_default: false })
      .eq('is_default', true)

    // Then set the selected policy as default
    const { data, error } = await supabase
      .from('leave_policy_configs')
      .update({ is_default: true })
      .eq('id', id)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as LeavePolicyConfig & { leave_type: LeaveType }
  },
}

// =============================================
// HOLIDAYS SERVICE
// =============================================
export const holidayService = {
  async getAll(filters?: { year?: number; holiday_type?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('holidays')
      .select('*')
      .order('holiday_date', { ascending: true })

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }
    if (filters?.holiday_type) {
      query = query.eq('holiday_type', filters.holiday_type)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as Holiday[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as Holiday
  },

  async create(holiday: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('holidays')
      .insert(holiday as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Holiday
  },

  async update(id: string, holiday: Partial<Holiday>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('holidays')
      .update(holiday)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Holiday
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// =============================================
// ABSENCE CATEGORIES SERVICE
// =============================================
export const absenceCategoryService = {
  async getAll(filters?: { category_type?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('absence_categories')
      .select('*')
      .order('category_name', { ascending: true })

    if (filters?.category_type) {
      query = query.eq('category_type', filters.category_type)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as AbsenceCategory[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('absence_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as AbsenceCategory
  },

  async create(category: Omit<AbsenceCategory, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('absence_categories')
      .insert(category as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as AbsenceCategory
  },

  async update(id: string, category: Partial<AbsenceCategory>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('absence_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as AbsenceCategory
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('absence_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// =============================================
// APPROVAL WORKFLOWS SERVICE
// =============================================
export const approvalWorkflowService = {
  async getAll(filters?: { leave_type_id?: string; is_active?: boolean }) {
    const supabase = createClient()
    let query = supabase
      .from('leave_approval_workflows')
      .select('*, leave_type:leave_types(*)')
      .order('priority', { ascending: false })

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as (ApprovalWorkflow & { leave_type?: LeaveType })[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_approval_workflows')
      .select('*, leave_type:leave_types(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as ApprovalWorkflow & { leave_type?: LeaveType }
  },

  async create(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_approval_workflows')
      .insert(workflow as any)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as ApprovalWorkflow & { leave_type?: LeaveType }
  },

  async update(id: string, workflow: Partial<ApprovalWorkflow>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_approval_workflows')
      .update(workflow as any)
      .eq('id', id)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as ApprovalWorkflow & { leave_type?: LeaveType }
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error} = await supabase
      .from('leave_approval_workflows')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async setDefault(id: string) {
    const supabase = createClient()
    
    // First, unset all defaults
    await supabase
      .from('leave_approval_workflows')
      .update({ is_default: false })
      .eq('is_default', true)

    // Then set the selected workflow as default
    const { data, error } = await supabase
      .from('leave_approval_workflows')
      .update({ is_default: true })
      .eq('id', id)
      .select('*, leave_type:leave_types(*)')
      .single()

    if (error) throw error
    return data as unknown as ApprovalWorkflow & { leave_type?: LeaveType }
  },
}
