import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  memberApplicationService,
  memberEducationService,
  memberOrgAffiliationService,
  memberEngagementHistoryService,
  type MemberApplication,
  type MemberApplicationWithRelations,
  type MemberEducation,
  type MemberOrgAffiliation,
  type MemberEngagementHistory,
} from '@/services/memberApplication.service'

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const memberApplicationKeys = {
  all: ['member_applications'] as const,
  lists: () => [...memberApplicationKeys.all, 'list'] as const,
  list: (filters: object) => [...memberApplicationKeys.lists(), filters] as const,
  details: () => [...memberApplicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberApplicationKeys.details(), id] as const,
}

// ── Application Queries ────────────────────────────────────────────────────────

export function useMemberApplications(filters?: { status?: string }) {
  return useQuery({
    queryKey: memberApplicationKeys.list(filters || {}),
    queryFn: () => memberApplicationService.getAll(filters),
  })
}

export function useMemberApplicationById(id: string) {
  return useQuery({
    queryKey: memberApplicationKeys.detail(id),
    queryFn: () => memberApplicationService.getById(id),
    enabled: !!id,
  })
}

// ── Application Mutations ──────────────────────────────────────────────────────

export function useCreateMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberApplicationService.create>[0]) =>
      memberApplicationService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success(`Application submitted! Reference: ${result.reference_number}`)
    },
    onError: () => toast.error('Failed to submit application'),
  })
}

export function useSaveMemberApplicationDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberApplicationService.saveDraft>[0]) =>
      memberApplicationService.saveDraft(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Draft saved')
    },
    onError: () => toast.error('Failed to save draft'),
  })
}

export function useUpdateMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberApplication> }) =>
      memberApplicationService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(id) })
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Application updated')
    },
    onError: () => toast.error('Failed to update application'),
  })
}

export function useApproveMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, createdMemberId, reviewedBy }: { id: string; createdMemberId: string; reviewedBy: string }) =>
      memberApplicationService.approve(id, createdMemberId, reviewedBy),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(id) })
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Application approved! Member created.')
    },
    onError: () => toast.error('Failed to approve application'),
  })
}

export function useRejectMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, reviewedBy }: { id: string; reason: string; reviewedBy: string }) =>
      memberApplicationService.reject(id, reason, reviewedBy),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(id) })
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Application rejected. Applicant notified.')
    },
    onError: () => toast.error('Failed to reject application'),
  })
}

export function useRequestMoreInfoMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, reviewedBy }: { id: string; reason: string; reviewedBy: string }) =>
      memberApplicationService.requestMoreInfo(id, reason, reviewedBy),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(id) })
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Info requested. Applicant notified.')
    },
    onError: () => toast.error('Failed to request info'),
  })
}

export function useDeleteMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memberApplicationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.lists() })
      toast.success('Application deleted')
    },
    onError: () => toast.error('Failed to delete application'),
  })
}

// ── Education Mutations ────────────────────────────────────────────────────────

export function useCreateMemberEducation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberEducationService.create>[0]) =>
      memberEducationService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(result.application_id) })
      toast.success('Education record added')
    },
    onError: () => toast.error('Failed to add education record'),
  })
}

export function useUpdateMemberEducation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appId, data }: { id: string; appId: string; data: Partial<MemberEducation> }) =>
      memberEducationService.update(id, data),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(appId) })
      toast.success('Education record updated')
    },
    onError: () => toast.error('Failed to update education record'),
  })
}

export function useDeleteMemberEducation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appId }: { id: string; appId: string }) =>
      memberEducationService.delete(id),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(appId) })
      toast.success('Education record deleted')
    },
    onError: () => toast.error('Failed to delete education record'),
  })
}

// ── Org Affiliation Mutations ──────────────────────────────────────────────────

export function useCreateMemberOrgAffiliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberOrgAffiliationService.create>[0]) =>
      memberOrgAffiliationService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(result.application_id) })
      toast.success('Organization affiliation added')
    },
    onError: () => toast.error('Failed to add organization affiliation'),
  })
}

export function useUpdateMemberOrgAffiliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appId, data }: { id: string; appId: string; data: Partial<MemberOrgAffiliation> }) =>
      memberOrgAffiliationService.update(id, data),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(appId) })
      toast.success('Organization affiliation updated')
    },
    onError: () => toast.error('Failed to update organization affiliation'),
  })
}

export function useDeleteMemberOrgAffiliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appId }: { id: string; appId: string }) =>
      memberOrgAffiliationService.delete(id),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(appId) })
      toast.success('Organization affiliation deleted')
    },
    onError: () => toast.error('Failed to delete organization affiliation'),
  })
}

// ── Engagement History Mutations ───────────────────────────────────────────────

export function useCreateMemberEngagementHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof memberEngagementHistoryService.create>[0]) =>
      memberEngagementHistoryService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(result.application_id) })
      toast.success('Engagement record added')
    },
    onError: () => toast.error('Failed to add engagement record'),
  })
}

export function useDeleteMemberEngagementHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, appId }: { id: string; appId: string }) =>
      memberEngagementHistoryService.delete(id),
    onSuccess: (_, { appId }) => {
      qc.invalidateQueries({ queryKey: memberApplicationKeys.detail(appId) })
      toast.success('Engagement record deleted')
    },
    onError: () => toast.error('Failed to delete engagement record'),
  })
}
