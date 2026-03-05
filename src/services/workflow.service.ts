import { createClient } from '../lib/supabase/client'
import type { Tables } from '../lib/supabase'

// Central Workflow Types
export interface WorkflowStep {
  id: string
  level: number
  approverRole: 'manager' | 'department_head' | 'hr' | 'finance' | 'admin'
  approverEmployeeId?: string
  approverName?: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  actionDate?: string
  comments?: string
  isCurrentLevel: boolean
  conditions?: {
    minAmount?: number
    maxAmount?: number
    department?: string[]
    jobTitle?: string[]
    urgency?: string
  }
}

export interface WorkflowRequest {
  id: string
  requestId: string
  requestType: 'leave' | 'travel' | 'expense' | 'asset' | 'publication' | 'termination'
  employeeId: string
  employeeName: string
  department: string
  currentLevel: number
  totalLevels: number
  status: 'draft' | 'submitted' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  amount?: number
  currency?: string
  businessJustification?: string
  submittedDate: string
  completedDate?: string
  steps: WorkflowStep[]
  metadata: Record<string, any>
}

export interface WorkflowTemplate {
  id: string
  name: string
  requestType: 'leave' | 'travel' | 'expense' | 'asset' | 'publication' | 'termination'
  description: string
  isActive: boolean
  conditions: {
    departments?: string[]
    jobTitles?: string[]
    amountRanges?: {min: number; max: number}[]
    urgency?: string[]
  }
  steps: {
    level: number
    approverRole: 'manager' | 'department_head' | 'hr' | 'finance' | 'admin'
    autoApprove?: boolean
    timeoutDays: number
    escalationRole?: 'manager' | 'department_head' | 'hr' | 'finance' | 'admin'
    conditions?: {
      minAmount?: number
      maxAmount?: number
      skipIf?: string[]
    }
  }[]
}

export const workflowService = {
  // Get appropriate workflow template for request
  async getWorkflowTemplate(requestType: string, employee: any, amount?: number): Promise<WorkflowTemplate> {
    const templates = await this.getWorkflowTemplates(requestType)
    
    // Find best matching template based on conditions
    const matchingTemplate = templates.find(template => {
      const conditions = template.conditions
      
      // Check department match
      if (conditions.departments && !conditions.departments.includes(employee.department)) {
        return false
      }
      
      // Check amount range
      if (amount && conditions.amountRanges) {
        const inRange = conditions.amountRanges.some(range => 
          amount >= range.min && (range.max === -1 || amount <= range.max)
        )
        if (!inRange) return false
      }
      
      return true
    })
    
    return matchingTemplate || templates.find(t => t.name === 'Default') || templates[0]
  },

  // Create workflow for a new request
  async createWorkflow(
    requestType: string,
    requestId: string,
    employee: any,
    metadata: Record<string, any>
  ): Promise<WorkflowRequest> {
    const template = await this.getWorkflowTemplate(requestType, employee, metadata.amount)
    
    const steps: WorkflowStep[] = template.steps.map((stepTemplate, index) => ({
      id: `${requestId}_step_${index + 1}`,
      level: stepTemplate.level,
      approverRole: stepTemplate.approverRole,
      status: 'pending',
      isCurrentLevel: index === 0, // First step is current
      conditions: stepTemplate.conditions
    }))

    // Auto-approve if conditions met
    for (const step of steps) {
      if (this.shouldAutoApprove(step, metadata)) {
        step.status = 'approved'
        step.actionDate = new Date().toISOString()
        step.comments = 'Auto-approved based on policy'
        step.isCurrentLevel = false
      } else {
        break // Stop at first non-auto-approved step
      }
    }

    const workflow: WorkflowRequest = {
      id: `WF_${requestId}`,
      requestId,
      requestType: requestType as any,
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      department: employee.department?.name || 'Unknown',
      currentLevel: steps.find(s => s.isCurrentLevel)?.level || 1,
      totalLevels: steps.length,
      status: 'submitted',
      priority: metadata.priority || 'medium',
      amount: metadata.amount,
      currency: metadata.currency || 'USD',
      businessJustification: metadata.businessJustification,
      submittedDate: new Date().toISOString(),
      steps,
      metadata
    }

    // Store workflow in database (you'd implement this)
    await this.saveWorkflow(workflow)
    
    // Send notifications to current approver
    await this.notifyCurrentApprover(workflow)
    
    return workflow
  },

  // Approve a workflow step
  async approveStep(
    workflowId: string,
    level: number,
    approverId: string,
    comments?: string
  ): Promise<WorkflowRequest> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const step = workflow.steps.find(s => s.level === level)
    if (!step) throw new Error('Workflow step not found')

    // Update current step
    step.status = 'approved'
    step.actionDate = new Date().toISOString()
    step.comments = comments
    step.isCurrentLevel = false

    // Move to next step or complete
    const nextStep = workflow.steps.find(s => s.level === level + 1)
    if (nextStep) {
      nextStep.isCurrentLevel = true
      workflow.currentLevel = nextStep.level
      workflow.status = 'in_progress'
      
      // Send notification to next approver
      await this.notifyCurrentApprover(workflow)
    } else {
      // All steps approved - complete workflow
      workflow.status = 'approved'
      workflow.completedDate = new Date().toISOString()
      
      // Update original request status
      await this.updateRequestStatus(workflow.requestType, workflow.requestId, 'approved')
      
      // Send completion notification
      await this.notifyRequestor(workflow, 'approved')
    }

    await this.saveWorkflow(workflow)
    return workflow
  },

  // Reject a workflow step
  async rejectStep(
    workflowId: string,
    level: number,
    approverId: string,
    reason: string
  ): Promise<WorkflowRequest> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const step = workflow.steps.find(s => s.level === level)
    if (!step) throw new Error('Workflow step not found')

    // Update current step
    step.status = 'rejected'
    step.actionDate = new Date().toISOString()
    step.comments = reason
    step.isCurrentLevel = false

    // Complete workflow as rejected
    workflow.status = 'rejected'
    workflow.completedDate = new Date().toISOString()

    // Update original request status
    await this.updateRequestStatus(workflow.requestType, workflow.requestId, 'rejected')

    // Send rejection notification
    await this.notifyRequestor(workflow, 'rejected')

    await this.saveWorkflow(workflow)
    return workflow
  },

  // Get workflow templates for request type
  async getWorkflowTemplates(requestType: string): Promise<WorkflowTemplate[]> {
    // Default templates - in production, load from database
    const defaultTemplates: Record<string, WorkflowTemplate[]> = {
      leave: [
        {
          id: 'leave_default',
          name: 'Default Leave Approval',
          requestType: 'leave',
          description: 'Standard leave request approval workflow',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 3,
              escalationRole: 'department_head'
            },
            {
              level: 2,
              approverRole: 'hr',
              timeoutDays: 2,
              conditions: { minAmount: 0 } // Always require HR for leave
            }
          ]
        }
      ],
      travel: [
        {
          id: 'travel_default',
          name: 'Default Travel Approval',
          requestType: 'travel',
          description: 'Standard travel request approval workflow',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 2,
              autoApprove: true,
              conditions: { maxAmount: 500 }
            },
            {
              level: 2,
              approverRole: 'department_head',
              timeoutDays: 3,
              conditions: { minAmount: 500, maxAmount: 2000 }
            },
            {
              level: 3,
              approverRole: 'finance',
              timeoutDays: 5,
              conditions: { minAmount: 2000 }
            }
          ]
        }
      ],
      expense: [
        {
          id: 'expense_default',
          name: 'Default Expense Approval',
          requestType: 'expense',
          description: 'Standard expense reimbursement workflow',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 2,
              autoApprove: true,
              conditions: { maxAmount: 25 }
            },
            {
              level: 2,
              approverRole: 'department_head',
              timeoutDays: 3,
              conditions: { minAmount: 25, maxAmount: 500 }
            },
            {
              level: 3,
              approverRole: 'finance',
              timeoutDays: 5,
              conditions: { minAmount: 500 }
            }
          ]
        }
      ],
      asset: [
        {
          id: 'asset_default',
          name: 'Default Asset Assignment',
          requestType: 'asset',
          description: 'Standard asset assignment workflow',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 1
            },
            {
              level: 2,
              approverRole: 'admin',
              timeoutDays: 2
            }
          ]
        }
      ],
      publication: [
        {
          id: 'publication_default',
          name: 'Default Publication Request',
          requestType: 'publication',
          description: 'Standard publication copy request workflow',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 2
            },
            {
              level: 2,
              approverRole: 'admin',
              timeoutDays: 3
            }
          ]
        }
      ],
      termination: [
        {
          id: 'termination_default',
          name: 'Employee Termination Workflow',
          requestType: 'termination',
          description: 'Employee termination approval and processing',
          isActive: true,
          conditions: {},
          steps: [
            {
              level: 1,
              approverRole: 'manager',
              timeoutDays: 1
            },
            {
              level: 2,
              approverRole: 'hr',
              timeoutDays: 2
            },
            {
              level: 3,
              approverRole: 'admin',
              timeoutDays: 1
            }
          ]
        }
      ]
    }

    return defaultTemplates[requestType] || []
  },

  // Helper methods
  shouldAutoApprove(step: WorkflowStep, metadata: Record<string, any>): boolean {
    const conditions = step.conditions
    if (!conditions) return false

    // Check amount conditions
    if (metadata.amount && conditions.maxAmount) {
      return metadata.amount <= conditions.maxAmount
    }

    return false
  },

  async saveWorkflow(workflow: WorkflowRequest): Promise<void> {
    // Store in database - implement based on your schema
    console.log('Saving workflow:', workflow.id)
  },

  async getWorkflow(workflowId: string): Promise<WorkflowRequest | null> {
    // Retrieve from database - implement based on your schema
    console.log('Getting workflow:', workflowId)
    return null
  },

  async updateRequestStatus(requestType: string, requestId: string, status: string): Promise<void> {
    const supabase = createClient()
    
    const tableMap = {
      leave: 'leave_requests',
      travel: 'travel_requests', // You'll need to create this table
      expense: 'expense_requests', // You'll need to create this table
      asset: 'asset_assignments', // You'll need to create this table
      publication: 'publication_requests', // You'll need to create this table
      termination: 'termination_requests' // You'll need to create this table
    }

    const table = tableMap[requestType as keyof typeof tableMap]
    if (!table) return

    await supabase
      .from(table as any)
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', requestId)
  },

  async notifyCurrentApprover(workflow: WorkflowRequest): Promise<void> {
    // Send notification to current approver
    const currentStep = workflow.steps.find(s => s.isCurrentLevel)
    if (currentStep) {
      console.log(`Notifying ${currentStep.approverRole} for ${workflow.requestType} request ${workflow.requestId}`)
      // Implement email/in-app notifications
    }
  },

  async notifyRequestor(workflow: WorkflowRequest, status: 'approved' | 'rejected'): Promise<void> {
    console.log(`Notifying ${workflow.employeeName} that ${workflow.requestType} request ${workflow.requestId} was ${status}`)
    // Implement email/in-app notifications
  },

  // Get workflows by approver
  async getWorkflowsByApprover(approverId: string, role: string): Promise<WorkflowRequest[]> {
    // Query workflows where current step matches approver role
    console.log(`Getting workflows for approver ${approverId} with role ${role}`)
    return []
  },

  // Get workflows by employee
  async getWorkflowsByEmployee(employeeId: string): Promise<WorkflowRequest[]> {
    // Query workflows by employee ID
    console.log(`Getting workflows for employee ${employeeId}`)
    return []
  },

  // Create workflow request (alias for createWorkflow for backward compatibility)
  async createWorkflowRequest(params: {
    requestType: string
    requestId: string
    employeeId: string
    metadata: Record<string, any>
  }): Promise<WorkflowRequest> {
    // Fetch employee data
    const supabase = createClient()
    const { data: employee } = await supabase
      .from('employees')
      .select('*, department:departments(name)')
      .eq('id', params.employeeId)
      .single()

    if (!employee) {
      throw new Error('Employee not found')
    }

    return this.createWorkflow(
      params.requestType,
      params.requestId,
      employee,
      params.metadata
    )
  },

  // Process approval (alias for approveStep)
  async processApproval(
    requestId: string,
    requestType: string,
    approverId: string,
    action: 'approved' | 'rejected',
    comments?: string
  ): Promise<WorkflowRequest> {
    const workflowId = `WF_${requestId}`
    
    if (action === 'approved') {
      // Get current level from workflow
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) throw new Error('Workflow not found')
      
      return this.approveStep(workflowId, workflow.currentLevel, approverId, comments)
    } else {
      // Get current level from workflow
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) throw new Error('Workflow not found')
      
      return this.rejectStep(workflowId, workflow.currentLevel, approverId, comments || 'No reason provided')
    }
  },

  // Cancel workflow
  async cancelWorkflow(requestId: string, requestType: string): Promise<void> {
    const workflowId = `WF_${requestId}`
    const workflow = await this.getWorkflow(workflowId)
    
    if (!workflow) return

    workflow.status = 'cancelled'
    workflow.completedDate = new Date().toISOString()

    // Update original request status
    await this.updateRequestStatus(requestType, requestId, 'cancelled')

    await this.saveWorkflow(workflow)
  }
}

// Export workflow status utilities
export const WorkflowStatus = {
  getStatusColor: (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'in_progress': case 'submitted': return 'warning'
      case 'rejected': case 'cancelled': return 'danger'
      case 'draft': return 'secondary'
      default: return 'outline'
    }
  },

  getStepStatusIcon: (status: string) => {
    switch (status) {
      case 'approved': return '✅'
      case 'rejected': return '❌'
      case 'pending': return '⏳'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }
}