// @ts-nocheck
// leave_credit_requests table is not yet in database.types.ts
// Run `npm run db:types` after migration to regenerate types and remove this directive
import { createClient } from '@/lib/supabase/client'

export type CreditType = 'travel' | 'weekend_work' | 'holiday_work' | 'other'
export type CreditStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveCreditRequest {
  id: string
  employee_id: string
  credit_type: CreditType
  work_date_from: string
  work_date_to: string
  days_requested: number
  days_approved: number | null
  reason: string
  destination: string | null
  is_international: boolean | null
  notes: string | null
  leave_type_id: string | null
  status: CreditStatus
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
  created_at: string
  updated_at: string
  // joined
  employee?: { id: string; first_name: string; last_name: string; employee_id: string } | null
  leave_type?: { id: string; leave_type_name: string } | null
  reviewer?: { id: string; first_name: string; last_name: string } | null
}

export interface LeaveCreditRequestInsert {
  employee_id: string
  credit_type: CreditType
  work_date_from: string
  work_date_to: string
  days_requested: number
  reason: string
  destination?: string | null
  is_international?: boolean
  notes?: string | null
  leave_type_id?: string | null
}

export const leaveCreditService = {
  async getAll(): Promise<LeaveCreditRequest[]> {
    // Use admin API route to bypass RLS — admins must see all employees' requests
    const res = await fetch('/api/admin/leave-credits')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to fetch leave credit requests')
    }
    return res.json()
  },

  async getByEmployee(employee_id: string): Promise<LeaveCreditRequest[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .select('*')
      .eq('employee_id', employee_id)
      .order('created_at', { ascending: false })
    if (error) throw error

    const leaveTypeIds = [...new Set((data || []).map((r: any) => r.leave_type_id).filter(Boolean))]
    const { data: leaveTypes } = leaveTypeIds.length
      ? await supabase.from('leave_types').select('id, leave_type_name').in('id', leaveTypeIds as string[])
      : { data: [] }
    const ltMap = new Map((leaveTypes || []).map((t: any) => [t.id, t]))

    return (data || []).map((r: any) => ({
      ...r,
      leave_type: r.leave_type_id ? (ltMap.get(r.leave_type_id) ?? null) : null,
    })) as LeaveCreditRequest[]
  },

  async create(payload: LeaveCreditRequestInsert): Promise<LeaveCreditRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as LeaveCreditRequest
  },

  /**
   * ED approves a credit request.
   * - Updates status to 'approved' and records days_approved + reviewer info.
   * - Automatically adds the approved days to the employee's leave balance.
   * - Admin can later adjust the leave balance via the existing Allocate Leave Balance function.
   */
  async approve(
    id: string,
    days_approved: number,
    reviewed_by: string,
    reviewer_notes?: string
  ): Promise<LeaveCreditRequest> {
    const supabase = createClient()

    // 1. Fetch the full request
    const { data: req, error: fetchErr } = await supabase
      .from('leave_credit_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr

    // 2. Mark as approved
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .update({
        status: 'approved',
        days_approved,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewer_notes ?? null,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error

    // 3. Auto-credit the leave balance
    //    We ADD the approved days on top of whatever is already allocated this year.
    const year = new Date(req.work_date_from).getFullYear()
    const leave_type_id = req.leave_type_id

    if (leave_type_id) {
      // Fetch existing balance for this employee + leave_type + year
      const { data: existing } = await supabase
        .from('leave_balances')
        .select('id, total_allocated')
        .eq('employee_id', req.employee_id)
        .eq('leave_type_id', leave_type_id)
        .eq('year', year)
        .maybeSingle()

      if (existing) {
        const newTotal = (existing.total_allocated ?? 0) + days_approved
        await supabase
          .from('leave_balances')
          .update({ total_allocated: newTotal })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('leave_balances')
          .insert({
            employee_id: req.employee_id,
            leave_type_id,
            year,
            total_allocated: days_approved,
            used_days: 0,
            pending_days: 0,
            carried_over: 0,
          })
      }
    }

    return data as unknown as LeaveCreditRequest
  },

  async reject(
    id: string,
    reviewed_by: string,
    reviewer_notes: string
  ): Promise<LeaveCreditRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_credit_requests')
      .update({
        status: 'rejected',
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        reviewer_notes,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as LeaveCreditRequest
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('leave_credit_requests').delete().eq('id', id)
    if (error) throw error
  },
}
