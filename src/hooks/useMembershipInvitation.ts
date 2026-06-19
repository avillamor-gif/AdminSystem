import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipInvitationService, type MembershipInvitationInsert } from '@/services/membershipInvitation.service'
import toast from 'react-hot-toast'

export const membershipInvitationKeys = {
  all: ['membership_invitations'] as const,
  lists: () => [...membershipInvitationKeys.all, 'list'] as const,
  list: (filters: object) => [...membershipInvitationKeys.lists(), filters] as const,
  details: () => [...membershipInvitationKeys.all, 'detail'] as const,
  detail: (id: string) => [...membershipInvitationKeys.details(), id] as const,
  byEmail: (email: string) => [...membershipInvitationKeys.all, 'email', email] as const,
  byStatus: (status: string) => [...membershipInvitationKeys.all, 'status', status] as const,
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useMembershipInvitations(filters?: { status?: string; email?: string; invitationType?: string }) {
  return useQuery({
    queryKey: membershipInvitationKeys.list(filters || {}),
    queryFn: () => membershipInvitationService.getAll(filters),
  })
}

export function useMembershipInvitationById(id: string) {
  return useQuery({
    queryKey: membershipInvitationKeys.detail(id),
    queryFn: () => membershipInvitationService.getById(id),
    enabled: !!id,
  })
}

export function useMembershipInvitationsByEmail(email: string) {
  return useQuery({
    queryKey: membershipInvitationKeys.byEmail(email),
    queryFn: () => membershipInvitationService.getByEmail(email),
    enabled: !!email,
  })
}

export function useSendMembershipInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MembershipInvitationInsert) => {
      // Clear any cached membership invitation queries to prevent stale data
      queryClient.removeQueries({ queryKey: membershipInvitationKeys.all })
      
      // Create invitation record
      const invitation = await membershipInvitationService.create(data)
      
      try {
        // Send email via API (this should throw if it fails)
        const response = await fetch('/api/notifications/send-membership-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId: invitation.id,
            email: invitation.email,
            invitationType: invitation.invitation_type,
            referrerName: invitation.referrer_name,
            targetName: invitation.target_name,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send invitation')
        }

        // Mark as sent only if email send succeeded
        await membershipInvitationService.markAsSent(invitation.id)
        return invitation
      } catch (error) {
        // If email fails, delete the pending invitation
        await membershipInvitationService.delete(invitation.id)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation sent successfully!')
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to send invitation'
      console.error('Invitation error:', error)
      // Provide user-friendly message for duplicate emails
      const displayMsg = msg.includes('already been sent')
        ? msg
        : msg.includes('duplicate key')
          ? 'An invitation has already been sent to this email address'
          : msg
      toast.error(displayMsg)
    },
  })
}

export function useDeleteMembershipInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membershipInvitationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation deleted')
    },
    onError: () => {
      toast.error('Failed to delete invitation')
    },
  })
}

// ── Additional Mutations ───────────────────────────────────────────────────────

export function useResendMembershipInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Resend the invitation email
      try {
        const invitation = await membershipInvitationService.getById(id)
        if (!invitation) {
          throw new Error('Invitation not found')
        }

        // Send email via API
        const response = await fetch('/api/notifications/send-membership-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId: invitation.id,
            email: invitation.email,
            invitationType: invitation.invitation_type,
            referrerName: invitation.referrer_name,
            targetName: invitation.target_name,
            isResend: true,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to resend invitation')
        }

        // Update the sent_at timestamp
        return await membershipInvitationService.resend(id)
      } catch (error) {
        throw error
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation resent successfully!')
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to resend invitation'
      toast.error(msg)
    },
  })
}

export function useMarkInvitationAsAccepted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membershipInvitationService.markAsAccepted(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation marked as accepted')
    },
    onError: () => {
      toast.error('Failed to update invitation status')
    },
  })
}

export function useMarkInvitationAsRejected() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      membershipInvitationService.markAsRejected(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation marked as rejected')
    },
    onError: () => {
      toast.error('Failed to update invitation status')
    },
  })
}

export function useMarkInvitationAsExpired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membershipInvitationService.markAsExpired(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: membershipInvitationKeys.lists() })
      toast.success('Invitation marked as expired')
    },
    onError: () => {
      toast.error('Failed to update invitation status')
    },
  })
}
