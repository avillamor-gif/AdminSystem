import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface EmployeeComplianceItem {
  id: string
  employee_id: string
  label: string
  is_complete: boolean
  completed_at: string | null
  completed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const employeeComplianceService = {
  async getAllByEmployee(employeeId: string): Promise<EmployeeComplianceItem[]> {
    const { data, error } = await supabase
      .from('employee_compliance_items')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async toggle(id: string, isComplete: boolean, completedBy?: string): Promise<EmployeeComplianceItem> {
    const { data, error } = await supabase
      .from('employee_compliance_items')
      .update({
        is_complete: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null,
        completed_by: isComplete ? (completedBy || 'Admin') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async createDefaultItems(employeeId: string): Promise<void> {
    const defaultItems = [
      'Employment Contract',
      'Tax Forms (BIR 2305/1902)',
      'Direct Deposit / Payroll Form',
      'Emergency Contact Submitted',
      'Background Check',
      'Employee Handbook Acknowledgment',
      'SSS Registration',
      'PhilHealth Registration',
      'Pag-IBIG Registration',
      'TIN Number Submitted',
    ]

    const { error } = await supabase
      .from('employee_compliance_items')
      .insert(defaultItems.map(label => ({ employee_id: employeeId, label, is_complete: false })))

    if (error) throw error
  },
}
