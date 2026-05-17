import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  jobPostingService, recruitmentCandidateService, recruitmentApplicationService,
  recruitmentInterviewService, recruitmentOfferService, recruitmentOnboardingService,
  screeningQuestionService, hiringWorkflowService, jobBoardService,
} from '@/services'
import type {
  JobPostingInsert, JobPostingUpdate, JobPostingFilters,
  RecruitmentCandidateInsert, RecruitmentCandidateUpdate, CandidateFilters,
  RecruitmentApplicationInsert, RecruitmentApplicationUpdate, ApplicationFilters,
  RecruitmentInterviewInsert, RecruitmentInterviewUpdate, InterviewFilters,
  RecruitmentOfferInsert, RecruitmentOfferUpdate,
  RecruitmentOnboardingInsert, RecruitmentOnboardingUpdate,
  ScreeningQuestionInsert, ScreeningQuestionUpdate,
  HiringWorkflowInsert, HiringWorkflowUpdate,
  JobBoardInsert, JobBoardUpdate,
} from '@/services'
import toast from 'react-hot-toast'

// ===================== JOB POSTINGS =====================
export function useJobPostings(filters?: JobPostingFilters) {
  return useQuery({ queryKey: ['job_postings', filters], queryFn: () => jobPostingService.getAll(filters) })
}
export function useCreateJobPosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: JobPostingInsert) => jobPostingService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_postings'] }); toast.success('Job posting created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create job posting'),
  })
}
export function useUpdateJobPosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobPostingUpdate }) => jobPostingService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_postings'] }); toast.success('Job posting updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update job posting'),
  })
}
export function useDeleteJobPosting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobPostingService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_postings'] }); toast.success('Job posting deleted') },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  })
}

// ===================== CANDIDATES =====================
export function useRecruitmentCandidates(filters?: CandidateFilters) {
  return useQuery({ queryKey: ['recruitment_candidates', filters], queryFn: () => recruitmentCandidateService.getAll(filters) })
}
export function useCreateRecruitmentCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecruitmentCandidateInsert) => recruitmentCandidateService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_candidates'] }); toast.success('Candidate added') },
    onError: (e: Error) => toast.error(e.message || 'Failed to add candidate'),
  })
}
export function useUpdateRecruitmentCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruitmentCandidateUpdate }) => recruitmentCandidateService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_candidates'] }); toast.success('Candidate updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update candidate'),
  })
}
export function useDeleteRecruitmentCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentCandidateService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_candidates'] }); toast.success('Candidate removed') },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove candidate'),
  })
}

// ===================== APPLICATIONS =====================
export function useRecruitmentApplications(filters?: ApplicationFilters) {
  return useQuery({ queryKey: ['recruitment_applications', filters], queryFn: () => recruitmentApplicationService.getAll(filters) })
}
export function useCreateRecruitmentApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecruitmentApplicationInsert) => recruitmentApplicationService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_applications'] }); toast.success('Application created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create application'),
  })
}
export function useUpdateRecruitmentApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruitmentApplicationUpdate }) => recruitmentApplicationService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_applications'] }); toast.success('Application updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update application'),
  })
}
export function useDeleteRecruitmentApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentApplicationService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_applications'] }); toast.success('Application removed') },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove application'),
  })
}

// ===================== INTERVIEWS =====================
export function useRecruitmentInterviews(filters?: InterviewFilters) {
  return useQuery({ queryKey: ['recruitment_interviews', filters], queryFn: () => recruitmentInterviewService.getAll(filters) })
}
export function useCreateRecruitmentInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecruitmentInterviewInsert) => recruitmentInterviewService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_interviews'] }); toast.success('Interview scheduled') },
    onError: (e: Error) => toast.error(e.message || 'Failed to schedule interview'),
  })
}
export function useUpdateRecruitmentInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruitmentInterviewUpdate }) => recruitmentInterviewService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_interviews'] }); toast.success('Interview updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update interview'),
  })
}
export function useDeleteRecruitmentInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentInterviewService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_interviews'] }); toast.success('Interview removed') },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove interview'),
  })
}

// ===================== OFFERS =====================
export function useRecruitmentOffers(filters?: { status?: string }) {
  return useQuery({ queryKey: ['recruitment_offers', filters], queryFn: () => recruitmentOfferService.getAll(filters) })
}
export function useCreateRecruitmentOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecruitmentOfferInsert) => recruitmentOfferService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_offers'] }); toast.success('Offer created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create offer'),
  })
}
export function useUpdateRecruitmentOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruitmentOfferUpdate }) => recruitmentOfferService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_offers'] }); toast.success('Offer updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update offer'),
  })
}

// ===================== ONBOARDING =====================
export function useRecruitmentOnboarding(filters?: { application_id?: string; status?: string }) {
  return useQuery({ queryKey: ['recruitment_onboarding', filters], queryFn: () => recruitmentOnboardingService.getAll(filters) })
}
export function useCreateRecruitmentOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecruitmentOnboardingInsert) => recruitmentOnboardingService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_onboarding'] }); toast.success('Task created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create task'),
  })
}
export function useUpdateRecruitmentOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecruitmentOnboardingUpdate }) => recruitmentOnboardingService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_onboarding'] }); toast.success('Task updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update task'),
  })
}
export function useDeleteRecruitmentOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentOnboardingService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recruitment_onboarding'] }); toast.success('Task removed') },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove task'),
  })
}

// ===================== SCREENING QUESTIONS =====================
export function useScreeningQuestions(filters?: { job_posting_id?: string; is_global?: boolean }) {
  return useQuery({ queryKey: ['screening_questions', filters], queryFn: () => screeningQuestionService.getAll(filters) })
}
export function useCreateScreeningQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ScreeningQuestionInsert) => screeningQuestionService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['screening_questions'] }); toast.success('Question created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create question'),
  })
}
export function useUpdateScreeningQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScreeningQuestionUpdate }) => screeningQuestionService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['screening_questions'] }); toast.success('Question updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update question'),
  })
}
export function useDeleteScreeningQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => screeningQuestionService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['screening_questions'] }); toast.success('Question deleted') },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete question'),
  })
}

// ===================== HIRING WORKFLOWS =====================
export function useHiringWorkflows() {
  return useQuery({ queryKey: ['hiring_workflows'], queryFn: () => hiringWorkflowService.getAll() })
}
export function useCreateHiringWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: HiringWorkflowInsert) => hiringWorkflowService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring_workflows'] }); toast.success('Workflow created') },
    onError: (e: Error) => toast.error(e.message || 'Failed to create workflow'),
  })
}
export function useUpdateHiringWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HiringWorkflowUpdate }) => hiringWorkflowService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring_workflows'] }); toast.success('Workflow updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update workflow'),
  })
}
export function useDeleteHiringWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hiringWorkflowService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring_workflows'] }); toast.success('Workflow deleted') },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete workflow'),
  })
}

// ===================== JOB BOARDS =====================
export function useJobBoards() {
  return useQuery({ queryKey: ['job_boards'], queryFn: () => jobBoardService.getAll() })
}
export function useCreateJobBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: JobBoardInsert) => jobBoardService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_boards'] }); toast.success('Job board added') },
    onError: (e: Error) => toast.error(e.message || 'Failed to add job board'),
  })
}
export function useUpdateJobBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobBoardUpdate }) => jobBoardService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_boards'] }); toast.success('Job board updated') },
    onError: (e: Error) => toast.error(e.message || 'Failed to update job board'),
  })
}
export function useDeleteJobBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobBoardService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_boards'] }); toast.success('Job board removed') },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove job board'),
  })
}

// Backward-compat aliases
export const useVacancies = useJobPostings
export const useCreateVacancy = useCreateJobPosting
export const useUpdateVacancy = useUpdateJobPosting
export const useDeleteVacancy = useDeleteJobPosting
export const useCandidates = useRecruitmentCandidates
export const useCreateCandidate = useCreateRecruitmentCandidate
export const useUpdateCandidate = useUpdateRecruitmentCandidate
export const useDeleteCandidate = useDeleteRecruitmentCandidate

