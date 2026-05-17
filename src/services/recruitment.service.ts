import { createClient } from '../lib/supabase/client'

// ===================== TYPES =====================

export interface JobPosting {
  id: string
  title: string
  job_title_id?: string | null
  department_id?: string | null
  location_id?: string | null
  employment_type_id?: string | null
  description?: string | null
  requirements?: string | null
  responsibilities?: string | null
  salary_min?: number | null
  salary_max?: number | null
  headcount?: number | null
  status: 'draft' | 'open' | 'on_hold' | 'closed' | 'cancelled'
  posted_date?: string | null
  closing_date?: string | null
  is_internal?: boolean
  is_remote?: boolean
  posted_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type JobPostingInsert = Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>
export type JobPostingUpdate = Partial<JobPostingInsert>

export interface RecruitmentCandidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  address?: string | null
  current_employer?: string | null
  current_position?: string | null
  years_experience?: number | null
  highest_education?: string | null
  linkedin_url?: string | null
  resume_url?: string | null
  source?: 'direct' | 'referral' | 'job_board' | 'linkedin' | 'website' | 'agency' | 'other' | null
  tags?: string[] | null
  notes?: string | null
  is_talent_pool?: boolean
  created_at?: string | null
  updated_at?: string | null
}
export type RecruitmentCandidateInsert = Omit<RecruitmentCandidate, 'id' | 'created_at' | 'updated_at'>
export type RecruitmentCandidateUpdate = Partial<RecruitmentCandidateInsert>

export interface RecruitmentApplication {
  id: string
  job_posting_id?: string | null
  candidate_id?: string | null
  stage: 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  status: 'active' | 'on_hold' | 'rejected' | 'withdrawn' | 'hired'
  applied_date?: string | null
  resume_url?: string | null
  cover_letter?: string | null
  screening_score?: number | null
  notes?: string | null
  rejection_reason?: string | null
  assigned_to?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type RecruitmentApplicationInsert = Omit<RecruitmentApplication, 'id' | 'created_at' | 'updated_at'>
export type RecruitmentApplicationUpdate = Partial<RecruitmentApplicationInsert>

export interface RecruitmentInterview {
  id: string
  application_id: string
  interview_type: 'initial' | 'technical' | 'hr' | 'panel' | 'final' | 'culture_fit'
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  meeting_link?: string | null
  interviewers?: string[] | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  feedback?: string | null
  rating?: number | null
  recommendation?: 'strong_hire' | 'hire' | 'neutral' | 'no_hire' | 'strong_no_hire' | null
  created_at?: string | null
  updated_at?: string | null
}
export type RecruitmentInterviewInsert = Omit<RecruitmentInterview, 'id' | 'created_at' | 'updated_at'>
export type RecruitmentInterviewUpdate = Partial<RecruitmentInterviewInsert>

export interface RecruitmentOffer {
  id: string
  application_id: string
  offered_salary?: number | null
  offered_position?: string | null
  start_date?: string | null
  expiry_date?: string | null
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'negotiating' | 'expired' | 'withdrawn'
  offer_letter_url?: string | null
  notes?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type RecruitmentOfferInsert = Omit<RecruitmentOffer, 'id' | 'created_at' | 'updated_at'>
export type RecruitmentOfferUpdate = Partial<RecruitmentOfferInsert>

export interface RecruitmentOnboarding {
  id: string
  application_id: string
  task_name: string
  task_type?: 'document' | 'training' | 'account_setup' | 'orientation' | 'equipment' | 'other' | null
  due_date?: string | null
  completed_date?: string | null
  assigned_to?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type RecruitmentOnboardingInsert = Omit<RecruitmentOnboarding, 'id' | 'created_at' | 'updated_at'>
export type RecruitmentOnboardingUpdate = Partial<RecruitmentOnboardingInsert>

export interface ScreeningQuestion {
  id: string
  question: string
  question_type: 'text' | 'yes_no' | 'multiple_choice' | 'rating' | 'number'
  options?: any
  is_required?: boolean
  is_knockout?: boolean
  knockout_answer?: string | null
  job_posting_id?: string | null
  is_global?: boolean
  created_at?: string | null
  updated_at?: string | null
}
export type ScreeningQuestionInsert = Omit<ScreeningQuestion, 'id' | 'created_at' | 'updated_at'>
export type ScreeningQuestionUpdate = Partial<ScreeningQuestionInsert>

export interface HiringWorkflow {
  id: string
  name: string
  description?: string | null
  stages: any[]
  is_default?: boolean
  is_active?: boolean
  created_at?: string | null
  updated_at?: string | null
}
export type HiringWorkflowInsert = Omit<HiringWorkflow, 'id' | 'created_at' | 'updated_at'>
export type HiringWorkflowUpdate = Partial<HiringWorkflowInsert>

export interface JobBoard {
  id: string
  name: string
  url?: string | null
  api_key?: string | null
  is_active?: boolean
  auto_post?: boolean
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type JobBoardInsert = Omit<JobBoard, 'id' | 'created_at' | 'updated_at'>
export type JobBoardUpdate = Partial<JobBoardInsert>

export interface JobPostingFilters { status?: string; department_id?: string }
export interface CandidateFilters { search?: string; source?: string; is_talent_pool?: boolean }
export interface ApplicationFilters { job_posting_id?: string; stage?: string; status?: string }
export interface InterviewFilters { application_id?: string; status?: string; date_from?: string; date_to?: string }

// Kept for backward compat
export type Vacancy = JobPosting
export type VacancyInsert = JobPostingInsert
export type VacancyUpdate = JobPostingUpdate
export type VacancyWithRelations = JobPosting
export type Candidate = RecruitmentCandidate
export type CandidateInsert = RecruitmentCandidateInsert
export type CandidateUpdate = RecruitmentCandidateUpdate
export type CandidateWithRelations = RecruitmentCandidate
export type VacancyFilters = JobPostingFilters

// ===================== JOB POSTINGS =====================
export const jobPostingService = {
  async getAll(filters?: JobPostingFilters): Promise<JobPosting[]> {
    const supabase = createClient()
    let q = supabase.from('job_postings').select('*').order('created_at', { ascending: false })
    if (filters?.status) q = q.eq('status', filters.status as any)
    if (filters?.department_id) q = q.eq('department_id', filters.department_id)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as JobPosting[]
  },
  async create(payload: JobPostingInsert): Promise<JobPosting> {
    const supabase = createClient()
    const { data, error } = await supabase.from('job_postings').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as JobPosting
  },
  async update(id: string, payload: JobPostingUpdate): Promise<JobPosting> {
    const supabase = createClient()
    const { data, error } = await supabase.from('job_postings').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as JobPosting
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('job_postings').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== CANDIDATES =====================
export const recruitmentCandidateService = {
  async getAll(filters?: CandidateFilters): Promise<RecruitmentCandidate[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_candidates').select('*').order('created_at', { ascending: false })
    if (filters?.source) q = q.eq('source', filters.source as any)
    if (filters?.is_talent_pool !== undefined) q = q.eq('is_talent_pool', filters.is_talent_pool)
    if (filters?.search) q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as RecruitmentCandidate[]
  },
  async create(payload: RecruitmentCandidateInsert): Promise<RecruitmentCandidate> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_candidates').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentCandidate
  },
  async update(id: string, payload: RecruitmentCandidateUpdate): Promise<RecruitmentCandidate> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_candidates').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentCandidate
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_candidates').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== APPLICATIONS =====================
export const recruitmentApplicationService = {
  async getAll(filters?: ApplicationFilters): Promise<RecruitmentApplication[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_applications').select('*').order('applied_date', { ascending: false })
    if (filters?.job_posting_id) q = q.eq('job_posting_id', filters.job_posting_id)
    if (filters?.stage) q = q.eq('stage', filters.stage as any)
    if (filters?.status) q = q.eq('status', filters.status as any)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as RecruitmentApplication[]
  },
  async create(payload: RecruitmentApplicationInsert): Promise<RecruitmentApplication> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_applications').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentApplication
  },
  async update(id: string, payload: RecruitmentApplicationUpdate): Promise<RecruitmentApplication> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_applications').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentApplication
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_applications').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== INTERVIEWS =====================
export const recruitmentInterviewService = {
  async getAll(filters?: InterviewFilters): Promise<RecruitmentInterview[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_interviews').select('*').order('scheduled_date', { ascending: true })
    if (filters?.application_id) q = q.eq('application_id', filters.application_id)
    if (filters?.status) q = q.eq('status', filters.status as any)
    if (filters?.date_from) q = q.gte('scheduled_date', filters.date_from)
    if (filters?.date_to) q = q.lte('scheduled_date', filters.date_to)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as RecruitmentInterview[]
  },
  async create(payload: RecruitmentInterviewInsert): Promise<RecruitmentInterview> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_interviews').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentInterview
  },
  async update(id: string, payload: RecruitmentInterviewUpdate): Promise<RecruitmentInterview> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_interviews').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentInterview
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_interviews').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== OFFERS =====================
export const recruitmentOfferService = {
  async getAll(filters?: { status?: string }): Promise<RecruitmentOffer[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_offers').select('*').order('created_at', { ascending: false })
    if (filters?.status) q = q.eq('status', filters.status as any)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as RecruitmentOffer[]
  },
  async create(payload: RecruitmentOfferInsert): Promise<RecruitmentOffer> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_offers').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentOffer
  },
  async update(id: string, payload: RecruitmentOfferUpdate): Promise<RecruitmentOffer> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_offers').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentOffer
  },
}

// ===================== ONBOARDING =====================
export const recruitmentOnboardingService = {
  async getAll(filters?: { application_id?: string; status?: string }): Promise<RecruitmentOnboarding[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_onboarding').select('*').order('due_date', { ascending: true })
    if (filters?.application_id) q = q.eq('application_id', filters.application_id)
    if (filters?.status) q = q.eq('status', filters.status as any)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as RecruitmentOnboarding[]
  },
  async create(payload: RecruitmentOnboardingInsert): Promise<RecruitmentOnboarding> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_onboarding').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentOnboarding
  },
  async update(id: string, payload: RecruitmentOnboardingUpdate): Promise<RecruitmentOnboarding> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_onboarding').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as RecruitmentOnboarding
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_onboarding').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== SCREENING QUESTIONS =====================
export const screeningQuestionService = {
  async getAll(filters?: { job_posting_id?: string; is_global?: boolean }): Promise<ScreeningQuestion[]> {
    const supabase = createClient()
    let q = supabase.from('recruitment_screening_questions').select('*').order('created_at', { ascending: false })
    if (filters?.job_posting_id) q = q.eq('job_posting_id', filters.job_posting_id)
    if (filters?.is_global !== undefined) q = q.eq('is_global', filters.is_global)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as unknown as ScreeningQuestion[]
  },
  async create(payload: ScreeningQuestionInsert): Promise<ScreeningQuestion> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_screening_questions').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as ScreeningQuestion
  },
  async update(id: string, payload: ScreeningQuestionUpdate): Promise<ScreeningQuestion> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_screening_questions').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as ScreeningQuestion
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_screening_questions').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== HIRING WORKFLOWS =====================
export const hiringWorkflowService = {
  async getAll(): Promise<HiringWorkflow[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_hiring_workflows').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as unknown as HiringWorkflow[]
  },
  async create(payload: HiringWorkflowInsert): Promise<HiringWorkflow> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_hiring_workflows').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as HiringWorkflow
  },
  async update(id: string, payload: HiringWorkflowUpdate): Promise<HiringWorkflow> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_hiring_workflows').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as HiringWorkflow
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_hiring_workflows').delete().eq('id', id)
    if (error) throw error
  },
}

// ===================== JOB BOARDS =====================
export const jobBoardService = {
  async getAll(): Promise<JobBoard[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_job_boards').select('*').order('name')
    if (error) throw error
    return (data || []) as unknown as JobBoard[]
  },
  async create(payload: JobBoardInsert): Promise<JobBoard> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_job_boards').insert(payload as any).select('*').single()
    if (error) throw error
    return data as unknown as JobBoard
  },
  async update(id: string, payload: JobBoardUpdate): Promise<JobBoard> {
    const supabase = createClient()
    const { data, error } = await supabase.from('recruitment_job_boards').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as JobBoard
  },
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('recruitment_job_boards').delete().eq('id', id)
    if (error) throw error
  },
}

// Backward-compat alias
export const recruitmentService = {
  getVacancies: (f?: JobPostingFilters) => jobPostingService.getAll(f),
  getVacancyById: async (id: string) => (await jobPostingService.getAll()).find(v => v.id === id) ?? null,
  createVacancy: (v: JobPostingInsert) => jobPostingService.create(v),
  updateVacancy: (id: string, v: JobPostingUpdate) => jobPostingService.update(id, v),
  deleteVacancy: (id: string) => jobPostingService.delete(id),
  getCandidates: (f?: CandidateFilters) => recruitmentCandidateService.getAll(f),
  getCandidateById: async (id: string) => (await recruitmentCandidateService.getAll()).find(c => c.id === id) ?? null,
  createCandidate: (c: RecruitmentCandidateInsert) => recruitmentCandidateService.create(c),
  updateCandidate: (id: string, c: RecruitmentCandidateUpdate) => recruitmentCandidateService.update(id, c),
  deleteCandidate: (id: string) => recruitmentCandidateService.delete(id),
  updateCandidateStatus: (id: string, status: string) => recruitmentCandidateService.update(id, { is_talent_pool: undefined } as any),
}
