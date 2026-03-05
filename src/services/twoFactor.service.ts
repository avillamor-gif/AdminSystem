import { createClient } from '../lib/supabase/client'

export interface TwoFactorAuth {
  id: string
  user_id: string
  method: 'app' | 'sms' | 'email'
  enabled: boolean
  secret_key: string | null
  phone_number: string | null
  backup_codes: string[] | null
  verified_at: string | null
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

export interface TwoFactorAuthWithUser extends TwoFactorAuth {
  user_email: string
  user_name: string
}

export interface TwoFactorAuthUpdate {
  enabled?: boolean
  method?: 'app' | 'sms' | 'email'
  phone_number?: string
  verified_at?: string
}

export const twoFactorService = {
  async getAll(): Promise<TwoFactorAuthWithUser[]> {
    const supabase = createClient()
    
    try {
      const { data: twoFactorData, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const twoFactorRecords = twoFactorData || []
      
      if (twoFactorRecords.length > 0 && typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/users/auth-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userIds: twoFactorRecords.map((tf: any) => tf.user_id) 
            })
          })
          
          if (response.ok) {
            const { users } = await response.json()
            return twoFactorRecords.map((tf: any) => ({
              ...tf,
              user_email: users[tf.user_id]?.email || 'Unknown',
              user_name: users[tf.user_id]?.email?.split('@')[0] || 'Unknown'
            }))
          }
        } catch (err) {
          console.error('Could not fetch user emails:', err)
        }
      }

      return twoFactorRecords.map((tf: any) => ({
        ...tf,
        user_email: 'Unknown',
        user_name: 'Unknown'
      }))
    } catch (error) {
      console.error('Error fetching 2FA records:', error)
      return []
    }
  },

  async getByUserId(userId: string): Promise<TwoFactorAuth | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    return data
  },

  async enable(userId: string, method: 'app' | 'sms' | 'email'): Promise<TwoFactorAuth> {
    const supabase = createClient()
    
    // Check if record exists
    const existing = await this.getByUserId(userId)
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('two_factor_auth')
        .update({ 
          enabled: true,
          method,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('two_factor_auth')
        .insert({ 
          user_id: userId,
          method,
          enabled: true,
          verified_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async disable(userId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('two_factor_auth')
      .update({ 
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
  },

  async update(userId: string, updates: TwoFactorAuthUpdate): Promise<TwoFactorAuth> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('two_factor_auth')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async resetBackupCodes(userId: string): Promise<string[]> {
    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('two_factor_auth')
      .update({ 
        backup_codes: backupCodes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return backupCodes
  }
}
