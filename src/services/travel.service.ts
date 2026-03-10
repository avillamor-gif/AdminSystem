import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'
import { workflowService } from './workflow.service'
import { notifySupervisorsAndAdmins, notifyRequesterOfDecision } from './requestNotification.helper'

const supabase = createClient()

export type TravelRequest = Tables<'travel_requests'>
export type TravelRequestInsert = InsertTables<'travel_requests'>
export type TravelRequestUpdate = UpdateTables<'travel_requests'>

export type TravelRequestWithEmployee = TravelRequest & {
  employee?: Tables<'employees'>
  approver?: Tables<'employees'>
}

export interface TravelRequestFilters {
  status?: string
  department?: string
  employee_id?: string
  start_date?: string
  end_date?: string
  min_cost?: number
  max_cost?: number
}

// Generate travel request number
function generateRequestNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `TR-${year}${month}-${timestamp}`
}

export const travelService = {
  // Get all travel requests with filters
  async getAll(filters: TravelRequestFilters = {}): Promise<TravelRequestWithEmployee[]> {
    let query = supabase
      .from('travel_requests')
      .select(`
        *,
        employee:employees!travel_requests_employee_id_fkey(id, first_name, last_name, email, department_id),
        approver:employees!travel_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters.start_date) {
      query = query.gte('start_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('end_date', filters.end_date)
    }
    if (filters.min_cost) {
      query = query.gte('estimated_cost', filters.min_cost)
    }
    if (filters.max_cost) {
      query = query.lte('estimated_cost', filters.max_cost)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching travel requests:', error)
      throw new Error('Failed to fetch travel requests')
    }

    return data as unknown as TravelRequestWithEmployee[]
  },

  // Get travel request by ID
  async getById(id: string): Promise<TravelRequestWithEmployee | null> {
    const { data, error } = await supabase
      .from('travel_requests')
      .select(`
        *,
        employee:employees!travel_requests_employee_id_fkey(id, first_name, last_name, email, department_id),
        approver:employees!travel_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching travel request:', error)
      return null
    }

    return data as unknown as TravelRequestWithEmployee
  },

  // Create new travel request
  async create(requestData: Omit<TravelRequestInsert, 'request_number'>): Promise<TravelRequest> {
    const requestNumber = generateRequestNumber()
    
    const { data, error } = await supabase
      .from('travel_requests')
      .insert({
        ...requestData,
        request_number: requestNumber,
        status: 'draft'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating travel request:', error)
      throw new Error('Failed to create travel request')
    }

    return data as any
  },

  // Update travel request
  async update(id: string, updates: TravelRequestUpdate): Promise<TravelRequest> {
    const { data, error } = await supabase
      .from('travel_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating travel request:', error)
      throw new Error('Failed to update travel request')
    }

    return data as any
  },

  // Submit travel request (trigger workflow)
  async submit(id: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    // Update status to submitted
    await this.update(id, { status: 'submitted' })

    // Get travel request details
    const travelRequest = await this.getById(id)
    if (!travelRequest) {
      throw new Error('Travel request not found')
    }

    // Notify ED + admin manager + finance manager
    await notifySupervisorsAndAdmins(
      'travel_request_notifications',
      employeeId,
      id,
      'New Travel Request',
      '{name} has submitted a travel request to ' + (travelRequest.destination ?? 'an unknown destination') + '.',
      employeeName,
      (travelRequest as any).request_number,
      'travel_approval'
    )

    // Create workflow request
    await workflowService.createWorkflowRequest({
      requestId: id,
      requestType: 'travel',
      employeeId,
      metadata: {
        employeeName,
        department,
        amount: travelRequest.estimated_cost,
        currency: travelRequest.currency || 'USD',
        businessJustification: travelRequest.business_justification,
        priority: travelRequest.urgency || 'medium',
        destination: travelRequest.destination,
        duration: travelRequest.duration,
        purpose: travelRequest.purpose
      }
    })
  },

  // Approve travel request
  async approve(id: string, approverId: string, comments?: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      approved_by: approverId,
      approved_date: new Date().toISOString()
    })

    await notifyRequesterOfDecision(
      'travel_request_notifications', 'travel_requests', id,
      'approved', 'Travel Request Approved',
      'Your travel request has been approved.',
      undefined,
      'travel_managers'
    )

    // Update workflow
    await workflowService.processApproval(id, 'travel', approverId, 'approved', comments)
  },

  // Reject travel request
  async reject(id: string, approverId: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      approved_by: approverId,
      approved_date: new Date().toISOString(),
      rejection_reason: reason
    })

    await notifyRequesterOfDecision(
      'travel_request_notifications', 'travel_requests', id,
      'rejected', 'Travel Request Rejected',
      `Your travel request has been rejected: ${reason}`,
      undefined,
      'travel_managers'
    )

    // Update workflow
    await workflowService.processApproval(id, 'travel', approverId, 'rejected', reason)
  },

  // Cancel travel request
  async cancel(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' })
    await workflowService.cancelWorkflow(id, 'travel')
  },

  // Delete travel request
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('travel_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting travel request:', error)
      throw new Error('Failed to delete travel request')
    }
  },

  // Get travel requests requiring approval for a specific user
  async getRequiringApproval(userId: string): Promise<TravelRequestWithEmployee[]> {
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

    // Get travel request IDs
    const travelRequestIds = (workflowSteps as any[])
      .filter((step: any) => step.workflow_requests?.request_type === 'travel')
      .map((step: any) => step.workflow_requests?.request_id)

    if (travelRequestIds.length === 0) {
      return []
    }

    // Get the actual travel requests
    return this.getAll({ status: 'submitted' }).then(requests =>
      requests.filter(request => travelRequestIds.includes(request.id))
    )
  },

  // Get travel statistics
  async getStats() {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('status, estimated_cost, currency')

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalCost: 0
      }
    }

    const stats = (data as any[]).reduce((acc: any, request: any) => {
      acc.total++
      if (request.status === 'submitted' || request.status === 'draft') acc.pending++
      if (request.status === 'approved') acc.approved++
      if (request.status === 'rejected') acc.rejected++
      acc.totalCost += request.estimated_cost || 0
      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalCost: 0
    })

    return stats
  }
}

// Query keys for React Query
export const travelKeys = {
  all: ['travel-requests'] as const,
  lists: () => [...travelKeys.all, 'list'] as const,
  list: (filters: TravelRequestFilters) => [...travelKeys.lists(), filters] as const,
  details: () => [...travelKeys.all, 'detail'] as const,
  detail: (id: string) => [...travelKeys.details(), id] as const,
  approvals: (userId: string) => [...travelKeys.all, 'approvals', userId] as const,
  stats: () => [...travelKeys.all, 'stats'] as const,
}