import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  boardTrusteeService,
  boardTermService,
  memberService,
  memberDuesService,
  memberCampaignService,
  generalAssemblyService,
  gaAttendeeService,
  type BoardTrustee,
  type BoardTerm,
  type Member,
  type MemberDue,
  type MemberCampaign,
  type GeneralAssembly,
} from '@/services/governance.service'

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const governanceKeys = {
  trustees:         ['board_trustees'] as const,
  terms:            (filters?: object) => ['board_terms', filters] as const,
  members:          (filters?: object) => ['members', filters] as const,
  assemblies:       ['general_assemblies'] as const,
  attendees:        (gaId: string) => ['ga_attendees', gaId] as const,
  dues:             (memberId: string) => ['member_dues', memberId] as const,
  campaigns:        ['member_campaigns'] as const,
  campaignDetail:   (id: string) => ['member_campaign', id] as const,
  campaignRecipients: (id: string) => ['member_campaign_recipients', id] as const,
  memberCampaignHistory: (memberId: string) => ['member_campaign_history', memberId] as const,
}

// ── Board Trustees ─────────────────────────────────────────────────────────────

export function useBoardTrustees() {
  return useQuery({
    queryKey: governanceKeys.trustees,
    queryFn: () => boardTrusteeService.getAll(),
  })
}

export function useCreateBoardTrustee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof boardTrusteeService.create>[0]) =>
      boardTrusteeService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.trustees })
      toast.success('Trustee added')
    },
    onError: () => toast.error('Failed to add trustee'),
  })
}

export function useUpdateBoardTrustee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BoardTrustee> }) =>
      boardTrusteeService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.trustees })
      toast.success('Trustee updated')
    },
    onError: () => toast.error('Failed to update trustee'),
  })
}

export function useDeleteBoardTrustee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => boardTrusteeService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.trustees })
      toast.success('Trustee removed')
    },
    onError: () => toast.error('Failed to remove trustee'),
  })
}

// ── Board Terms ────────────────────────────────────────────────────────────────

export function useBoardTerms(filters?: { trustee_id?: string; is_current?: boolean }) {
  return useQuery({
    queryKey: governanceKeys.terms(filters),
    queryFn: () => boardTermService.getAll(filters),
  })
}

export function useCreateBoardTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof boardTermService.create>[0]) =>
      boardTermService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board_terms'] })
      toast.success('Term recorded')
    },
    onError: () => toast.error('Failed to record term'),
  })
}

export function useUpdateBoardTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BoardTerm> }) =>
      boardTermService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board_terms'] })
      toast.success('Term updated')
    },
    onError: () => toast.error('Failed to update term'),
  })
}

export function useDeleteBoardTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => boardTermService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board_terms'] })
      toast.success('Term removed')
    },
    onError: () => toast.error('Failed to remove term'),
  })
}

// ── Members ────────────────────────────────────────────────────────────────────

export function useMembers(filters?: { status?: string; membership_type?: string }) {
  return useQuery({
    queryKey: governanceKeys.members(filters),
    queryFn: () => memberService.getAll(filters),
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberService.create>[0]) =>
      memberService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.members() })
      toast.success('Member added')
    },
    onError: (err: any) => {
      let msg = 'Failed to add member'
      if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (err?.details) msg = err.details
      else if (err?.hint) msg = err.hint
      else if (typeof err === 'string') msg = err
      toast.error(msg)
      console.error('Create member error - Full object:', JSON.stringify(err, null, 2))
      console.error('Create member error - Keys:', Object.keys(err || {}))
    },
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Member> }) =>
      memberService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.members() })
      toast.success('Member updated')
    },
    onError: (err: any) => {
      let msg = 'Failed to update member'
      if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (err?.details) msg = err.details
      else if (err?.hint) msg = err.hint
      else if (typeof err === 'string') msg = err
      toast.error(msg)
      console.error('Update member error - Full object:', JSON.stringify(err, null, 2))
      console.error('Update member error - Keys:', Object.keys(err || {}))
    },
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memberService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.members() })
      toast.success('Member removed')
    },
    onError: (err: any) => {
      let msg = 'Failed to remove member'
      if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (err?.details) msg = err.details
      else if (typeof err === 'string') msg = err
      toast.error(msg)
      console.error('Delete member error:', err)
    },
  })
}

// ── General Assemblies ─────────────────────────────────────────────────────────

export function useGeneralAssemblies() {
  return useQuery({
    queryKey: governanceKeys.assemblies,
    queryFn: () => generalAssemblyService.getAll(),
  })
}

export function useCreateGeneralAssembly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof generalAssemblyService.create>[0]) =>
      generalAssemblyService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('General Assembly created')
    },
    onError: () => toast.error('Failed to create General Assembly'),
  })
}

export function useUpdateGeneralAssembly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GeneralAssembly> }) =>
      generalAssemblyService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('General Assembly updated')
    },
    onError: () => toast.error('Failed to update General Assembly'),
  })
}

export function useDeleteGeneralAssembly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => generalAssemblyService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('General Assembly deleted')
    },
    onError: () => toast.error('Failed to delete General Assembly'),
  })
}

// ── GA Attendees ───────────────────────────────────────────────────────────────

export function useGaAttendees(gaId: string) {
  return useQuery({
    queryKey: governanceKeys.attendees(gaId),
    queryFn: () => gaAttendeeService.getByGa(gaId),
    enabled: !!gaId,
  })
}

export function useAddGaAttendee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gaId, memberId, notes }: { gaId: string; memberId: string; notes?: string }) =>
      gaAttendeeService.addAttendee(gaId, memberId, notes),
    onSuccess: (_, { gaId }) => {
      qc.invalidateQueries({ queryKey: governanceKeys.attendees(gaId) })
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('Attendee recorded')
    },
    onError: () => toast.error('Failed to add attendee'),
  })
}

export function useRemoveGaAttendee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, gaId }: { id: string; gaId: string }) =>
      gaAttendeeService.removeAttendee(id).then(() => gaId),
    onSuccess: (gaId) => {
      qc.invalidateQueries({ queryKey: governanceKeys.attendees(gaId as string) })
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('Attendee removed')
    },
    onError: () => toast.error('Failed to remove attendee'),
  })
}

export function useBulkAddGaAttendees() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gaId, memberIds }: { gaId: string; memberIds: string[] }) =>
      gaAttendeeService.bulkAdd(gaId, memberIds),
    onSuccess: (_, { gaId }) => {
      qc.invalidateQueries({ queryKey: governanceKeys.attendees(gaId) })
      qc.invalidateQueries({ queryKey: governanceKeys.assemblies })
      toast.success('Attendance recorded')
    },
    onError: () => toast.error('Failed to record attendance'),
  })
}

// ── Member Dues ────────────────────────────────────────────────────────────────

export function useMemberDues(memberId: string) {
  return useQuery({
    queryKey: governanceKeys.dues(memberId),
    queryFn: () => memberDuesService.getByMember(memberId),
    enabled: !!memberId,
  })
}

export function useCreateMemberDue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberDuesService.create>[0]) =>
      memberDuesService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: governanceKeys.dues(result.member_id) })
      toast.success('Dues record added')
    },
    onError: () => toast.error('Failed to add dues record'),
  })
}

export function useUpdateMemberDue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId, data }: { id: string; memberId: string; data: Partial<MemberDue> }) =>
      memberDuesService.update(id, data),
    onSuccess: (_, { memberId }) => {
      qc.invalidateQueries({ queryKey: governanceKeys.dues(memberId) })
      toast.success('Dues record updated')
    },
    onError: (err: any) => {
      let msg = 'Failed to update member due'
      if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (typeof err === 'string') msg = err
      toast.error(msg)
    },
  })
}

export function useDeleteMemberDue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      memberDuesService.delete(id),
    onSuccess: (_, { memberId }) => {
      qc.invalidateQueries({ queryKey: governanceKeys.dues(memberId) })
      toast.success('Dues record removed')
    },
    onError: (err: any) => {
      let msg = 'Failed to remove member due'
      if (err?.message) msg = err.message
      else if (err?.error_description) msg = err.error_description
      else if (typeof err === 'string') msg = err
      toast.error(msg)
    },
  })
}

// ── Member Campaigns ───────────────────────────────────────────────────────────

export function useMemberCampaigns() {
  return useQuery({
    queryKey: governanceKeys.campaigns,
    queryFn: () => memberCampaignService.getAll(),
  })
}

export function useCreateMemberCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<MemberCampaign, 'id' | 'created_at' | 'updated_at'>) =>
      memberCampaignService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.campaigns })
      toast.success('Campaign saved')
    },
    onError: () => toast.error('Failed to save campaign'),
  })
}

export function useUpdateMemberCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberCampaign> }) =>
      memberCampaignService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.campaigns })
      toast.success('Campaign updated')
    },
    onError: () => toast.error('Failed to update campaign'),
  })
}

export function useDeleteMemberCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memberCampaignService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: governanceKeys.campaigns })
      toast.success('Campaign deleted')
    },
    onError: () => toast.error('Failed to delete campaign'),
  })
}

export function useCampaignRecipients(campaignId: string) {
  return useQuery({
    queryKey: governanceKeys.campaignRecipients(campaignId),
    queryFn: () => memberCampaignService.getRecipients(campaignId),
    enabled: !!campaignId,
  })
}

export function useMemberCampaignHistory(memberId: string) {
  return useQuery({
    queryKey: governanceKeys.memberCampaignHistory(memberId),
    queryFn: () => memberCampaignService.getMemberHistory(memberId),
    enabled: !!memberId,
  })
}
