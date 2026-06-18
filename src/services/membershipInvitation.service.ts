import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables } from '@/lib/supabase'

export type MembershipInvitation = Tables<'membership_invitations'>
export type MembershipInvitationInsert = InsertTables<'membership_invitations'>

export const membershipInvitationService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getByEmail(email: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(payload: MembershipInvitationInsert) {
    const supabase = createClient()
    const cleanEmail = payload.email?.toLowerCase()

    // Check if an invitation already exists for this email
    const { data: existing } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const lastInvite = existing[0]
      throw new Error(
        `An invitation has already been sent to this email address (${lastInvite.status})`,
      )
    }

    const { data, error } = await supabase
      .from('membership_invitations')
      .insert({
        ...payload,
        email: cleanEmail,
      })
      .select('*')
      .single()

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        throw new Error('An invitation has already been sent to this email address')
      }
      throw error
    }
    return data
  },

  async update(id: string, updates: Partial<MembershipInvitation>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('membership_invitations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async markAsSent(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('membership_invitations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async validateNotExpired(id: string): Promise<boolean> {
    const invitation = await this.getById(id)
    if (!invitation) return false
    
    if (invitation.expires_at) {
      return new Date(invitation.expires_at) > new Date()
    }
    return true // No expiration set, valid
  },
}
