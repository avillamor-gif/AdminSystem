import { createClient } from '../lib/supabase/client'

export type ClearanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface ClearanceChecklist {
  id: string
  termination_request_id: string
  employee_id: string
  status: ClearanceStatus
  last_working_date: string | null
  final_pay_released: boolean
  final_pay_released_at: string | null
  final_pay_released_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ClearanceChecklistItem {
  id: string
  checklist_id: string
  department: string
  description: string
  is_cleared: boolean
  cleared_by: string | null
  cleared_at: string | null
  remarks: string | null
  sort_order: number
  created_at: string
}

export interface ClearanceChecklistWithRelations extends ClearanceChecklist {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
  items?: ClearanceChecklistItem[]
}

export interface ClearanceChecklistInsert {
  termination_request_id: string
  employee_id: string
  last_working_date?: string | null
  notes?: string | null
  created_by?: string | null
}

export const clearanceService = {
  async getAll(): Promise<ClearanceChecklistWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklists')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const checklists = (data || []) as ClearanceChecklist[]
    const employeeIds = [...new Set(checklists.map(c => c.employee_id))]
    let employeeMap: Record<string, any> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', employeeIds)
      ;(emps || []).forEach((e: any) => { employeeMap[e.id] = e })
    }

    return checklists.map(c => ({ ...c, employee: employeeMap[c.employee_id] || null }))
  },

  async getById(id: string): Promise<ClearanceChecklistWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklists')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    const checklist = data as ClearanceChecklist

    // Fetch employee
    const { data: emp } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('id', checklist.employee_id)
      .single()

    // Fetch items
    const { data: items } = await supabase
      .from('clearance_checklist_items')
      .select('*')
      .eq('checklist_id', id)
      .order('sort_order', { ascending: true })

    return { ...checklist, employee: emp || null, items: (items || []) as ClearanceChecklistItem[] }
  },

  async getByEmployee(employeeId: string): Promise<ClearanceChecklistWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklists')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const { data: items } = await supabase
      .from('clearance_checklist_items')
      .select('*')
      .eq('checklist_id', (data as ClearanceChecklist).id)
      .order('sort_order', { ascending: true })

    return { ...(data as ClearanceChecklist), items: (items || []) as ClearanceChecklistItem[] }
  },

  async create(payload: ClearanceChecklistInsert): Promise<ClearanceChecklist> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklists')
      .insert(payload as never)
      .select('*')
      .single()
    if (error) throw error
    return data as ClearanceChecklist
  },

  async update(id: string, updates: Partial<Pick<ClearanceChecklist, 'status' | 'last_working_date' | 'final_pay_released' | 'final_pay_released_at' | 'final_pay_released_by' | 'notes'>>): Promise<ClearanceChecklist> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklists')
      .update(updates as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as ClearanceChecklist
  },

  async clearItem(itemId: string, clearedBy: string, remarks?: string): Promise<ClearanceChecklistItem> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklist_items')
      .update({
        is_cleared: true,
        cleared_by: clearedBy,
        cleared_at: new Date().toISOString(),
        remarks: remarks ?? null,
      } as never)
      .eq('id', itemId)
      .select('*')
      .single()
    if (error) throw error
    return data as ClearanceChecklistItem
  },

  async unclearItem(itemId: string): Promise<ClearanceChecklistItem> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clearance_checklist_items')
      .update({ is_cleared: false, cleared_by: null, cleared_at: null, remarks: null } as never)
      .eq('id', itemId)
      .select('*')
      .single()
    if (error) throw error
    return data as ClearanceChecklistItem
  },
}
