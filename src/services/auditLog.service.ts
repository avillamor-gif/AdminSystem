import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables } from '@/lib/supabase'

export type AuditLog = Tables<'employee_audit_logs'>
export type AuditLogInsert = InsertTables<'employee_audit_logs'>

/**
 * Fire-and-forget audit log helper.
 * Safe to call from any async context — swallows errors so it never
 * breaks the main action that triggered it.
 */
export async function logAction(params: {
  employee_id: string
  action: string
  details?: string
  changed_by?: string
  changed_by_user_id?: string
}): Promise<void> {
  try {
    const supabase = createClient()

    let changedBy = params.changed_by
    let changedByUserId = params.changed_by_user_id

    if (!changedBy) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        changedByUserId = changedByUserId ?? user.id
        changedBy = user.email ?? user.id
      }
    }

    await supabase.from('employee_audit_logs').insert({
      employee_id: params.employee_id,
      action: params.action,
      changed_by: changedBy ?? 'System',
      changed_by_user_id: changedByUserId ?? null,
      details: params.details ?? null,
    })
  } catch {
    // Never throw — audit logging must not break the main flow
  }
}

export interface AuditLogWithEmployee extends AuditLog {
  employee?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export const auditLogService = {
  /**
   * Get recent audit logs with employee details
   */
  async getRecent(limit = 10): Promise<AuditLogWithEmployee[]> {
    const supabase = createClient()

    // Get recent audit logs
    const { data: logs, error } = await supabase
      .from('employee_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }

    if (!logs || logs.length === 0) {
      return []
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(logs.map((log: any) => log.employee_id).filter(Boolean))]

    // Fetch employee details
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .in('id', employeeIds)

    // Create employee map
    const employeeMap = new Map(
      employees?.map((emp: any) => [emp.id, emp]) || []
    )

    // Enrich logs with employee data
    return logs.map((log: any) => ({
      ...log,
      employee: log.employee_id ? employeeMap.get(log.employee_id) : undefined
    }))
  },

  /**
   * Create an audit log entry
   */
  async create(data: {
    employee_id: string
    action: string
    changed_by: string
    changed_by_user_id?: string
    details?: string
  }): Promise<AuditLog> {
    const supabase = createClient()

    const { data: log, error } = await supabase
      .from('employee_audit_logs')
      .insert({
        employee_id: data.employee_id,
        action: data.action,
        changed_by: data.changed_by,
        changed_by_user_id: data.changed_by_user_id || null,
        details: data.details || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating audit log:', error)
      throw error
    }

    return log
  },

  /**
   * Get audit logs for a specific employee
   */
  async getByEmployee(employeeId: string, limit = 50): Promise<AuditLog[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('employee_audit_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching employee audit logs:', error)
      throw error
    }

    return (data || []) as any
  }
}
