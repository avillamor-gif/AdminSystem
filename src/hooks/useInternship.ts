import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  partnerInstitutionService,
  programEnrollmentService,
  internshipAssessmentService,
  type PartnerInstitution,
  type PartnerInstitutionInsert,
  type PartnerInstitutionUpdate,
  type ProgramEnrollmentInsert,
  type ProgramEnrollmentUpdate,
  type ProgramEnrollmentWithRelations,
  type InternshipAssessment,
  type InternshipAssessmentInsert,
  type InternshipAssessmentPart1Update,
  type InternshipAssessmentPart2Update,
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
    mutationFn: async ({ file, institutionId, institutionName }: { file: File; institutionId: string; institutionName?: string }) => {
      // API route handles storage upload + DB update + Drive sync
      const path = await partnerInstitutionService.uploadMoaFile(file, institutionId, institutionName)
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

// ─── Assessment Query Keys ────────────────────────────────────────────────────

export const assessmentKeys = {
  all: ['internship_assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (filters: object) => [...assessmentKeys.lists(), filters] as const,
  byEnrollment: (enrollmentId: string) => [...assessmentKeys.all, 'enrollment', enrollmentId] as const,
}

// ─── Assessment Hooks ─────────────────────────────────────────────────────────

export function useInternshipAssessments(filters?: { enrollment_id?: string }) {
  return useQuery({
    queryKey: assessmentKeys.list(filters ?? {}),
    queryFn: () => internshipAssessmentService.getAll(filters),
  })
}

export function useInternshipAssessmentByEnrollment(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: assessmentKeys.byEnrollment(enrollmentId ?? ''),
    queryFn: () => internshipAssessmentService.getByEnrollment(enrollmentId!),
    enabled: !!enrollmentId,
  })
}

export function useCreateInternshipAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InternshipAssessmentInsert) => internshipAssessmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      toast.success('Assessment form created')
    },
    onError: () => toast.error('Failed to create assessment'),
  })
}

export function useSubmitAssessmentPart1() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InternshipAssessmentPart1Update }) =>
      internshipAssessmentService.update(id, {
        ...data,
        status: 'part1_complete',
        part1_submitted_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      toast.success('Part I submitted successfully')
    },
    onError: () => toast.error('Failed to submit Part I'),
  })
}

export function useSubmitAssessmentPart2() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InternshipAssessmentPart2Update }) =>
      internshipAssessmentService.update(id, {
        ...data,
        status: 'complete',
        part2_submitted_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      toast.success('Assessment completed')
    },
    onError: () => toast.error('Failed to submit Part II'),
  })
}

export function useDeleteInternshipAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => internshipAssessmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() })
      toast.success('Assessment deleted')
    },
    onError: () => toast.error('Failed to delete assessment'),
  })
}
