import { createClient } from '@/lib/supabase/client'

export interface PasswordPolicy {
  id: string
  rule_name: string
  rule_type: string
  description: string | null
  enabled: boolean
  value_numeric: number | null
  value_text: string | null
  created_at: string
  updated_at: string
}

export interface PasswordPolicyUpdate {
  enabled?: boolean
  value_numeric?: number | null
  value_text?: string | null
}

export interface UserPasswordMetadata {
  id: string
  user_id: string
  last_changed_at: string
  expiry_date: string | null
  strength: 'weak' | 'medium' | 'strong' | 'unknown'
  failed_attempts: number
  locked_until: string | null
  force_change_on_next_login: boolean
  created_at: string
  updated_at: string
}

export interface UserPasswordStatus {
  user_id: string
  user_name: string
  email: string
  last_changed: string
  strength: 'weak' | 'medium' | 'strong'
  days_until_expiry: number
  status: 'active' | 'expired' | 'expiring'
}

export const passwordPolicyService = {
  async getAll(): Promise<PasswordPolicy[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('password_policies')
      .select('*')
      .order('rule_type', { ascending: true })
      .order('rule_name', { ascending: true })

    if (error) throw error
    return (data || []) as any
  },

  async update(id: string, updates: PasswordPolicyUpdate): Promise<PasswordPolicy> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('password_policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async getUserPasswordStatuses(): Promise<UserPasswordStatus[]> {
    const supabase = createClient()
    
    // Get password expiry policy
    const { data: expiryPolicy } = await supabase
      .from('password_policies')
      .select('value_numeric')
      .eq('rule_name', 'password_expiry_days')
      .single()
    
    const expiryDays = expiryPolicy?.value_numeric || 90

    // Get all user password metadata with user info
    const { data: metadata, error } = await supabase
      .from('user_password_metadata')
      .select(`
        user_id,
        last_changed_at,
        strength,
        expiry_date
      `)

    if (error) throw error

    // Get user info from user_roles
    const { data: users } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        employee:employees(
          first_name,
          last_name,
          email
        )
      `)

    const statuses: UserPasswordStatus[] = []

    for (const meta of metadata || []) {
      const user = users?.find(u => u.user_id === meta.user_id)
      const employee = (user as any)?.employee
      
      const lastChanged = new Date(meta.last_changed_at ?? new Date())
      const expiryDate = meta.expiry_date ? new Date(meta.expiry_date) : new Date(lastChanged.getTime() + expiryDays * 24 * 60 * 60 * 1000)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      let status: 'active' | 'expired' | 'expiring' = 'active'
      if (daysUntilExpiry <= 0) status = 'expired'
      else if (daysUntilExpiry <= 7) status = 'expiring'

      statuses.push({
        user_id: meta.user_id,
        user_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown User',
        email: employee?.email || 'unknown@system.local',
        last_changed: meta.last_changed_at ?? '',
        strength: meta.strength as any,
        days_until_expiry: daysUntilExpiry,
        status
      })
    }

    return statuses
  },

  async forcePasswordReset(userId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('user_password_metadata')
      .update({
        force_change_on_next_login: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
  },

  validatePassword(password: string, policies: PasswordPolicy[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    const enabledPolicies = policies.filter(p => p.enabled)
    
    for (const policy of enabledPolicies) {
      switch (policy.rule_name) {
        case 'min_length':
          if (password.length < (policy.value_numeric || 8)) {
            errors.push(`Password must be at least ${policy.value_numeric} characters`)
          }
          break
        case 'max_length':
          if (password.length > (policy.value_numeric || 128)) {
            errors.push(`Password must not exceed ${policy.value_numeric} characters`)
          }
          break
        case 'require_uppercase':
          if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
          }
          break
        case 'require_lowercase':
          if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
          }
          break
        case 'require_numbers':
          if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number')
          }
          break
        case 'require_special_chars':
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character')
          }
          break
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  calculatePasswordStrength(password: string): { score: number; issues: string[] } {
    let score = 0
    const issues: string[] = []

    if (password.length < 8) issues.push('Too short (min 8 characters)')
    else score += 1

    if (!/[A-Z]/.test(password)) issues.push('Missing uppercase')
    else score += 1

    if (!/[a-z]/.test(password)) issues.push('Missing lowercase')
    else score += 1

    if (!/\d/.test(password)) issues.push('Missing numbers')
    else score += 1

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push('Missing special characters')
    else score += 1

    return { score, issues }
  }
}
