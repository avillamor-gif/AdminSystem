import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface EmployeeAuditLog {
  id: string
  employee_id: string
  action: string
  changed_by: string
  changed_by_user_id: string | null
  details: Record<string, any> | null
  created_at: string
}

export interface EmployeeAuditLogInsert {
  employee_id: string
  action: string
  changed_by?: string
  changed_by_user_id?: string | null
  details?: Record<string, any> | null
}

export const employeeAuditLogService = {
  async getAllByEmployee(employeeId: string): Promise<EmployeeAuditLog[]> {
    const { data, error } = await supabase
      .from('employee_audit_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return (data || []) as unknown as EmployeeAuditLog[]
  },

  async create(log: EmployeeAuditLogInsert): Promise<EmployeeAuditLog> {
    const payload = {
      ...log,
      details: log.details ? JSON.stringify(log.details) : null
    }
    
    const { data, error } = await supabase
      .from('employee_audit_logs')
      .insert(payload as any)
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as EmployeeAuditLog
  },
}
