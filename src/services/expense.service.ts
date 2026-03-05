import { createClient } from '../lib/supabase/client'
import { Tables, InsertTables, UpdateTables } from '../lib/supabase/database.types'
import { workflowService } from './workflow.service'

const supabase = createClient()

export type ExpenseRequest = Tables<'expense_requests'>
export type ExpenseRequestInsert = InsertTables<'expense_requests'>
export type ExpenseRequestUpdate = UpdateTables<'expense_requests'>

export type ExpenseRequestWithEmployee = ExpenseRequest & {
  employee?: Tables<'employees'>
  travel_request?: Tables<'travel_requests'>
  approver?: Tables<'employees'>
}

export interface ExpenseRequestFilters {
  status?: string
  category?: string
  employee_id?: string
  travel_request_id?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
  payment_method?: string
  billable?: boolean
}

// Generate expense number
function generateExpenseNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `EXP-${year}${month}-${timestamp}`
}

export const expenseService = {
  // Get all expense requests with filters
  async getAll(filters: ExpenseRequestFilters = {}): Promise<ExpenseRequestWithEmployee[]> {
    let query = supabase
      .from('expense_requests')
      .select(`
        *,
        employee:employees!expense_requests_employee_id_fkey(id, first_name, last_name, email, department_id),
        travel_request:travel_requests(id, request_number, destination, start_date, end_date),
        approver:employees!expense_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }
    if (filters.travel_request_id) {
      query = query.eq('travel_request_id', filters.travel_request_id)
    }
    if (filters.start_date) {
      query = query.gte('expense_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('expense_date', filters.end_date)
    }
    if (filters.min_amount) {
      query = query.gte('amount', filters.min_amount)
    }
    if (filters.max_amount) {
      query = query.lte('amount', filters.max_amount)
    }
    if (filters.payment_method) {
      query = query.eq('payment_method', filters.payment_method)
    }
    if (filters.billable !== undefined) {
      query = query.eq('billable', filters.billable)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching expense requests:', error)
      throw new Error('Failed to fetch expense requests')
    }

    return data as unknown as ExpenseRequestWithEmployee[]
  },

  // Get expense request by ID
  async getById(id: string): Promise<ExpenseRequestWithEmployee | null> {
    const { data, error } = await supabase
      .from('expense_requests')
      .select(`
        *,
        employee:employees!expense_requests_employee_id_fkey(id, first_name, last_name, email, department_id),
        travel_request:travel_requests(id, request_number, destination, start_date, end_date),
        approver:employees!expense_requests_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching expense request:', error)
      return null
    }

    return data as unknown as ExpenseRequestWithEmployee
  },

  // Create new expense request
  async create(requestData: Omit<ExpenseRequestInsert, 'expense_number'>): Promise<ExpenseRequest> {
    const expenseNumber = generateExpenseNumber()
    
    const { data, error } = await supabase
      .from('expense_requests')
      .insert({
        ...requestData,
        expense_number: expenseNumber,
        status: 'draft'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating expense request:', error)
      throw new Error('Failed to create expense request')
    }

    return data as any
  },

  // Update expense request
  async update(id: string, updates: ExpenseRequestUpdate): Promise<ExpenseRequest> {
    const { data, error } = await supabase
      .from('expense_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expense request:', error)
      throw new Error('Failed to update expense request')
    }

    return data as any
  },

  // Submit expense request (trigger workflow)
  async submit(id: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    // Update status to submitted
    await this.update(id, { status: 'submitted' })

    // Get expense request details
    const expenseRequest = await this.getById(id)
    if (!expenseRequest) {
      throw new Error('Expense request not found')
    }

    // Create workflow request
    await workflowService.createWorkflowRequest({
      requestId: id,
      requestType: 'expense',
      employeeId,
      metadata: {
        employeeName,
        department,
        amount: expenseRequest.amount,
        currency: expenseRequest.currency || 'USD',
        businessJustification: `${expenseRequest.category} expense: ${expenseRequest.description}`,
        priority: 'medium',
        category: expenseRequest.category,
        merchant: expenseRequest.merchant,
        expense_date: expenseRequest.expense_date,
        payment_method: expenseRequest.payment_method,
        billable: expenseRequest.billable,
        travel_request_id: expenseRequest.travel_request_id
      }
    })
  },

  // Approve expense request
  async approve(id: string, approverId: string, comments?: string): Promise<void> {
    await this.update(id, {
      status: 'approved',
      approved_by: approverId,
      approved_date: new Date().toISOString()
    })

    // Update workflow
    await workflowService.processApproval(id, 'expense', approverId, 'approved', comments)
  },

  // Reject expense request
  async reject(id: string, approverId: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      approved_by: approverId,
      approved_date: new Date().toISOString(),
      rejection_reason: reason
    })

    // Update workflow
    await workflowService.processApproval(id, 'expense', approverId, 'rejected', reason)
  },

  // Mark as reimbursed
  async reimburse(id: string): Promise<void> {
    await this.update(id, {
      status: 'reimbursed',
      reimbursement_date: new Date().toISOString()
    })
  },

  // Cancel expense request
  async cancel(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' })
    await workflowService.cancelWorkflow(id, 'expense')
  },

  // Delete expense request
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expense_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense request:', error)
      throw new Error('Failed to delete expense request')
    }
  },

  // Get expense requests requiring approval for a specific user
  async getRequiringApproval(userId: string): Promise<ExpenseRequestWithEmployee[]> {
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

    // Get expense request IDs
    const expenseRequestIds = (workflowSteps as any[])
      .filter((step: any) => step.workflow_requests?.request_type === 'expense')
      .map((step: any) => step.workflow_requests?.request_id)

    if (expenseRequestIds.length === 0) {
      return []
    }

    // Get the actual expense requests
    return this.getAll({ status: 'submitted' }).then(requests =>
      requests.filter(request => expenseRequestIds.includes(request.id))
    )
  },

  // Get expense statistics
  async getStats() {
    const { data, error } = await supabase
      .from('expense_requests')
      .select('status, amount, currency, category, billable')

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        reimbursed: 0,
        totalAmount: 0,
        billableAmount: 0,
        categories: {} as Record<string, number>
      }
    }

    const stats = (data as any[]).reduce((acc: any, request: any) => {
      acc.total++
      if (request.status === 'submitted' || request.status === 'draft') acc.pending++
      if (request.status === 'approved') acc.approved++
      if (request.status === 'rejected') acc.rejected++
      if (request.status === 'reimbursed') acc.reimbursed++
      
      acc.totalAmount += request.amount || 0
      if (request.billable) {
        acc.billableAmount += request.amount || 0
      }

      // Category breakdown
      if (request.category) {
        acc.categories[request.category] = (acc.categories[request.category] || 0) + (request.amount || 0)
      }

      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      reimbursed: 0,
      totalAmount: 0,
      billableAmount: 0,
      categories: {} as Record<string, number>
    })

    return stats
  },

  // Get expenses by travel request
  async getByTravelRequest(travelRequestId: string): Promise<ExpenseRequestWithEmployee[]> {
    return this.getAll({ travel_request_id: travelRequestId })
  }
}

// Query keys for React Query
export const expenseKeys = {
  all: ['expense-requests'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseRequestFilters) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  approvals: (userId: string) => [...expenseKeys.all, 'approvals', userId] as const,
  stats: () => [...expenseKeys.all, 'stats'] as const,
  byTravel: (travelId: string) => [...expenseKeys.all, 'by-travel', travelId] as const,
}