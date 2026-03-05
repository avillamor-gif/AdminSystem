import { createClient } from '../lib/supabase/client'

export interface ActiveSession {
  id: string
  user_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  device_type: string | null
  location: string | null
  started_at: string
  last_activity_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

export interface ActiveSessionWithUser extends ActiveSession {
  user_email: string
  user_name: string
}

export const sessionService = {
  async getAll(): Promise<ActiveSessionWithUser[]> {
    const supabase = createClient()
    
    try {
      const { data: sessions, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })

      if (error) throw error

      // Fetch user emails from auth if needed
      const sessionsData = sessions || []
      
      if (sessionsData.length > 0 && typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/users/auth-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userIds: sessionsData.map((s: any) => s.user_id) 
            })
          })
          
          if (response.ok) {
            const { users } = await response.json()
            return sessionsData.map((session: any) => ({
              ...session,
              user_email: users[session.user_id]?.email || 'Unknown',
              user_name: users[session.user_id]?.email?.split('@')[0] || 'Unknown'
            }))
          }
        } catch (err) {
          console.error('Could not fetch user emails:', err)
        }
      }

      return sessionsData.map((session: any) => ({
        ...session,
        user_email: 'Unknown',
        user_name: 'Unknown'
      }))
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return []
    }
  },

  async terminateSession(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  },

  async terminateAllUserSessions(userId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
  },

  async updateActivity(sessionId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }
}
