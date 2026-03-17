import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  partnerInstitutionService,
  programEnrollmentService,
  type PartnerInstitution,
  type PartnerInstitutionInsert,
  type PartnerInstitutionUpdate,
  type ProgramEnrollmentInsert,
  type ProgramEnrollmentUpdate,
  type ProgramEnrollmentWithRelations,
} from '@/services/internship.service'

// ─── Query Key Factories ──────────────────────────────────────────────────────

export const partnerInstitutionKeys = {
  all: ['partner_institutions'] as const,
  lists: () => [...partnerInstitutionKeys.all, 'list'] as const,
  list: (filters: object) => [...partnerInstitutionKeys.lists(), filters] as const,
  detail: (id: string) => [...partnerInstitutionKeys.all, id] as const,
}

export const programEnrollmentKeys = {
  all: ['program_enrollments'] as const,
  lists: () => [...programEnrollmentKeys.all, 'list'] as const,
  list: (filters: object) => [...programEnrollmentKeys.lists(), filters] as const,
  detail: (id: string) => [...programEnrollmentKeys.all, id] as const,
}

// ─── Partner Institution Hooks ────────────────────────────────────────────────

export function usePartnerInstitutions(filters?: { is_active?: boolean; moa_status?: string }) {
  return useQuery({
    queryKey: partnerInstitutionKeys.list(filters ?? {}),
    queryFn: () => partnerInstitutionService.getAll(filters),
  })
}

export function useCreatePartnerInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PartnerInstitutionInsert) => partnerInstitutionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerInstitutionKeys.lists() })
      toast.success('Partner institution created')
    },
    onError: () => toast.error('Failed to create partner institution'),
  })
}

export function useUpdatePartnerInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartnerInstitutionUpdate }) =>
      partnerInstitutionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerInstitutionKeys.lists() })
      toast.success('Partner institution updated')
    },
    onError: () => toast.error('Failed to update partner institution'),
  })
}

export function useDeletePartnerInstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => partnerInstitutionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerInstitutionKeys.lists() })
      toast.success('Partner institution deleted')
    },
    onError: () => toast.error('Failed to delete partner institution'),
  })
}

export function useUploadMoaFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, institutionId }: { file: File; institutionId: string }) => {
      const path = await partnerInstitutionService.uploadMoaFile(file, institutionId)
      await partnerInstitutionService.update(institutionId, { moa_file_path: path })
      return path
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerInstitutionKeys.lists() })
      toast.success('MOA document uploaded')
    },
    onError: () => toast.error('Failed to upload MOA document'),
  })
}

// ─── Program Enrollment Hooks ─────────────────────────────────────────────────

export function useProgramEnrollments(filters?: {
  status?: string
  program_type?: string
  partner_institution_id?: string
}) {
  return useQuery({
    queryKey: programEnrollmentKeys.list(filters ?? {}),
    queryFn: () => programEnrollmentService.getAll(filters),
  })
}

export function useCreateProgramEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProgramEnrollmentInsert) => programEnrollmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programEnrollmentKeys.lists() })
      toast.success('Enrollment created')
    },
    onError: () => toast.error('Failed to create enrollment'),
  })
}

export function useUpdateProgramEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProgramEnrollmentUpdate }) =>
      programEnrollmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programEnrollmentKeys.lists() })
      toast.success('Enrollment updated')
    },
    onError: () => toast.error('Failed to update enrollment'),
  })
}

export function useDeleteProgramEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => programEnrollmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programEnrollmentKeys.lists() })
      toast.success('Enrollment deleted')
    },
    onError: () => toast.error('Failed to delete enrollment'),
  })
}

export function useMarkCertificateIssued() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath?: string }) =>
      programEnrollmentService.markCertificateIssued(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programEnrollmentKeys.lists() })
      toast.success('Certificate marked as issued')
    },
    onError: () => toast.error('Failed to mark certificate'),
  })
}
