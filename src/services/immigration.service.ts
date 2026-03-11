import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type ImmigrationDocumentType = 'passport' | 'visa'

export interface ImmigrationDocument {
  id: string
  employee_id: string
  document_type: ImmigrationDocumentType
  document_number: string
  issued_date: string | null
  expiry_date: string | null
  eligible_status: string | null
  issued_by: string | null
  eligible_review_date: string | null
  comments: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ImmigrationDocumentInsert {
  employee_id: string
  document_type: ImmigrationDocumentType
  document_number: string
  issued_date?: string | null
  expiry_date?: string | null
  eligible_status?: string | null
  issued_by?: string | null
  eligible_review_date?: string | null
  comments?: string | null
}

export interface ImmigrationDocumentUpdate {
  document_type?: ImmigrationDocumentType
  document_number?: string
  issued_date?: string | null
  expiry_date?: string | null
  eligible_status?: string | null
  issued_by?: string | null
  eligible_review_date?: string | null
  comments?: string | null
}

export const immigrationService = {
  async getAllByEmployee(employeeId: string): Promise<ImmigrationDocument[]> {
    const { data, error } = await supabase
      .from('employee_immigration')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as ImmigrationDocument[]
  },

  async create(payload: ImmigrationDocumentInsert): Promise<ImmigrationDocument> {
    const { data, error } = await supabase
      .from('employee_immigration')
      .insert(payload as any)
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as ImmigrationDocument
  },

  async update(id: string, updates: ImmigrationDocumentUpdate): Promise<ImmigrationDocument> {
    const { data, error } = await supabase
      .from('employee_immigration')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as ImmigrationDocument
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_immigration')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
