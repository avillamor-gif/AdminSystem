import { createClient } from '@/lib/supabase/client'

export interface GovernanceNode {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  sort_order: number
  color: string
  created_at: string
  updated_at: string
}

export interface GovernanceNodeInsert {
  name: string
  description?: string | null
  parent_id?: string | null
  sort_order?: number
  color?: string
}

export const governanceNodeService = {
  async getAll(): Promise<GovernanceNode[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('governance_nodes')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async create(payload: GovernanceNodeInsert): Promise<GovernanceNode> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('governance_nodes')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: Partial<GovernanceNodeInsert>): Promise<GovernanceNode> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('governance_nodes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('governance_nodes')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
