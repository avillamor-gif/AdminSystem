import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface BenefitsPlan {
  id: string
  name: string
  description?: string | null
  type: string
  amount: number
  is_taxable: boolean
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export const benefitsPlanService = {
  async getAll(): Promise<BenefitsPlan[]> {
    const { data, error } = await supabase
      .from('benefits_plans')
      .select('*')
      .order('name')
    if (error) throw error
    return (data || []) as BenefitsPlan[]
  },
  async getById(id: string): Promise<BenefitsPlan | null> {
    const { data, error } = await supabase
      .from('benefits_plans')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as BenefitsPlan | null
  },
  async create(plan: Partial<BenefitsPlan>): Promise<BenefitsPlan> {
    const { data, error } = await supabase
      .from('benefits_plans')
      .insert(plan as any)
      .select()
      .single()
    if (error) throw error
    return data as BenefitsPlan
  },
  async update(id: string, updates: Partial<BenefitsPlan>): Promise<BenefitsPlan> {
    const { data, error } = await supabase
      .from('benefits_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as BenefitsPlan
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('benefits_plans')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
