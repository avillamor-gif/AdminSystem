import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipInvitationService, type MembershipInvitationInsert } from '@/services/membershipInvitation.service'
import toast from 'react-hot-toast'

export const membershipInvitationKeys = {
  all: ['membership_invitations'] as const,
  lists: () => [...membershipInvitationKeys.all, 'list'] as const,
  list: (filters: object) => [...membershipInvitationKeys.lists(), filters] as const,
  byEmail: (email: string) => [...membershipInvitationKeys.all, 'email', email] as const,
}

export function useMembershipInvitations() {
  return useQuery({
    queryKey: membershipInvitationKeys.lists(),
    queryFn: () => membershipInvitationService.getAll(),
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
      // Create invitation record
      const invitation = await membershipInvitationService.create(data)
      
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
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      // Mark as sent
      await membershipInvitationService.markAsSent(invitation.id)
      return invitation
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
