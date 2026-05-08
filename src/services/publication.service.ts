import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'
import { workflowService } from './workflow.service'
import { notifySupervisorsAndAdmins, notifyRequesterOfDecision } from './requestNotification.helper'

export type PublicationRequest = Tables<'publication_requests'>
export type PublicationRequestInsert = InsertTables<'publication_requests'>
export type PublicationRequestUpdate = UpdateTables<'publication_requests'>

export type PublicationRequestWithEmployee = PublicationRequest & {
  employee?: Tables<'employees'>
  approver?: Tables<'employees'>
}

export interface PublicationRequestFilters {
  status?: string
  publication_type?: string
  request_type?: string
  employee_id?: string
  priority?: string
  deadline_from?: string
  deadline_to?: string
  min_cost?: number
  max_cost?: number
  delivery_method?: string
  publication_id?: string
}

// Generate request number
function generateRequestNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `PUB-${year}${month}-${timestamp}`
}

export const publicationService = {
  // Get all publication requests with filters
  async getAll(filters: PublicationRequestFilters = {}): Promise<PublicationRequestWithEmployee[]> {
    const supabase = createClient()
    let query = supabase
      .from('publication_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters.publication_type) {
      query = query.eq('publication_type', filters.publication_type)
    }
    if (filters.request_type) {
      query = query.eq('request_type', filters.request_type)
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.deadline_from) {
      query = query.gte('deadline', filters.deadline_from)
    }
    if (filters.deadline_to) {
      query = query.lte('deadline', filters.deadline_to)
    }
    if (filters.min_cost && filters.min_cost > 0) {
      query = query.gte('estimated_cost', filters.min_cost)
    }
    if (filters.max_cost && filters.max_cost > 0) {
      query = query.lte('estimated_cost', filters.max_cost)
    }
    if (filters.delivery_method) {
      query = query.eq('delivery_method', filters.delivery_method)
    }
    if (filters.publication_id) {
      query = query.eq('publication_id', filters.publication_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching publication requests:', error)
      throw new Error('Failed to fetch publication requests')
    }

    if (!data || data.length === 0) return []

    // Fetch employee data separately to avoid FK join issues
    const employeeIds = [...new Set([
      ...data.map((r: PublicationRequest) => r.employee_id).filter(Boolean),
      ...data.map((r: PublicationRequest) => r.approved_by).filter(Boolean)
    ])] as string[]

    let employeeMap: Record<string, Tables<'employees'>> = {}
    if (employeeIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, department_id')
        .in('id', employeeIds)
      if (employees) {
        employeeMap = Object.fromEntries(employees.map((e: any) => [e.id, e]))
      }
    }

    return data.map((r: PublicationRequest) => {
      // Parse extra fields packed into notes by add-publication page
      const notes = (r as any).notes ?? ''
      const totalPrintedMatch = notes.match(/^Total Printed:\s*(.+)$/m)
      const total_printed = totalPrintedMatch ? Number(totalPrintedMatch[1]) || null : null

      return {
        ...r,
        total_printed,
        employee: r.employee_id ? employeeMap[r.employee_id] : undefined,
        approver: r.approved_by ? employeeMap[r.approved_by] : undefined,
      }
    }) as unknown as PublicationRequestWithEmployee[]
  },

  // Get publication request by ID
  async getById(id: string): Promise<PublicationRequestWithEmployee | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('publication_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching publication request:', error)
      return null
    }

    const record = data as PublicationRequest
    const lookupIds = [record.employee_id, record.approved_by].filter(Boolean) as string[]
    let employeeMap: Record<string, Tables<'employees'>> = {}
    if (lookupIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, department_id')
        .in('id', lookupIds)
      if (employees) {
        employeeMap = Object.fromEntries(employees.map((e: any) => [e.id, e]))
      }
    }

    return {
      ...record,
      employee: record.employee_id ? employeeMap[record.employee_id] : undefined,
      approver: record.approved_by ? employeeMap[record.approved_by] : undefined,
    } as PublicationRequestWithEmployee
  },

  // Create new publication request
  async create(requestData: Omit<PublicationRequestInsert, 'request_number'>): Promise<PublicationRequest> {
    const supabase = createClient()
    const requestNumber = generateRequestNumber()
    
    const { data, error } = await supabase
      .from('publication_requests')
      .insert({
        ...requestData,
        request_number: requestNumber,
        status: requestData.status ?? 'draft'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating publication request:', error)
      throw new Error(`Failed to create publication request: ${error.message}`)
    }

    return data as any
  },

  // Update publication request
  async update(id: string, updates: PublicationRequestUpdate): Promise<PublicationRequest> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('publication_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating publication request:', error)
      throw new Error('Failed to update publication request')
    }

    return data as any
  },

  // Submit publication request (trigger workflow)
  async submit(id: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    // Update status to submitted
    await this.update(id, { status: 'submitted' })

    // Get publication request details
    const request = await this.getById(id)
    if (!request) {
      throw new Error('Publication request not found')
    }

    // Notify supervisor + admins
    await notifySupervisorsAndAdmins(
      'publication_request_notifications',
      employeeId,
      id,
      'New Publication Request',
      '{name} has submitted a publication request for "' + (request.publication_title ?? 'a publication') + '".',
      employeeName,
      (request as any).request_number,
      'admin_resources'
    )

    // Create workflow request
    await workflowService.createWorkflowRequest({
      requestId: id,
      requestType: 'publication',
      employeeId,
      metadata: {
        employeeName,
        department,
        amount: request.estimated_cost,
        currency: request.currency || 'USD',
        businessJustification: request.purpose,
        priority: request.priority || 'medium',
        publication_id: request.publication_id,
        publication_title: request.publication_title,
        publication_type: request.publication_type,
        publisher: request.publisher,
        isbn: request.isbn,
        request_type: request.request_type,
        quantity: request.quantity,
        delivery_method: request.delivery_method,
        deadline: request.deadline
      }
    })
  },

  // Approve publication request
  async approve(id: string, approverId: string, comments?: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      approved_by: approverId,
      approved_date: new Date().toISOString()
    })

    await notifyRequesterOfDecision(
      'publication_request_notifications', 'publication_requests', id,
      'approved', 'Publication Request Approved',
      'Your publication request has been approved.'
    )

    // Update workflow
    await workflowService.processApproval(id, 'publication', approverId, 'approved', comments)
  },

  // Reject publication request
  async reject(id: string, approverId: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      approved_by: approverId,
      approved_date: new Date().toISOString(),
      rejection_reason: reason
    })

    await notifyRequesterOfDecision(
      'publication_request_notifications', 'publication_requests', id,
      'rejected', 'Publication Request Rejected',
      `Your publication request has been rejected: ${reason}`
    )

    // Update workflow
    await workflowService.processApproval(id, 'publication', approverId, 'rejected', reason)
  },

  // Mark as fulfilled
  async fulfill(id: string, notes?: string): Promise<void> {
    await this.update(id, {
      status: 'fulfilled',
      fulfilled_date: new Date().toISOString(),
      notes: notes || undefined
    })
    await notifyRequesterOfDecision(
      'publication_request_notifications', 'publication_requests', id,
      'fulfilled', 'Publication Request Fulfilled',
      'Your publication request has been fulfilled and is ready for pickup.'
    )
  },

  // Cancel publication request
  async cancel(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' })
    await workflowService.cancelWorkflow(id, 'publication')
  },

  // Delete publication request (via API route to bypass RLS)
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/admin/publication-requests/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to delete publication request')
    }
  },

  // Get publication requests requiring approval for a specific user
  async getRequiringApproval(userId: string): Promise<PublicationRequestWithEmployee[]> {
    // Get workflow steps where this user is the approver and status is pending
    const supabase = createClient()
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

    // Get publication request IDs
    const requestIds = (workflowSteps as any[])
      .filter((step: any) => step.workflow_requests?.request_type === 'publication')
      .map((step: any) => step.workflow_requests?.request_id)

    if (requestIds.length === 0) {
      return []
    }

    // Get the actual publication requests
    return this.getAll({ status: 'submitted' }).then(requests =>
      requests.filter(request => requestIds.includes(request.id))
    )
  },

  // Get publication statistics
  async getStats() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('publication_requests')
      .select('status, estimated_cost, currency, publication_type, request_type, priority')

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        fulfilled: 0,
        totalCost: 0,
        publicationTypes: {} as Record<string, number>,
        requestTypes: {} as Record<string, number>,
        priorities: {} as Record<string, number>
      }
    }

    const stats = (data as any[]).reduce((acc: any, request: any) => {
      acc.total++
      if (request.status === 'submitted' || request.status === 'draft') acc.pending++
      if (request.status === 'approved') acc.approved++
      if (request.status === 'rejected') acc.rejected++
      if (request.status === 'fulfilled') acc.fulfilled++
      
      acc.totalCost += request.estimated_cost || 0

      // Publication type breakdown
      if (request.publication_type) {
        acc.publicationTypes[request.publication_type] = (acc.publicationTypes[request.publication_type] || 0) + 1
      }

      // Request type breakdown
      if (request.request_type) {
        acc.requestTypes[request.request_type] = (acc.requestTypes[request.request_type] || 0) + 1
      }

      // Priority breakdown
      if (request.priority) {
        acc.priorities[request.priority] = (acc.priorities[request.priority] || 0) + 1
      }

      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      fulfilled: 0,
      totalCost: 0,
      publicationTypes: {} as Record<string, number>,
      requestTypes: {} as Record<string, number>,
      priorities: {} as Record<string, number>
    })

    return stats
  },

  // Get urgent requests (high priority or approaching deadline)
  async getUrgentRequests(): Promise<PublicationRequestWithEmployee[]> {
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
    const oneWeekDate = oneWeekFromNow.toISOString().split('T')[0]

    const allRequests = await this.getAll({})
    
    return allRequests.filter(request =>
      (request.status === 'submitted' || request.status === 'approved') &&
      (request.priority === 'high' ||
       (request.deadline && request.deadline <= oneWeekDate))
    )
  },

  // Search publications by title or ISBN
  async search(searchTerm: string): Promise<PublicationRequestWithEmployee[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('publication_requests')
      .select('*')
      .or(`publication_title.ilike.%${searchTerm}%,isbn.ilike.%${searchTerm}%,publication_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching publication requests:', error)
      throw new Error('Failed to search publication requests')
    }

    if (!data || data.length === 0) return []

    const employeeIds = [...new Set([
      ...data.map((r: PublicationRequest) => r.employee_id).filter(Boolean),
      ...data.map((r: PublicationRequest) => r.approved_by).filter(Boolean)
    ])] as string[]

    let employeeMap: Record<string, Tables<'employees'>> = {}
    if (employeeIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, department_id')
        .in('id', employeeIds)
      if (employees) {
        employeeMap = Object.fromEntries(employees.map((e: any) => [e.id, e]))
      }
    }

    return data.map((r: PublicationRequest) => ({
      ...r,
      employee: r.employee_id ? employeeMap[r.employee_id] : undefined,
      approver: r.approved_by ? employeeMap[r.approved_by] : undefined,
    })) as unknown as PublicationRequestWithEmployee[]
  }
}

// Query keys for React Query
export const publicationKeys = {
  all: ['publication-requests'] as const,
  lists: () => [...publicationKeys.all, 'list'] as const,
  list: (filters: PublicationRequestFilters) => [...publicationKeys.lists(), filters] as const,
  details: () => [...publicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...publicationKeys.details(), id] as const,
  approvals: (userId: string) => [...publicationKeys.all, 'approvals', userId] as const,
  stats: () => [...publicationKeys.all, 'stats'] as const,
  urgent: () => [...publicationKeys.all, 'urgent'] as const,
  search: (term: string) => [...publicationKeys.all, 'search', term] as const,
}