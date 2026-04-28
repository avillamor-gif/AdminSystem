import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  boardTrusteeService,
  boardTermService,
  memberService,
  generalAssemblyService,
  gaAttendeeService,
  type BoardTrustee,
  type BoardTerm,
  type Member,
  type GeneralAssembly,
} from '@/services/governance.service'

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const governanceKeys = {
  trustees:    ['board_trustees'] as const,
  terms:       (filters?: object) => ['board_terms', filters] as const,
  members:     (filters?: object) => ['members', filters] as const,
  assemblies:  ['general_assemblies'] as const,
  attendees:   (gaId: string) => ['ga_attendees', gaId] as const,
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
      qc.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member added')
    },
    onError: () => toast.error('Failed to add member'),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Member> }) =>
      memberService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member updated')
    },
    onError: () => toast.error('Failed to update member'),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memberService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member removed')
    },
    onError: () => toast.error('Failed to remove member'),
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
