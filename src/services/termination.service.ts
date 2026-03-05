import { createClient } from '../lib/supabase/client'
import { Tables, InsertTables, UpdateTables } from '../lib/supabase/database.types'
import { workflowService } from './workflow.service'

const supabase = createClient()

export type TerminationRequest = Tables<'termination_requests'>
export type TerminationRequestInsert = InsertTables<'termination_requests'>
export type TerminationRequestUpdate = UpdateTables<'termination_requests'>

export type TerminationRequestWithEmployee = TerminationRequest & {
  employee?: Tables<'employees'>
  requested_by_employee?: Tables<'employees'>
  approver?: Tables<'employees'>
}

export interface TerminationRequestFilters {
  status?: string
  termination_type?: string
  termination_reason?: string
  employee_id?: string
  requested_by?: string
  urgency?: string
  proposed_date_from?: string
  proposed_date_to?: string
  is_resignation?: boolean
}

// Generate request number
function generateRequestNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `TERM-${year}${month}-${timestamp}`
}

export const terminationService = {
  // Get all termination requests with filters
  async getAll(filters: TerminationRequestFilters = {}): Promise<TerminationRequestWithEmployee[]> {
    let query = supabase
      .from('termination_requests')
      .select(`
        *,
        employee:employees!termination_requests_employee_id_fkey(id, first_name, last_name, email, department_id, job_title_id, hire_date),
        requested_by_employee:employees!termination_requests_requested_by_fkey(id, first_name, last_name, email),
        approver:employees!termination_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters.termination_type) {
      query = query.eq('termination_type', filters.termination_type)
    }
    if (filters.termination_reason) {
      query = query.eq('termination_reason', filters.termination_reason)
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters.requested_by) {
      query = query.eq('requested_by', filters.requested_by)
    }
    if (filters.urgency) {
      query = query.eq('urgency', filters.urgency)
    }
    if (filters.proposed_date_from) {
      query = query.gte('proposed_last_working_date', filters.proposed_date_from)
    }
    if (filters.proposed_date_to) {
      query = query.lte('proposed_last_working_date', filters.proposed_date_to)
    }
    if (filters.is_resignation !== undefined) {
      query = query.eq('is_resignation', filters.is_resignation)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching termination requests:', error)
      throw new Error('Failed to fetch termination requests')
    }

    return data as unknown as TerminationRequestWithEmployee[]
  },

  // Get termination request by ID
  async getById(id: string): Promise<TerminationRequestWithEmployee | null> {
    const { data, error } = await supabase
      .from('termination_requests')
      .select(`
        *,
        employee:employees!termination_requests_employee_id_fkey(id, first_name, last_name, email, department_id, job_title_id, hire_date),
        requested_by_employee:employees!termination_requests_requested_by_fkey(id, first_name, last_name, email),
        approver:employees!termination_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching termination request:', error)
      return null
    }

    return data as unknown as TerminationRequestWithEmployee
  },

  // Create new termination request
  async create(requestData: Omit<TerminationRequestInsert, 'request_number'>): Promise<TerminationRequest> {
    const requestNumber = generateRequestNumber()
    
    const { data, error } = await supabase
      .from('termination_requests')
      .insert({
        ...requestData,
        request_number: requestNumber,
        status: 'pending'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating termination request:', error)
      throw new Error('Failed to create termination request')
    }

    return data as any
  },

  // Update termination request
  async update(id: string, updates: TerminationRequestUpdate): Promise<TerminationRequest> {
    const { data, error } = await supabase
      .from('termination_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating termination request:', error)
      throw new Error('Failed to update termination request')
    }

    return data as any
  },

  // Submit termination request (trigger workflow)
  async submit(id: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    // Update status to submitted
    await this.update(id, { status: 'submitted' })

    // Get termination request details
    const request = await this.getById(id)
    if (!request) {
      throw new Error('Termination request not found')
    }

    // Create workflow request
    await workflowService.createWorkflowRequest({
      requestId: id,
      requestType: 'termination',
      employeeId,
      metadata: {
        employeeName,
        department,
        businessJustification: request.business_justification || `Termination request: ${request.termination_type}`,
        priority: request.urgency || 'medium',
        termination_type: request.termination_type,
        termination_reason: request.termination_reason,
        proposed_last_working_date: request.proposed_last_working_date,
        is_resignation: request.is_resignation,
        notice_period_days: request.notice_period_days,
        severance_applicable: request.severance_applicable,
        severance_amount: request.severance_amount,
        benefits_continuation: request.benefits_continuation,
        exit_interview_required: request.exit_interview_required,
        asset_return_required: request.asset_return_required
      }
    })
  },

  // Approve termination request
  async approve(id: string, approverId: string, comments?: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      approved_by: approverId,
      approved_date: new Date().toISOString()
    })

    // Update workflow
    await workflowService.processApproval(id, 'termination', approverId, 'approved', comments)
  },

  // Reject termination request
  async reject(id: string, approverId: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      approved_by: approverId,
      approved_date: new Date().toISOString(),
      rejection_reason: reason
    })

    // Update workflow
    await workflowService.processApproval(id, 'termination', approverId, 'rejected', reason)
  },

  // Process termination (final step - update employee status)
  async process(id: string, actualLastWorkingDate?: string, hrNotes?: string): Promise<void> {
    const request = await this.getById(id)
    if (!request) {
      throw new Error('Termination request not found')
    }

    // Update termination request
    await this.update(id, {
      status: 'processed',
      processed_date: new Date().toISOString(),
      actual_last_working_date: actualLastWorkingDate || request.proposed_last_working_date,
      hr_notes: hrNotes
    })

    // Update employee status to terminated
    const { error: employeeError } = await supabase
      .from('employees')
      .update({
        status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.employee_id ?? '')

    if (employeeError) {
      console.error('Error updating employee status:', employeeError)
      throw new Error('Failed to update employee status')
    }
  },

  // Cancel termination request
  async cancel(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' })
    await workflowService.cancelWorkflow(id, 'termination')
  },

  // Delete termination request
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('termination_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting termination request:', error)
      throw new Error('Failed to delete termination request')
    }
  },

  // Get termination requests requiring approval for a specific user
  async getRequiringApproval(userId: string): Promise<TerminationRequestWithEmployee[]> {
    // Get workflow steps where this user is the approver and status is pending
    const { data: workflowSteps, error: workflowError } = await supabase
      .from('workflow_steps')
      .select(`
        workflow_id,
        workflow_requests!inner(
          request_id,
          request_type
        )
      `)
      .eq('approver_employee_id', userId)
      .eq('status', 'pending')
      .eq('is_current_level', true)

    if (workflowError || !workflowSteps) {
      return []
    }

    // Get termination request IDs
    const requestIds = (workflowSteps as any[])
      .filter((step: any) => step.workflow_requests?.request_type === 'termination')
      .map((step: any) => step.workflow_requests?.request_id)

    if (requestIds.length === 0) {
      return []
    }

    // Get the actual termination requests
    return this.getAll({ status: 'submitted' }).then(requests =>
      requests.filter(request => requestIds.includes(request.id))
    )
  },

  // Get termination statistics
  async getStats() {
    const { data, error } = await supabase
      .from('termination_requests')
      .select('status, termination_type, termination_reason, is_resignation, urgency, severance_amount')

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        processed: 0,
        resignations: 0,
        totalSeverance: 0,
        terminationTypes: {} as Record<string, number>,
        terminationReasons: {} as Record<string, number>,
        urgencyLevels: {} as Record<string, number>
      }
    }

    const stats = (data as any[]).reduce((acc: any, request: any) => {
      acc.total++
      if (request.status === 'submitted' || request.status === 'draft') acc.pending++
      if (request.status === 'approved') acc.approved++
      if (request.status === 'rejected') acc.rejected++
      if (request.status === 'processed') acc.processed++
      if (request.is_resignation) acc.resignations++
      
      acc.totalSeverance += request.severance_amount || 0

      // Termination type breakdown
      if (request.termination_type) {
        acc.terminationTypes[request.termination_type] = (acc.terminationTypes[request.termination_type] || 0) + 1
      }

      // Termination reason breakdown
      if (request.termination_reason) {
        acc.terminationReasons[request.termination_reason] = (acc.terminationReasons[request.termination_reason] || 0) + 1
      }

      // Urgency breakdown
      if (request.urgency) {
        acc.urgencyLevels[request.urgency] = (acc.urgencyLevels[request.urgency] || 0) + 1
      }

      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      processed: 0,
      resignations: 0,
      totalSeverance: 0,
      terminationTypes: {} as Record<string, number>,
      terminationReasons: {} as Record<string, number>,
      urgencyLevels: {} as Record<string, number>
    })

    return stats
  },

  // Get upcoming terminations (approved requests with future dates)
  async getUpcomingTerminations(): Promise<TerminationRequestWithEmployee[]> {
    const today = new Date().toISOString().split('T')[0]
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
    const oneMonthDate = oneMonthFromNow.toISOString().split('T')[0]

    return this.getAll({}).then(requests =>
      requests.filter(request =>
        request.status === 'approved' &&
        request.proposed_last_working_date >= today &&
        request.proposed_last_working_date <= oneMonthDate
      )
    )
  },

  // Get resignations (voluntary terminations)
  async getResignations(): Promise<TerminationRequestWithEmployee[]> {
    return this.getAll({ is_resignation: true })
  },

  // Calculate notice period
  calculateNoticePeriod(hireDate: string, terminationType: string): number {
    const hire = new Date(hireDate)
    const now = new Date()
    const yearsOfService = (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // Standard notice periods based on years of service and type
    if (terminationType === 'voluntary') {
      if (yearsOfService < 1) return 14 // 2 weeks
      if (yearsOfService < 5) return 30 // 1 month
      return 60 // 2 months
    }

    // For involuntary terminations, typically less notice
    if (terminationType === 'performance' || terminationType === 'misconduct') {
      return 0 // Immediate
    }

    return 30 // Default 1 month
  }
}

// Query keys for React Query
export const terminationKeys = {
  all: ['termination-requests'] as const,
  lists: () => [...terminationKeys.all, 'list'] as const,
  list: (filters: TerminationRequestFilters) => [...terminationKeys.lists(), filters] as const,
  details: () => [...terminationKeys.all, 'detail'] as const,
  detail: (id: string) => [...terminationKeys.details(), id] as const,
  approvals: (userId: string) => [...terminationKeys.all, 'approvals', userId] as const,
  stats: () => [...terminationKeys.all, 'stats'] as const,
  upcoming: () => [...terminationKeys.all, 'upcoming'] as const,
  resignations: () => [...terminationKeys.all, 'resignations'] as const,
}