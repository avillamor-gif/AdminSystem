import { createClient } from '@/lib/supabase/client'

export interface BonusStructure {
  id: string
  name: string
  type: 'statutory' | 'performance' | 'project_based' | 'mid_year' | 'year_end' | 'other'
  amount: number
  schedule: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BonusStructureInsert = Omit<BonusStructure, 'id' | 'created_at' | 'updated_at'>
export type BonusStructureUpdate = Partial<BonusStructureInsert>

const table = 'bonus_structures' as any

export const bonusStructureService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as unknown as BonusStructure[]
  },
  async create(payload: BonusStructureInsert) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as BonusStructure
  },
  async update(id: string, payload: BonusStructureUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as BonusStructure
  },
  async remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  },
}
