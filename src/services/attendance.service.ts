import { createClient } from '../lib/supabase/client'
import { localDateStr } from '../lib/utils'
import type { Tables } from '../lib/supabase'

export type AttendanceRecord = Tables<'attendance_records'>

export type AttendanceRecordWithRelations = AttendanceRecord & {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
}

export const attendanceService = {
  async getRecords(params: { 
    employeeId?: string; 
    date?: string; 
    startDate?: string; 
    endDate?: string 
  }): Promise<AttendanceRecordWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false })

    if (params.employeeId) {
      query = query.eq('employee_id', params.employeeId)
    }

    if (params.date) {
      query = query.eq('date', params.date)
    }

    if (params.startDate && params.endDate) {
      query = query.gte('date', params.startDate).lte('date', params.endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as AttendanceRecordWithRelations[]
  },

  async clockIn(employeeId: string): Promise<AttendanceRecord> {
    const supabase = createClient()
    const today = localDateStr()
    const now = new Date().toISOString()

    // Check if already clocked in today
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .single()

    if (existing) {
      throw new Error('Already clocked in today')
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        employee_id: employeeId,
        date: today,
        clock_in: now,
        status: 'present',
      } as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as AttendanceRecord
  },

  async clockOut(recordId: string): Promise<AttendanceRecord> {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        clock_out: now,
      } as never)
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data as unknown as AttendanceRecord
  },
}
