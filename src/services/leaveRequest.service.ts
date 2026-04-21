import { createClient } from '@/lib/supabase/client'
import { countWorkingDays } from '@/lib/dateUtils'

// =============================================
// TYPES
// =============================================
export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated'
  workflow_id?: string
  resolved_at?: string
  cancelled_at?: string
  cancelled_by?: string
  created_at: string
  updated_at: string
  // Relations
  employee?: any
  leave_type?: any
  workflow?: any
  approvals?: LeaveApproval[]
}

export interface LeaveApproval {
  id: string
  leave_request_id: string
  step_number: number
  approver_role: string
  approver_id?: string
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'skipped'
  comments?: string
  approved_at?: string
  escalated_at?: string
  due_date?: string
  is_optional: boolean
  created_at: string
  updated_at: string
  // Relations
  approver?: any
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  year: number
  total_allocated: number
  used_days: number
  pending_days: number
  available_days: number
  carried_over: number
  created_at: string
  updated_at: string
  // Relations
  leave_type?: any
}

// =============================================
// LEAVE REQUEST SERVICE
// =============================================
export const leaveRequestService = {
  async getAll(filters?: { 
    employee_id?: string
    status?: string
    leave_type_id?: string
    start_date?: string
    end_date?: string
  }) {
    const supabase = createClient()
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id)
    }
    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date)
    }

    const { data: requests, error } = await query
    if (error) throw error
    if (!requests || requests.length === 0) return [] as LeaveRequest[]

    // Enrich with related data via separate queries (avoids PGRST200/PGRST201
    // caused by missing FK to leave_types and two FKs to employees)
    const empIds = [...new Set(requests.map((r: any) => r.employee_id).filter(Boolean))]
    const ltIds  = [...new Set(requests.map((r: any) => r.leave_type_id).filter(Boolean))]
    const wfIds  = [...new Set(requests.map((r: any) => r.workflow_id).filter(Boolean))]

    const [{ data: employees }, { data: leaveTypes }, { data: workflows }] = await Promise.all([
      empIds.length ? supabase.from('employees').select('id, first_name, last_name, employee_id').in('id', empIds) : Promise.resolve({ data: [] }),
      ltIds.length  ? supabase.from('leave_types').select('id, leave_type_name, leave_type_code, category, color_code').in('id', ltIds) : Promise.resolve({ data: [] }),
      wfIds.length  ? supabase.from('leave_approval_workflows').select('id, workflow_name').in('id', wfIds) : Promise.resolve({ data: [] }),
    ])

    const empMap = Object.fromEntries((employees ?? []).map((e: any) => [e.id, e]))
    const ltMap  = Object.fromEntries((leaveTypes  ?? []).map((l: any) => [l.id, l]))
    const wfMap  = Object.fromEntries((workflows   ?? []).map((w: any) => [w.id, w]))

    return requests.map((r: any) => ({
      ...r,
      employee:   empMap[r.employee_id]   ?? null,
      leave_type: ltMap[r.leave_type_id]  ?? null,
      workflow:   wfMap[r.workflow_id]    ?? null,
    })) as unknown as LeaveRequest[]
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data: request, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!request) return null as unknown as LeaveRequest

    // Enrich via separate queries (no FK to leave_types; two FKs to employees)
    const [{ data: empRows }, { data: ltRows }, { data: wfRows }, { data: approvals }] = await Promise.all([
      supabase.from('employees').select('id, first_name, last_name, employee_id, email').eq('id', request.employee_id),
      supabase.from('leave_types').select('id, leave_type_name, leave_type_code, category, color_code').eq('id', request.leave_type_id),
      request.workflow_id
        ? supabase.from('leave_approval_workflows').select('id, workflow_name, workflow_steps').eq('id', request.workflow_id)
        : Promise.resolve({ data: [] }),
      supabase.from('leave_approvals').select('*').eq('leave_request_id', id).order('step_number'),
    ])

    // Enrich approvals with approver info
    const approverIds = [...new Set((approvals ?? []).map((a: any) => a.approver_id).filter(Boolean))]
    let approverMap: Record<string, any> = {}
    if (approverIds.length) {
      const { data: approvers } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .in('id', approverIds)
      approverMap = Object.fromEntries((approvers ?? []).map((e: any) => [e.id, e]))
    }

    return {
      ...request,
      employee:   (empRows ?? [])[0] ?? null,
      leave_type: (ltRows  ?? [])[0] ?? null,
      workflow:   (wfRows  ?? [])[0] ?? null,
      approvals:  (approvals ?? []).map((a: any) => ({ ...a, approver: approverMap[a.approver_id] ?? null })),
    } as LeaveRequest
  },

  async create(request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'requested_at'>) {
    const supabase = createClient()
    
    // Find appropriate workflow
    let workflow_id = null
    if (request.leave_type_id) {
      // Try to find specific workflow for this leave type
      const { data: specificWorkflow } = await supabase
        .from('leave_approval_workflows')
        .select('id')
        .eq('leave_type_id', request.leave_type_id)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single()
      
      if (specificWorkflow) {
        workflow_id = specificWorkflow.id
      } else {
        // Use default workflow
        const { data: defaultWorkflow } = await supabase
          .from('leave_approval_workflows')
          .select('id')
          .is('leave_type_id', null)
          .eq('is_default', true)
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (defaultWorkflow) {
          workflow_id = defaultWorkflow.id
        }
      }
    }

    // Recalculate total_days as working days (exclude weekends + holidays)
    let workingDays = request.total_days ?? 0
    if (request.start_date && request.end_date) {
      const startYear = new Date(request.start_date).getFullYear()
      const endYear = new Date(request.end_date).getFullYear()
      const years = startYear === endYear ? [startYear] : [startYear, endYear]
      let holidayDates = new Set<string>()
      for (const year of years) {
        const { data: hols } = await supabase
          .from('holidays')
          .select('holiday_date')
          .eq('year', year)
          .eq('is_active', true)
        for (const h of hols ?? []) {
          if (h.holiday_date) holidayDates.add(h.holiday_date.slice(0, 10))
        }
      }
      workingDays = countWorkingDays(request.start_date, request.end_date, holidayDates)
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({ ...request, workflow_id, total_days: workingDays } as any)
      .select()
      .single()

    if (error) throw error

    // ── Seed leave_approvals rows via API route (bypasses RLS) ──────────────
    if (workflow_id) {
      try {
        await fetch('/api/leave/seed-approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leaveRequestId: (data as any).id, workflowId: workflow_id }),
        })
      } catch (seedErr) {
        console.warn('[leaveRequest] seed-approvals failed:', seedErr)
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Send notifications to supervisor and all admins via server-side API ──
    // Uses /api/notifications/send (admin client) to bypass RLS on user_roles
    try {
      const leaveRequest = data as LeaveRequest
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'leave_request_notifications',
          employeeId: request.employee_id,
          requestId: leaveRequest.id,
          title: 'New Leave Request from {name}',
          message: '{name} has submitted a leave request.',
          requesterName: '',
          targetGroup: 'leave_request',
        }),
      })
    } catch (notifErr) {
      console.warn('Leave notification error:', notifErr)
    }
    // ─────────────────────────────────────────────────────────────────────────

    return data as unknown as LeaveRequest
  },

  async update(id: string, request: Partial<LeaveRequest>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_requests')
      .update(request as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as LeaveRequest
  },

  async cancel(id: string, cancelled_by: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by,
      } as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as unknown as LeaveRequest
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Remove a single calendar day from a leave request without touching other days.
   * - If the day is the only day  → delete the whole request & restore full balance
   * - If the day is start or end  → shrink the date range by 1 day
   * - If the day is in the middle → split into two requests around the removed day
   * In all cases, used_days / pending_days on leave_balances are decremented by 1.
   */
  async removeSingleDay(leaveRequestId: string, dateStr: string) {
    const supabase = createClient()

    // 1. Fetch the full request
    const { data: req, error: fetchErr } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single()
    if (fetchErr || !req) throw fetchErr ?? new Error('Leave request not found')

    const start = req.start_date as string
    const end   = req.end_date   as string

    // Helper: next/prev calendar day
    const nextDay = (d: string) => {
      const dt = new Date(d + 'T00:00:00')
      dt.setDate(dt.getDate() + 1)
      return dt.toISOString().split('T')[0]
    }
    const prevDay = (d: string) => {
      const dt = new Date(d + 'T00:00:00')
      dt.setDate(dt.getDate() - 1)
      return dt.toISOString().split('T')[0]
    }

    // Working days for a range (no holidays for simplicity — consistent with original booking)
    const wdays = (s: string, e: string) => countWorkingDays(s, e)

    // 2. Determine case and mutate
    if (start === end) {
      // Only day — delete entire request
      const { error } = await supabase.from('leave_requests').delete().eq('id', leaveRequestId)
      if (error) throw error
    } else if (dateStr === start) {
      // Shrink from the front
      const newStart = nextDay(start)
      const newDays  = wdays(newStart, end)
      const { error } = await supabase
        .from('leave_requests')
        .update({ start_date: newStart, total_days: newDays })
        .eq('id', leaveRequestId)
      if (error) throw error
    } else if (dateStr === end) {
      // Shrink from the back
      const newEnd  = prevDay(end)
      const newDays = wdays(start, newEnd)
      const { error } = await supabase
        .from('leave_requests')
        .update({ end_date: newEnd, total_days: newDays })
        .eq('id', leaveRequestId)
      if (error) throw error
    } else {
      // Middle day — split into two requests
      const beforeEnd   = prevDay(dateStr)
      const afterStart  = nextDay(dateStr)
      const beforeDays  = wdays(start, beforeEnd)
      const afterDays   = wdays(afterStart, end)

      // Shrink original to the "before" segment
      const { error: e1 } = await supabase
        .from('leave_requests')
        .update({ end_date: beforeEnd, total_days: beforeDays })
        .eq('id', leaveRequestId)
      if (e1) throw e1

      // Insert a new request for the "after" segment (same status/type)
      const { error: e2 } = await supabase
        .from('leave_requests')
        .insert({
          employee_id:   req.employee_id,
          leave_type_id: req.leave_type_id,
          start_date:    afterStart,
          end_date:      end,
          total_days:    afterDays,
          reason:        req.reason,
          status:        req.status,
          workflow_id:   req.workflow_id ?? null,
        })
      if (e2) throw e2
    }

    // 3. Restore exactly 1 day from the leave balance
    const year = new Date(dateStr).getFullYear()
    const { data: bal } = await supabase
      .from('leave_balances')
      .select('id, used_days, pending_days')
      .eq('employee_id', req.employee_id)
      .eq('leave_type_id', req.leave_type_id)
      .eq('year', year)
      .single()

    if (bal) {
      const wasApproved = req.status === 'approved'
      await supabase
        .from('leave_balances')
        .update({
          used_days:    wasApproved  ? Math.max(0, (bal.used_days    ?? 0) - 1) : bal.used_days,
          pending_days: !wasApproved ? Math.max(0, (bal.pending_days ?? 0) - 1) : bal.pending_days,
        })
        .eq('id', bal.id)
    }
  },

  // Get pending approvals for current user (via leave_approvals workflow table)
  async getPendingApprovals(employee_id: string) {
    const supabase = createClient()
    const { data: approvals, error } = await supabase
      .from('leave_approvals')
      .select('*')
      .eq('approver_id', employee_id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    if (!approvals || approvals.length === 0) return [] as LeaveApproval[]

    // Enrich with leave request + employee + leave_type via separate queries
    const lrIds = [...new Set(approvals.map((a: any) => a.leave_request_id).filter(Boolean))]
    const { data: leaveReqs } = await supabase
      .from('leave_requests')
      .select('*')
      .in('id', lrIds)

    const empIds = [...new Set((leaveReqs ?? []).map((r: any) => r.employee_id).filter(Boolean))]
    const ltIds  = [...new Set((leaveReqs ?? []).map((r: any) => r.leave_type_id).filter(Boolean))]

    const [{ data: employees }, { data: leaveTypes }] = await Promise.all([
      empIds.length ? supabase.from('employees').select('id, first_name, last_name, employee_id').in('id', empIds) : Promise.resolve({ data: [] }),
      ltIds.length  ? supabase.from('leave_types').select('id, leave_type_name, color_code').in('id', ltIds) : Promise.resolve({ data: [] }),
    ])

    const empMap = Object.fromEntries((employees ?? []).map((e: any) => [e.id, e]))
    const ltMap  = Object.fromEntries((leaveTypes  ?? []).map((l: any) => [l.id, l]))
    const lrMap  = Object.fromEntries((leaveReqs   ?? []).map((r: any) => [r.id, {
      ...r,
      employee:   empMap[r.employee_id]  ?? null,
      leave_type: ltMap[r.leave_type_id] ?? null,
    }]))

    return approvals.map((a: any) => ({
      ...a,
      leave_request: lrMap[a.leave_request_id] ?? null,
    })) as unknown as LeaveApproval[]
  },

  // Get all pending leave requests from direct reports (team members)
  // Uses server-side API route to bypass RLS on employees/leave_requests tables
  async getTeamPendingRequests(_manager_employee_id: string) {
    const res = await fetch('/api/leave/team-pending', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to fetch team pending requests')
    return (json.data ?? []) as unknown as LeaveRequest[]
  },

  // Directly approve a leave request (no workflow)
  async approveRequest(leave_request_id: string, comments?: string) {
    const res = await fetch('/api/leave/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_request_id, action: 'approved', comments }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to approve')
    // Return full json so callers can detect pending_steps flag
    return { ...(json.data as LeaveRequest), pending_steps: json.pending_steps ?? false }
  },

  // Directly reject a leave request (no workflow)
  async rejectRequest(leave_request_id: string, comments: string) {
    const res = await fetch('/api/leave/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_request_id, action: 'rejected', comments }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to reject')
    return json.data as LeaveRequest
  },
}

// =============================================
// LEAVE APPROVAL SERVICE
// =============================================
export const leaveApprovalService = {
  async approve(approval_id: string, comments?: string) {
    const supabase = createClient()
    
    // Update approval
    const { data: approval, error: approvalError } = await supabase
      .from('leave_approvals')
      .update({
        status: 'approved',
        comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', approval_id)
      .select('*, leave_request:leave_requests(*)')
      .single()

    if (approvalError) throw approvalError

    // Check if this was the last approval step
    const { data: workflow } = await supabase
      .from('leave_approval_workflows')
      .select('workflow_steps, is_sequential')
      .eq('id', (approval as any).leave_request.workflow_id)
      .single()

    if (workflow) {
      const totalSteps = (workflow.workflow_steps as unknown as any[]).length
      const currentStep = (approval as any).step_number

      if (workflow.is_sequential) {
        // Sequential: Check if all previous steps are approved
        const { data: allApprovals } = await supabase
          .from('leave_approvals')
          .select('*')
          .eq('leave_request_id', (approval as any).leave_request_id)
          .order('step_number')

        const allApproved = allApprovals?.every((a: any) => 
          a.status === 'approved' || a.status === 'skipped' || a.is_optional
        )

        if (allApproved) {
          // All steps approved, approve the request
          await supabase
            .from('leave_requests')
            .update({ status: 'approved' })
            .eq('id', (approval as any).leave_request_id)

          // Notify the requesting employee
          await notifyRequesterOnLeaveDecision(
            supabase,
            (approval as any).leave_request_id,
            'approved'
          )
        } else if (currentStep < totalSteps) {
          // Move to next step - approval status tracked in leave_approvals table
          // No need to update leave_requests as workflow progress is in approvals
        }
      } else {
        // Parallel: Check if all required approvals are done
        const { data: allApprovals } = await supabase
          .from('leave_approvals')
          .select('*')
          .eq('leave_request_id', (approval as any).leave_request_id)

        const allRequired = allApprovals?.filter((a: any) => !a.is_optional)
        const allRequiredApproved = allRequired?.every((a: any) => a.status === 'approved')

        if (allRequiredApproved) {
          await supabase
            .from('leave_requests')
            .update({ status: 'approved' })
            .eq('id', (approval as any).leave_request_id)

          // Notify the requesting employee
          await notifyRequesterOnLeaveDecision(
            supabase,
            (approval as any).leave_request_id,
            'approved'
          )
        }
      }
    }

    return approval
  },

  async reject(approval_id: string, comments: string) {
    const supabase = createClient()
    
    // Update approval
    const { data: approval, error: approvalError } = await supabase
      .from('leave_approvals')
      .update({
        status: 'rejected',
        comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', approval_id)
      .select('leave_request_id')
      .single()

    if (approvalError) throw approvalError

    // Reject the entire request
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'rejected' })
      .eq('id', (approval as any).leave_request_id)
      .select()
      .single()

    if (error) throw error

    // Notify the requesting employee
    await notifyRequesterOnLeaveDecision(
      supabase,
      (approval as any).leave_request_id,
      'rejected',
      comments
    )

    return data as any
  },
}

// =============================================
// INTERNAL: notify requester after decision
// =============================================
async function notifyRequesterOnLeaveDecision(
  _supabase: ReturnType<typeof createClient>,
  leaveRequestId: string,
  decision: 'approved' | 'rejected',
  reason?: string
) {
  try {
    const isApproved = decision === 'approved'
    const title = isApproved ? 'Leave Request Approved' : 'Leave Request Rejected'
    const message = isApproved
      ? 'Your leave request has been approved.'
      : `Your leave request has been rejected${reason ? `: ${reason}` : '.'}`

    // Use server-side API route to bypass RLS on user_roles lookup
    await fetch('/api/notifications/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'leave_request_notifications',
        requestTable: 'leave_requests',
        requestId: leaveRequestId,
        decision,
        title,
        message,
      }),
    })
  } catch (err) {
    console.warn('Failed to notify requester of leave decision:', err)
  }
}

// =============================================
// LEAVE BALANCE SERVICE
// =============================================
export const leaveBalanceService = {
  async getAll(year?: number) {
    const supabase = createClient()
    let query = supabase
      .from('leave_balances')
      .select('*')
      .order('year', { ascending: false })

    if (year) {
      query = query.eq('year', year)
    }

    const { data: balances, error } = await query
    if (error) throw error
    if (!balances || balances.length === 0) return [] as LeaveBalance[]

    // Fetch leave types separately to avoid PGRST200 FK issues
    const typeIds = [...new Set(balances.map((b) => b.leave_type_id).filter(Boolean))]
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, leave_type_name, leave_type_code, color_code')
      .in('id', typeIds)
    const typeMap = new Map((leaveTypes || []).map((t) => [t.id, t]))

    return balances.map((b) => ({
      ...b,
      leave_type: typeMap.get(b.leave_type_id) || null,
    })) as unknown as LeaveBalance[]
  },

  async getByEmployee(employee_id: string, year?: number) {
    const supabase = createClient()
    let query = supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employee_id)

    if (year) {
      query = query.eq('year', year)
    }

    const { data: balances, error } = await query
    if (error) throw error
    if (!balances || balances.length === 0) return [] as LeaveBalance[]

    const typeIds = [...new Set(balances.map((b) => b.leave_type_id).filter(Boolean))]
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, leave_type_name, leave_type_code, color_code')
      .in('id', typeIds)
    const typeMap = new Map((leaveTypes || []).map((t) => [t.id, t]))

    return balances.map((b) => ({
      ...b,
      leave_type: typeMap.get(b.leave_type_id) || null,
    })) as unknown as LeaveBalance[]
  },

  async allocate(employee_id: string, leave_type_id: string, year: number, days: number) {
    const supabase = createClient()

    // Check if balance exists
    const { data: existing } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('leave_type_id', leave_type_id)
      .eq('year', year)
      .single()

    if (existing) {
      // available_days is a GENERATED column (total_allocated - used_days - pending_days) — do not write it
      const { data, error } = await supabase
        .from('leave_balances')
        .update({ total_allocated: days })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw error
      return data as unknown as LeaveBalance
    } else {
      // available_days is a GENERATED column — do not include it in insert
      const { data, error } = await supabase
        .from('leave_balances')
        .insert({
          employee_id,
          leave_type_id,
          year,
          total_allocated: days,
          used_days: 0,
          pending_days: 0,
          carried_over: 0,
        })
        .select('*')
        .single()

      if (error) throw error
      return data as unknown as LeaveBalance
    }
  },

  async bulkInitialize(year: number, defaultDays: Record<string, number>) {
    // defaultDays: { [leave_type_id]: days }
    const supabase = createClient()

    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('status', 'active')

    const { data: existing } = await supabase
      .from('leave_balances')
      .select('employee_id, leave_type_id')
      .eq('year', year)

    const covered = new Set((existing || []).map((b) => `${b.employee_id}:${b.leave_type_id}`))

    const inserts: any[] = []
    for (const emp of employees || []) {
      for (const [leave_type_id, days] of Object.entries(defaultDays)) {
        const key = `${emp.id}:${leave_type_id}`
        if (!covered.has(key)) {
          inserts.push({
            employee_id: emp.id,
            leave_type_id,
            year,
            total_allocated: days,
            used_days: 0,
            pending_days: 0,
            carried_over: 0,
          })
        }
      }
    }

    if (inserts.length === 0) return 0

    const { error } = await supabase.from('leave_balances').insert(inserts as any)
    if (error) throw error
    return inserts.length
  },
}
