import { createClient } from '@/lib/supabase/client'

export interface Deduction {
  id: string
  name: string
  type: 'government' | 'company' | 'other'
  amount: number
  recurring: boolean
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DeductionInsert = Omit<Deduction, 'id' | 'created_at' | 'updated_at'>
export type DeductionUpdate = Partial<DeductionInsert>

const table = 'deductions'

export const deductionService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Deduction[]
  },
  async create(payload: DeductionInsert) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error) throw error
    return data as Deduction
  },
  async update(id: string, payload: DeductionUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Deduction
  },
  async remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  },
}
