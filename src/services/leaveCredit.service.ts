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
   * ED approves a credit request via admin API route (bypasses RLS).
   * Auto-credits the approved days to the employee's leave balance.
   */
  async approve(
    id: string,
    days_approved: number,
    reviewed_by: string,
    reviewer_notes?: string
  ): Promise<LeaveCreditRequest> {
    const res = await fetch(`/api/admin/leave-credits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', days_approved, reviewed_by, reviewer_notes }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'Failed to approve leave credit request')
    return body as LeaveCreditRequest
  },

  async reject(
    id: string,
    reviewed_by: string,
    reviewer_notes: string
  ): Promise<LeaveCreditRequest> {
    const res = await fetch(`/api/admin/leave-credits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reviewed_by, reviewer_notes }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'Failed to reject leave credit request')
    return body as LeaveCreditRequest
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('leave_credit_requests').delete().eq('id', id)
    if (error) throw error
  },
}
