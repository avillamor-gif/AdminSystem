import { createClient } from '../lib/supabase/client'

export type OvertimeRequestType = 'overtime' | 'stay_on' | 'official_business'
export type OvertimeDayType = 'regular' | 'rest_day' | 'special_holiday' | 'regular_holiday'
export type OvertimeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// OT rate multipliers per IBON Manual
export const OT_RATE_MULTIPLIERS: Record<OvertimeDayType, number> = {
  regular:         1.25,
  rest_day:        1.30,
  special_holiday: 1.30,
  regular_holiday: 2.00,
}

export const REQUEST_TYPE_LABELS: Record<OvertimeRequestType, string> = {
  overtime:           'Overtime (OT)',
  stay_on:            'Stay-On',
  official_business:  'Official Business (OB)',
}

export const DAY_TYPE_LABELS: Record<OvertimeDayType, string> = {
  regular:         'Regular Day',
  rest_day:        'Rest Day',
  special_holiday: 'Special Holiday',
  regular_holiday: 'Regular Holiday',
}

export interface OvertimeRequest {
  id: string
  request_number: string
  employee_id: string
  request_type: OvertimeRequestType
  request_date: string
  start_time: string
  end_time: string
  total_hours: number | null
  location: string | null
  purpose: string
  day_type: OvertimeDayType
  ot_rate_multiplier: number | null
  estimated_ot_pay: number | null
  status: OvertimeRequestStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  requested_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OvertimeRequestWithRelations extends OvertimeRequest {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
  approver?: { id: string; first_name: string; last_name: string } | null
}

export interface OvertimeRequestInsert {
  employee_id: string
  request_type: OvertimeRequestType
  request_date: string
  start_time: string
  end_time: string
  total_hours?: number | null
  location?: string | null
  purpose: string
  day_type: OvertimeDayType
  ot_rate_multiplier?: number | null
  estimated_ot_pay?: number | null
  requested_by?: string | null
  notes?: string | null
}

export interface OvertimeFilters {
  employee_id?: string
  request_type?: OvertimeRequestType
  status?: OvertimeRequestStatus
  date_from?: string
  date_to?: string
}

function generateRequestNumber(type: OvertimeRequestType): string {
  const prefix = type === 'official_business' ? 'OB' : type === 'stay_on' ? 'SO' : 'OT'
  return `${prefix}-${Date.now().toString().slice(-8)}`
}

export function computeHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMin = sh * 60 + sm
  let endMin = eh * 60 + em
  if (endMin <= startMin) endMin += 24 * 60 // next day
  return parseFloat(((endMin - startMin) / 60).toFixed(2))
}

export const overtimeService = {
  async getAll(filters: OvertimeFilters = {}): Promise<OvertimeRequestWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('overtime_requests')
      .select('*')
      .order('request_date', { ascending: false })

    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    if (filters.request_type) query = query.eq('request_type', filters.request_type)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.date_from) query = query.gte('request_date', filters.date_from)
    if (filters.date_to) query = query.lte('request_date', filters.date_to)

    const { data, error } = await query
    if (error) throw error

    const requests = (data || []) as OvertimeRequest[]
    const employeeIds = [...new Set(requests.map((r: OvertimeRequest) => r.employee_id))]
    const approverIds = [...new Set(requests.map((r: OvertimeRequest) => r.approved_by).filter(Boolean))] as string[]

    let employeeMap: Record<string, any> = {}
    let approverMap: Record<string, any> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', employeeIds)
      ;(emps || []).forEach((e: any) => { employeeMap[e.id] = e })
    }
    if (approverIds.length > 0) {
      const { data: approvers } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', approverIds)
      ;(approvers || []).forEach((a: any) => { approverMap[a.id] = a })
    }

    return requests.map((r: OvertimeRequest) => ({
      ...r,
      employee: employeeMap[r.employee_id] || null,
      approver: r.approved_by ? approverMap[r.approved_by] || null : null,
    }))
  },

  async getByEmployee(employeeId: string): Promise<OvertimeRequestWithRelations[]> {
    return overtimeService.getAll({ employee_id: employeeId })
  },

  async create(payload: OvertimeRequestInsert): Promise<OvertimeRequest> {
    const supabase = createClient()
    const totalHours = payload.total_hours ?? computeHours(payload.start_time, payload.end_time)
    const multiplier = payload.ot_rate_multiplier ?? OT_RATE_MULTIPLIERS[payload.day_type]

    const { data, error } = await supabase
      .from('overtime_requests')
      .insert({
        ...payload,
        request_number: generateRequestNumber(payload.request_type),
        total_hours: totalHours,
        ot_rate_multiplier: multiplier,
        status: 'pending',
      } as never)
      .select('*')
      .single()
    if (error) throw error
    return data as OvertimeRequest
  },

  async approve(id: string, approverId: string): Promise<OvertimeRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('overtime_requests')
      .update({ status: 'approved', approved_by: approverId, approved_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as OvertimeRequest
  },

  async reject(id: string, approverId: string, reason: string): Promise<OvertimeRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('overtime_requests')
      .update({ status: 'rejected', approved_by: approverId, approved_at: new Date().toISOString(), rejection_reason: reason } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as OvertimeRequest
  },

  async cancel(id: string): Promise<OvertimeRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('overtime_requests')
      .update({ status: 'cancelled' } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as OvertimeRequest
  },
}
