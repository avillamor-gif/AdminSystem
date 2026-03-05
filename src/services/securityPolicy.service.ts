import { createClient } from '../lib/supabase/client'

export interface SecurityPolicy {
  id: string
  name: string
  category: string
  description: string | null
  policy_type: 'boolean' | 'numeric' | 'text'
  enabled: boolean
  value_boolean: boolean | null
  value_numeric: number | null
  value_text: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface SecurityPolicyUpdate {
  enabled?: boolean
  value_boolean?: boolean
  value_numeric?: number
  value_text?: string
  last_reviewed_at?: string
}

export const securityPolicyService = {
  async getAll(): Promise<SecurityPolicy[]> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('security_policies')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      return (data || []) as any
    } catch (error) {
      console.error('Error fetching security policies:', error)
      return []
    }
  },

  async getByCategory(): Promise<{ [key: string]: SecurityPolicy[] }> {
    const policies = await this.getAll()
    
    const grouped: { [key: string]: SecurityPolicy[] } = {}
    policies.forEach(policy => {
      if (!grouped[policy.category]) {
        grouped[policy.category] = []
      }
      grouped[policy.category].push(policy)
    })
    
    return grouped
  },

  async update(id: string, updates: SecurityPolicyUpdate): Promise<SecurityPolicy> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('security_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async markAsReviewed(id: string): Promise<SecurityPolicy> {
    return this.update(id, {
      last_reviewed_at: new Date().toISOString()
    })
  }
}
