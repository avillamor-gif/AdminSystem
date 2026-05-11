import { createClient } from '../lib/supabase/client'

export type DisciplinaryOffenseType =
  | 'tardiness' | 'awol' | 'misconduct' | 'insubordination'
  | 'negligence' | 'dishonesty' | 'harassment' | 'policy_violation' | 'other'

export type DisciplinaryPenaltyLevel =
  | 'verbal_warning' | 'written_warning_1' | 'written_warning_2'
  | 'suspension_1day' | 'suspension_3day' | 'suspension_5day' | 'dismissal'

export type DisciplinaryStatus = 'open' | 'acknowledged' | 'appealed' | 'closed' | 'overturned'

export interface DisciplinaryRecord {
  id: string
  employee_id: string
  offense_type: DisciplinaryOffenseType
  offense_date: string
  offense_count: number
  penalty_level: DisciplinaryPenaltyLevel
  description: string
  status: DisciplinaryStatus
  issued_by: string | null
  acknowledged_at: string | null
  resolution_notes: string | null
  attachments: { name: string; url: string }[] | null
  created_at: string
  updated_at: string
}

export interface DisciplinaryRecordWithRelations extends DisciplinaryRecord {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
  issuer?: { id: string; first_name: string; last_name: string } | null
}

export interface DisciplinaryRecordInsert {
  employee_id: string
  offense_type: DisciplinaryOffenseType
  offense_date: string
  offense_count: number
  penalty_level: DisciplinaryPenaltyLevel
  description: string
  issued_by?: string | null
}

export interface DisciplinaryFilters {
  employee_id?: string
  offense_type?: DisciplinaryOffenseType
  status?: DisciplinaryStatus
  penalty_level?: DisciplinaryPenaltyLevel
}

// Progressive penalty logic (mirrors DB function)
export function nextPenaltyLevel(count: number): DisciplinaryPenaltyLevel {
  if (count <= 1) return 'verbal_warning'
  if (count === 2) return 'written_warning_1'
  if (count === 3) return 'written_warning_2'
  if (count === 4) return 'suspension_1day'
  if (count === 5) return 'suspension_3day'
  return 'dismissal'
}

export const PENALTY_LEVEL_LABELS: Record<DisciplinaryPenaltyLevel, string> = {
  verbal_warning:    'Verbal Warning',
  written_warning_1: '1st Written Warning',
  written_warning_2: '2nd Written Warning',
  suspension_1day:   '1-Day Suspension',
  suspension_3day:   '3-Day Suspension',
  suspension_5day:   '5-Day Suspension',
  dismissal:         'Dismissal',
}

export const OFFENSE_TYPE_LABELS: Record<DisciplinaryOffenseType, string> = {
  tardiness:        'Tardiness',
  awol:             'AWOL',
  misconduct:       'Misconduct',
  insubordination:  'Insubordination',
  negligence:       'Negligence',
  dishonesty:       'Dishonesty',
  harassment:       'Harassment',
  policy_violation: 'Policy Violation',
  other:            'Other',
}

export const disciplinaryService = {
  async getAll(filters: DisciplinaryFilters = {}): Promise<DisciplinaryRecordWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('disciplinary_records')
      .select('*')
      .order('offense_date', { ascending: false })

    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    if (filters.offense_type) query = query.eq('offense_type', filters.offense_type)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.penalty_level) query = query.eq('penalty_level', filters.penalty_level)

    const { data, error } = await query
    if (error) throw error

    const records = (data || []) as DisciplinaryRecord[]
    const employeeIds = [...new Set(records.map((r: DisciplinaryRecord) => r.employee_id))]
    const issuerIds = [...new Set(records.map((r: DisciplinaryRecord) => r.issued_by).filter(Boolean))] as string[]

    let employeeMap: Record<string, any> = {}
    let issuerMap: Record<string, any> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', employeeIds)
      ;(emps || []).forEach((e: any) => { employeeMap[e.id] = e })
    }

    if (issuerIds.length > 0) {
      const { data: issuers } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', issuerIds)
      ;(issuers || []).forEach((e: any) => { issuerMap[e.id] = e })
    }

    return records.map((r: DisciplinaryRecord) => ({
      ...r,
      employee: employeeMap[r.employee_id] || null,
      issuer: r.issued_by ? issuerMap[r.issued_by] || null : null,
    }))
  },

  async getByEmployee(employeeId: string): Promise<DisciplinaryRecordWithRelations[]> {
    return disciplinaryService.getAll({ employee_id: employeeId })
  },

  /** Get count of active (non-closed/overturned) offenses per type for an employee */
  async getOffenseCount(employeeId: string, offenseType: DisciplinaryOffenseType): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('disciplinary_records')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('offense_type', offenseType)
      .not('status', 'in', '(overturned,closed)')
    if (error) throw error
    return count ?? 0
  },

  async create(payload: DisciplinaryRecordInsert): Promise<DisciplinaryRecord> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('disciplinary_records')
      .insert(payload as never)
      .select('*')
      .single()
    if (error) throw error
    return data as DisciplinaryRecord
  },

  async update(id: string, updates: Partial<Pick<DisciplinaryRecord, 'status' | 'acknowledged_at' | 'resolution_notes'>>): Promise<DisciplinaryRecord> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('disciplinary_records')
      .update(updates as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as DisciplinaryRecord
  },
}
