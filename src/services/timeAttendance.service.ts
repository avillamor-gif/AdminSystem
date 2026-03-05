import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// =====================================================
// TYPES
// =====================================================

export type WorkSchedule = {
  id: string
  name: string
  description: string | null
  schedule_type: 'fixed' | 'flexible' | 'rotating' | 'compressed'
  hours_per_week: number
  days_per_week: number
  is_active: boolean
  is_default: boolean
  effective_from: string | null
  effective_to: string | null
  created_at: string
  updated_at: string
}

export type WorkScheduleDay = {
  id: string
  schedule_id: string
  day_of_week: number
  is_working_day: boolean
  start_time: string | null
  end_time: string | null
  break_minutes: number
  total_hours: number | null
}

export type ShiftPattern = {
  id: string
  name: string
  description: string | null
  shift_code: string
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night' | 'rotating' | 'split'
  start_time: string
  end_time: string
  duration_hours: number | null
  break_minutes: number
  color_code: string | null
  is_active: boolean
  overnight: boolean
  created_at: string
  updated_at: string
}

export type OvertimeRule = {
  id: string
  name: string
  description: string | null
  rule_type: 'daily' | 'weekly' | 'monthly' | 'holiday' | 'weekend'
  threshold_hours: number | null
  multiplier: number
  applies_to: 'all' | 'non_exempt' | 'hourly'
  requires_approval: boolean
  auto_calculate: boolean
  priority: number
  is_active: boolean
  effective_from: string | null
  effective_to: string | null
  created_at: string
  updated_at: string
}

export type BreakPolicy = {
  id: string
  name: string
  description: string | null
  break_type: 'meal' | 'rest' | 'prayer' | 'smoking' | 'custom'
  duration_minutes: number
  is_paid: boolean
  is_mandatory: boolean
  minimum_shift_hours: number | null
  applies_after_hours: number | null
  max_breaks_per_day: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TimeTrackingMethod = {
  id: string
  name: string
  description: string | null
  method_type: 'biometric' | 'rfid' | 'mobile_app' | 'web_portal' | 'manual' | 'geofence' | 'qr_code'
  requires_photo: boolean
  requires_location: boolean
  geofence_radius_meters: number | null
  geofence_latitude: number | null
  geofence_longitude: number | null
  allowed_ip_addresses: string[] | null
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export type AttendancePolicy = {
  id: string
  name: string
  description: string | null
  policy_type: 'punctuality' | 'absence' | 'tardiness' | 'early_departure' | 'general'
  late_threshold_minutes: number
  late_action: 'warning' | 'deduction' | 'half_day' | 'nothing' | null
  grace_period_minutes: number
  max_consecutive_absences: number
  absence_requires_proof: boolean
  proof_required_after_days: number
  early_departure_threshold_minutes: number
  requires_manager_approval: boolean
  min_hours_for_full_day: number
  min_hours_for_half_day: number
  auto_mark_absent_if_no_punch: boolean
  is_active: boolean
  is_default: boolean
  effective_from: string | null
  effective_to: string | null
  created_at: string
  updated_at: string
}

export type EmployeeSchedule = {
  id: string
  employee_id: string
  schedule_id: string
  effective_from: string
  effective_to: string | null
  assigned_at: string
  notes: string | null
  schedule?: WorkSchedule
  employee?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
}

// =====================================================
// WORK SCHEDULES SERVICE
// =====================================================

export const workScheduleService = {
  async getAll(): Promise<WorkSchedule[]> {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .order('name')
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<WorkSchedule | null> {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async getDays(scheduleId: string): Promise<WorkScheduleDay[]> {
    const { data, error } = await supabase
      .from('work_schedule_days' as any)
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_of_week')
    
    if (error) throw error
    return (data || []) as any
  },

  async create(schedule: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const { data, error } = await supabase
      .from('work_schedules')
      .insert(schedule as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async createDay(day: Partial<WorkScheduleDay>): Promise<WorkScheduleDay> {
    const { data, error } = await supabase
      .from('work_schedule_days' as any)
      .insert(day as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const { data, error } = await supabase
      .from('work_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_schedules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async setDefault(id: string): Promise<WorkSchedule> {
    // First, unset all defaults
    await supabase
      .from('work_schedules')
      .update({ is_default: false })
      .eq('is_default', true)

    // Then set the new default
    const { data, error } = await supabase
      .from('work_schedules')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async getEmployeeSchedules(employeeId: string): Promise<EmployeeSchedule[]> {
    const { data, error } = await supabase
      .from('employee_schedules' as any)
      .select(`
        *,
        schedule:work_schedules(*),
        employee:employees(id, first_name, last_name, employee_id)
      `)
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false })
    
    if (error) throw error
    return (data || []) as any
  },

  async assignToEmployee(assignment: Partial<EmployeeSchedule>): Promise<EmployeeSchedule> {
    const { data, error } = await supabase
      .from('employee_schedules' as any)
      .insert(assignment as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }
}

// =====================================================
// SHIFT PATTERNS SERVICE
// =====================================================

export const shiftPatternService = {
  async getAll(): Promise<ShiftPattern[]> {
    const { data, error } = await supabase
      .from('shift_patterns')
      .select('*')
      .order('name')
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<ShiftPattern | null> {
    const { data, error } = await supabase
      .from('shift_patterns')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(shift: Partial<ShiftPattern>): Promise<ShiftPattern> {
    const { data, error } = await supabase
      .from('shift_patterns')
      .insert(shift as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<ShiftPattern>): Promise<ShiftPattern> {
    const { data, error } = await supabase
      .from('shift_patterns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_patterns')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// OVERTIME RULES SERVICE
// =====================================================

export const overtimeRuleService = {
  async getAll(): Promise<OvertimeRule[]> {
    const { data, error } = await supabase
      .from('overtime_rules')
      .select('*')
      .order('priority', { ascending: false })
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<OvertimeRule | null> {
    const { data, error } = await supabase
      .from('overtime_rules')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(rule: Partial<OvertimeRule>): Promise<OvertimeRule> {
    const { data, error } = await supabase
      .from('overtime_rules')
      .insert(rule as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<OvertimeRule>): Promise<OvertimeRule> {
    const { data, error } = await supabase
      .from('overtime_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('overtime_rules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// BREAK POLICIES SERVICE
// =====================================================

export const breakPolicyService = {
  async getAll(): Promise<BreakPolicy[]> {
    const { data, error } = await supabase
      .from('break_policies')
      .select('*')
      .order('name')
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<BreakPolicy | null> {
    const { data, error } = await supabase
      .from('break_policies')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(policy: Partial<BreakPolicy>): Promise<BreakPolicy> {
    const { data, error } = await supabase
      .from('break_policies')
      .insert(policy as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<BreakPolicy>): Promise<BreakPolicy> {
    const { data, error } = await supabase
      .from('break_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('break_policies')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// TIME TRACKING METHODS SERVICE
// =====================================================

export const timeTrackingMethodService = {
  async getAll(): Promise<TimeTrackingMethod[]> {
    const { data, error } = await supabase
      .from('time_tracking_methods')
      .select('*')
      .order('priority', { ascending: false })
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<TimeTrackingMethod | null> {
    const { data, error } = await supabase
      .from('time_tracking_methods')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(method: Partial<TimeTrackingMethod>): Promise<TimeTrackingMethod> {
    const { data, error } = await supabase
      .from('time_tracking_methods')
      .insert(method as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<TimeTrackingMethod>): Promise<TimeTrackingMethod> {
    const { data, error } = await supabase
      .from('time_tracking_methods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_tracking_methods')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async setDefault(id: string): Promise<TimeTrackingMethod> {
    // First, unset all other methods as default
    await supabase
      .from('time_tracking_methods')
      .update({ is_default: false })
      .neq('id', id)
    
    // Then set this method as default
    const { data, error } = await supabase
      .from('time_tracking_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }
}

// =====================================================
// ATTENDANCE POLICIES SERVICE
// =====================================================

export const attendancePolicyService = {
  async getAll(): Promise<AttendancePolicy[]> {
    const { data, error } = await supabase
      .from('attendance_policies')
      .select('*')
      .order('name')
    
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<AttendancePolicy | null> {
    const { data, error } = await supabase
      .from('attendance_policies')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(policy: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
    const { data, error } = await supabase
      .from('attendance_policies')
      .insert(policy as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
    const { data, error } = await supabase
      .from('attendance_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_policies')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async setDefault(id: string): Promise<AttendancePolicy> {
    // First, unset all other policies as default
    await supabase
      .from('attendance_policies')
      .update({ is_default: false })
      .neq('id', id)
    
    // Then set this policy as default
    const { data, error } = await supabase
      .from('attendance_policies')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async assignToEmployee(assignment: { employee_id: string; policy_id: string; effective_from: string }) {
    const { data, error } = await supabase
      .from('employee_attendance_policies' as any)
      .insert(assignment as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }
}
