import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase'

const supabase = createClient()

// ── Types ──────────────────────────────────────────────────────────────────────

export type MembershipInvitation = Tables<'membership_invitations'>
export type MembershipInvitationInsert = InsertTables<'membership_invitations'>
export type MembershipInvitationUpdate = UpdateTables<'membership_invitations'>

// ── Membership Invitations Service ─────────────────────────────────────────────

export const membershipInvitationService = {
  // Get all invitations (with optional filtering)
  async getAll(filters?: {
    status?: string
    email?: string
    invitationType?: string
  }) {
    let query = supabase
      .from('membership_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }
    if (filters?.invitationType) {
      query = query.eq('invitation_type', filters.invitationType)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as MembershipInvitation[]
  },

  // Get single invitation by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data || null) as MembershipInvitation | null
  },

  // Get invitation by code
  async getByCode(code: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('invitation_code', code)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data || null) as MembershipInvitation | null
  },

  // Get invitation by email
  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MembershipInvitation[]
  },

  // Create a new invitation
  async create(payload: {
    email: string
    target_name: string
    invitation_type?: 'direct' | 'referred'
    referrer_id?: string
    referrer_name?: string
    notes?: string
  }) {
    const cleanEmail = payload.email?.toLowerCase()

    // Check if the email already belongs to an active member
    const { data: existingMember } = await supabase
      .from('members')
      .select('id, first_name, last_name, status')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle()

    if (existingMember) {
      const statusLabel = existingMember.status === 'active' ? 'an active member' : `already in the system (status: ${existingMember.status})`
      throw new Error(
        `${existingMember.first_name} ${existingMember.last_name} (${cleanEmail}) is ${statusLabel}. No invitation needed.`
      )
    }

    const { data, error } = await supabase
      .from('membership_invitations')
      .insert({
        email: cleanEmail,
        target_name: payload.target_name,
        invitation_type: payload.invitation_type || 'direct',
        referrer_id: payload.referrer_id || null,
        referrer_name: payload.referrer_name || null,
        notes: payload.notes || null,
        status: 'pending',
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
    return data as MembershipInvitation
  },

  // Update invitation (generic)
  async update(id: string, updates: Partial<MembershipInvitation>) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Mark invitation as sent
  async markAsSent(id: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Mark invitation as accepted (when user applies/signs up)
  async markAsAccepted(id: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Mark invitation as rejected
  async markAsRejected(id: string, notes?: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Mark invitation as expired
  async markAsExpired(id: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Resend invitation (mark as sent again with updated sent_at timestamp)
  async resend(id: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Update invitation notes
  async updateNotes(id: string, notes: string) {
    const { data, error } = await supabase
      .from('membership_invitations')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MembershipInvitation
  },

  // Delete invitation
  async delete(id: string) {
    const { error } = await supabase
      .from('membership_invitations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Validate invitation is not expired
  async validateNotExpired(id: string): Promise<boolean> {
    const invitation = await this.getById(id)
    if (!invitation) return false

    if (invitation.expires_at) {
      return new Date(invitation.expires_at) > new Date()
    }
    return true // No expiration set, valid
  },
}
