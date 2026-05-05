import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'
import { workflowService } from './workflow.service'
import { notifySupervisorsAndAdmins } from './requestNotification.helper'

export type LeaveRequest = Tables<'leave_requests'>
export type LeaveRequestInsert = InsertTables<'leave_requests'>
export type LeaveRequestUpdate = UpdateTables<'leave_requests'>
export type LeaveType = Tables<'leave_types'>
export type LeaveTypeInsert = InsertTables<'leave_types'>
export type LeaveTypeUpdate = UpdateTables<'leave_types'>

export type LeaveRequestWithRelations = LeaveRequest & {
  employee?: { id: string; first_name: string; last_name: string; email: string; department?: { name: string } } | null
  leave_type?: { id: string; name: string } | null
  workflow?: {
    id: string
    currentLevel: number
    totalLevels: number
    currentApprover?: string
    status: string
  } | null
}

export type WorkStatusEntry = {
  id: string
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string | null
    department?: { id: string; name: string } | null
  } | null
  statusType: 'work-home' | 'work-offsite' | 'work-travel' | 'work-onsite' | 'on-leave'
  statusLabel: string
  clockIn?: string | null
}

export const leaveService = {
  async getRequests(employeeId?: string): Promise<LeaveRequestWithRelations[]> {
    const supabase = createClient()
    
    // Fetch leave requests
    let requestQuery = supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (employeeId) {
      requestQuery = requestQuery.eq('employee_id', employeeId)
    }

    const { data: requests, error: requestError } = await requestQuery
    if (requestError) {
      console.error('Error fetching leave requests:', requestError)
      throw requestError
    }

    if (!requests || requests.length === 0) {
      return []
    }

    // Fetch related employees
    const employeeIds = [...new Set(requests.map((r: any) => r.employee_id))]
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', employeeIds)

    // Fetch related leave types
    const leaveTypeIds = [...new Set(requests.map((r: any) => r.leave_type_id).filter((x: any): x is string => !!x))]
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, leave_type_name')
      .in('id', leaveTypeIds)

    // Manually join the data
    const employeeMap = new Map(employees?.map((e: any) => [e.id, e]))
    const leaveTypeMap = new Map(leaveTypes?.map((lt: any) => [lt.id, { id: lt.id, name: lt.leave_type_name }]))

    return requests.map((request: any) => ({
      ...request,
      employee: employeeMap.get(request.employee_id) || null,
      leave_type: leaveTypeMap.get(request.leave_type_id) || null
    })) as unknown as LeaveRequestWithRelations[]
  },

  async getEmployeesOnLeaveToday(): Promise<LeaveRequestWithRelations[]> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching employees on leave today:', error)
      throw error
    }

    if (!requests || requests.length === 0) return []

    const employeeIds = [...new Set(requests.map((r: any) => r.employee_id))]
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, avatar_url, department_id')
      .in('id', employeeIds)

    const deptIds = [...new Set((employees || []).map((e: any) => e.department_id).filter((x: any): x is string => !!x))]
    const { data: departments } = deptIds.length
      ? await supabase.from('departments').select('id, name').in('id', deptIds)
      : { data: [] }

    const leaveTypeIds = [...new Set(requests.map((r: any) => r.leave_type_id).filter(Boolean))]
    const { data: leaveTypes } = leaveTypeIds.length
      ? await supabase.from('leave_types').select('id, leave_type_name').in('id', leaveTypeIds)
      : { data: [] }

    const deptMap = new Map((departments || []).map((d: any) => [d.id, d]))
    const employeeMap = new Map((employees || []).map((e: any) => [
      e.id,
      {
        ...e,
        department: e.department_id ? deptMap.get(e.department_id) || null : null
      }
    ]))
    const leaveTypeMap = new Map((leaveTypes || []).map((lt: any) => [lt.id, { id: lt.id, name: lt.leave_type_name }]))

    return requests.map((request: any) => ({
      ...request,
      employee: employeeMap.get(request.employee_id) || null,
      leave_type: leaveTypeMap.get(request.leave_type_id) || null
    })) as unknown as LeaveRequestWithRelations[]
  },

  async getEmployeesWorkStatusToday(): Promise<WorkStatusEntry[]> {
    const supabase = createClient()
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local TZ

    // 1. Approved leave requests covering today
    const { data: leaveReqs } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)

    // 2. Today's attendance records
    const { data: attRecords } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('date', today)

    const workStatuses = ['work-home', 'work-offsite', 'work-travel', 'work-onsite']

    // Extract the attendance type from a record's notes field.
    // Notes are stored as JSON sessions: [{"type":"work-home","timeIn":"..."}]
    // or legacy plain-text: "work-home: note"
    function getAttendanceType(notes: string | null): string | null {
      if (!notes) return null
      const trimmed = notes.trimStart()
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const sessions = JSON.parse(trimmed)
          if (Array.isArray(sessions) && sessions.length > 0) {
            // Use the most recent session's type
            return sessions[sessions.length - 1]?.type ?? null
          }
        } catch {}
      }
      // Legacy plain-text: "work-home: note"
      return notes.split(':')[0].trim() || null
    }

    // Collect all unique employee IDs
    const leaveEmpIds = (leaveReqs || []).map((r: any) => r.employee_id)
    const attEmpIds = (attRecords || [])
      .filter((r: any) => {
        const status = getAttendanceType(r.notes)
        return workStatuses.includes(status ?? '')
      })
      .map((r: any) => r.employee_id)
    const allEmpIds = [...new Set([...leaveEmpIds, ...attEmpIds])]

    if (allEmpIds.length === 0) return []

    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, avatar_url, department_id')
      .in('id', allEmpIds)

    const deptIds = [...new Set((employees || []).map((e: any) => e.department_id).filter((x: any): x is string => !!x))]
    const { data: departments } = deptIds.length
      ? await supabase.from('departments').select('id, name').in('id', deptIds)
      : { data: [] }

    const leaveTypeIds = [...new Set((leaveReqs || []).map((r: any) => r.leave_type_id).filter((x: any): x is string => !!x))]
    const { data: leaveTypes } = leaveTypeIds.length
      ? await supabase.from('leave_types').select('id, leave_type_name').in('id', leaveTypeIds)
      : { data: [] }

    const deptMap = new Map((departments || []).map((d: any) => [d.id, d]))
    const empMap = new Map((employees || []).map((e: any) => ([
      e.id,
      { ...e, department: e.department_id ? deptMap.get(e.department_id) || null : null }
    ])))
    const leaveTypeMap = new Map((leaveTypes || []).map((lt: any) => [lt.id, lt.leave_type_name as string]))

    // Build result — attendance records take priority over leave for the same employee
    const seen = new Set<string>()
    const results: WorkStatusEntry[] = []

    // Attendance-based statuses first (more specific)
    for (const rec of (attRecords || [])) {
      const rawStatus = getAttendanceType(rec.notes) ?? rec.status
      if (!rawStatus || !workStatuses.includes(rawStatus)) continue
      if (seen.has(rec.employee_id)) continue
      seen.add(rec.employee_id)
      const emp = empMap.get(rec.employee_id) as WorkStatusEntry['employee']
      if (!emp) continue
      const labelMap: Record<string, string> = {
        'work-home': 'Work from Home',
        'work-offsite': 'Work Off-site',
        'work-travel': 'Work on Travel',
        'work-onsite': 'On-site',
      }
      results.push({
        id: rec.id,
        employee: emp,
        statusType: rawStatus as WorkStatusEntry['statusType'],
        statusLabel: labelMap[rawStatus] ?? rawStatus,
        clockIn: rec.clock_in ?? null,
      })
    }

    // Leave requests for employees not already covered
    for (const req of (leaveReqs || [])) {
      if (seen.has(req.employee_id)) continue
      seen.add(req.employee_id)
      const emp = empMap.get(req.employee_id) as WorkStatusEntry['employee']
      if (!emp) continue
      results.push({
        id: req.id,
        employee: emp,
        statusType: 'on-leave',
        statusLabel: (leaveTypeMap.get(req.leave_type_id) as string) ?? 'On Leave',
      })
    }

    return results.sort((a, b) => {
      // on-leave always at the bottom
      if (a.statusType === 'on-leave' && b.statusType !== 'on-leave') return 1
      if (b.statusType === 'on-leave' && a.statusType !== 'on-leave') return -1
      // Sort by clock-in time ascending (earliest punch-in first)
      if (a.clockIn && b.clockIn) return a.clockIn.localeCompare(b.clockIn)
      if (a.clockIn && !b.clockIn) return -1
      if (!a.clockIn && b.clockIn) return 1
      // Fallback: alphabetical
      const nameA = `${a.employee?.first_name} ${a.employee?.last_name}`
      const nameB = `${b.employee?.first_name} ${b.employee?.last_name}`
      return nameA.localeCompare(nameB)
    })
  },

  async getLeaveTypes(): Promise<LeaveType[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []) as unknown as LeaveType[]
  },

  async createLeaveType(leaveType: LeaveTypeInsert): Promise<LeaveType> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .insert(leaveType as never)
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as LeaveType
  },

  async updateLeaveType(id: string, leaveType: LeaveTypeUpdate): Promise<LeaveType> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_types')
      .update(leaveType as never)
      .eq('id', id)
      .select('*')

    if (error) throw error
    
    if (!data || data.length === 0) {
      throw new Error('Leave type not found')
    }
    
    // Return the first row if multiple are returned
    return (Array.isArray(data) ? data[0] : data) as LeaveType
  },

  async deleteLeaveType(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('leave_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async createRequest(request: LeaveRequestInsert, employeeData?: any): Promise<LeaveRequest> {
    const supabase = createClient()
    
    // Calculate total_days (inclusive of both start and end dates)
    const startDate = new Date(request.start_date ?? new Date())
    const endDate = new Date(request.end_date ?? new Date())
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
    
    // Use provided employee data or fetch if not provided
    let employee = employeeData
    
    if (!employee) {
      const { data, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id, first_name, last_name, email,
          department:departments(id, name),
          job_title:job_titles(id, title),
          manager:employees!employees_manager_id_fkey(id, first_name, last_name)
        `)
        .eq('id', request.employee_id ?? '')
        .single()

      if (employeeError) {
        console.error('Error fetching employee for leave request:', employeeError)
        throw new Error(`Failed to fetch employee data: ${employeeError.message}`)
      }
      
      employee = data
    }

    if (!employee) {
      throw new Error('Employee not found')
    }

    // Create the leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        ...request,
        total_days: diffDays
      } as never)
      .select('*')
      .single()

    if (error) throw error

    // Create workflow for approval
    if (data && employee) {
      const workflow = await workflowService.createWorkflow(
        'leave',
        (data as any).id,
        employee,
        {
          startDate: request.start_date,
          endDate: request.end_date,
          reason: request.reason,
          priority: 'medium'
        }
      )

      console.log('Created leave workflow:', workflow.id)
    }

    // Send bell notifications to supervisor and admins
    try {
      const requesterName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : 'An employee'
      await notifySupervisorsAndAdmins(
        'leave_request_notifications',
        request.employee_id ?? '',
        (data as any).id,
        'New Leave Request',
        `{name} has submitted a leave request.`,
        requesterName,
        undefined,
        'leave_request'
      )
    } catch (notifErr) {
      console.warn('Leave notification error (leave.service):', notifErr)
    }

    return data as unknown as LeaveRequest
  },

  async updateStatus(
    id: string, 
    status: 'approved' | 'rejected' | 'cancelled',
    approverId: string,
    comments?: string
  ): Promise<LeaveRequest> {
    const supabase = createClient()
    
    const updateData: Partial<LeaveRequest> = {
      status,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    // Update workflow if exists
    try {
      const workflowId = `WF_${id}`
      if (status === 'approved') {
        await workflowService.approveStep(workflowId, 1, approverId, comments)
      } else if (status === 'rejected') {
        await workflowService.rejectStep(workflowId, 1, approverId, comments || 'Request rejected')
      }
    } catch (workflowError) {
      console.warn('Workflow update failed:', workflowError)
    }

    return data as unknown as LeaveRequest
  },

  async updateRequestStatus(
    id: string,
    status: 'approved' | 'rejected',
    approverId: string
  ): Promise<LeaveRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as LeaveRequest
  },

  async withdrawRequest(id: string, employeeId: string): Promise<LeaveRequest> {
    const supabase = createClient()
    
    // First verify the request belongs to the employee and is pending
    const { data: existing, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .eq('employee_id', employeeId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !existing) {
      throw new Error('Leave request not found or cannot be withdrawn')
    }

    // Update status to cancelled
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Cancel workflow if exists
    try {
      const workflowId = `WF_${id}`
      await workflowService.rejectStep(workflowId, 1, employeeId, 'Withdrawn by employee')
    } catch (workflowError) {
      console.warn('Workflow cancellation failed:', workflowError)
    }

    return data as unknown as LeaveRequest
  },
}
