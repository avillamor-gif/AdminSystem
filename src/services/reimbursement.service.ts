import { createClient } from '@/lib/supabase/client'

export interface Reimbursement {
  id: string
  name: string
  type: 'transport' | 'representation' | 'other'
  amount: number
  taxable: boolean
  status: 'Pending' | 'Approved' | 'Rejected'
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ReimbursementInsert = Omit<Reimbursement, 'id' | 'created_at' | 'updated_at'>
export type ReimbursementUpdate = Partial<ReimbursementInsert>

const table = 'reimbursements'

export const reimbursementService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Reimbursement[]
  },
  async create(payload: ReimbursementInsert) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error) throw error
    return data as Reimbursement
  },
  async update(id: string, payload: ReimbursementUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Reimbursement
  },
  async remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  },
}
