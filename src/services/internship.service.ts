import { createClient } from '@/lib/supabase/client'

// ─── Partner Institution ──────────────────────────────────────────────────────

export interface PartnerInstitution {
  id: string
  name: string
  short_name: string | null
  type: 'university' | 'college' | 'technical' | 'ngo' | 'government' | 'other'
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  city: string | null
  country: string | null
  moa_number: string | null
  moa_signed_date: string | null
  moa_expiry_date: string | null
  moa_status: 'active' | 'expired' | 'pending' | 'terminated'
  moa_file_path: string | null
  max_slots_per_term: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PartnerInstitutionInsert = Omit<PartnerInstitution, 'id' | 'created_at' | 'updated_at'>
export type PartnerInstitutionUpdate = Partial<PartnerInstitutionInsert>

// ─── Program Enrollment ───────────────────────────────────────────────────────

export interface ProgramEnrollment {
  id: string
  employee_id: string
  partner_institution_id: string | null
  program_type: 'internship' | 'ojt' | 'volunteer' | 'practicum' | 'apprenticeship'
  department_id: string | null
  supervisor_id: string | null
  school_coordinator: string | null
  school_coordinator_email: string | null
  endorsement_letter_path: string | null
  start_date: string
  end_date: string | null
  required_hours: number
  rendered_hours: number
  status: 'active' | 'completed' | 'dropped' | 'extended' | 'pending'
  certificate_issued: boolean
  certificate_issued_at: string | null
  certificate_file_path: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProgramEnrollmentWithRelations extends ProgramEnrollment {
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  partner_institution?: {
    id: string
    name: string
    short_name: string | null
    moa_status: string
  }
  department?: { id: string; name: string }
  supervisor?: {
    id: string
    first_name: string
    last_name: string
  }
}

export type ProgramEnrollmentInsert = Omit<ProgramEnrollment, 'id' | 'created_at' | 'updated_at'>
export type ProgramEnrollmentUpdate = Partial<ProgramEnrollmentInsert>

// ─── Service ──────────────────────────────────────────────────────────────────

export const partnerInstitutionService = {
  async getAll(filters?: { is_active?: boolean; moa_status?: string }): Promise<PartnerInstitution[]> {
    const supabase = createClient()
    let query = (supabase as any).from('partner_institutions').select('*').order('name')
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active)
    if (filters?.moa_status) query = query.eq('moa_status', filters.moa_status)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<PartnerInstitution | null> {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('partner_institutions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(payload: PartnerInstitutionInsert): Promise<PartnerInstitution> {
    const res = await fetch('/api/admin/partner-institutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create partner institution')
    return json as PartnerInstitution
  },

  async update(id: string, payload: PartnerInstitutionUpdate): Promise<PartnerInstitution> {
    const res = await fetch('/api/admin/partner-institutions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to update partner institution')
    return json as PartnerInstitution
  },

  async delete(id: string): Promise<void> {
    const res = await fetch('/api/admin/partner-institutions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Failed to delete partner institution')
    }
  },

  // Upload MOA PDF via server-side API route (uses admin client + mirrors to Google Drive)
  async uploadMoaFile(file: File, institutionId: string, institutionName?: string): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    form.append('institutionId', institutionId)
    if (institutionName) form.append('institutionName', institutionName)

    const res = await fetch('/api/internship/upload-moa', { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'MOA upload failed')
    }
    const { path } = await res.json()
    return path as string
  },

  async getMoaUrl(filePath: string): Promise<string> {
    const supabase = createClient()
    const { data } = await supabase.storage.from('moa-documents').createSignedUrl(filePath, 3600)
    return data?.signedUrl ?? ''
  },
}

export const programEnrollmentService = {
  async getAll(filters?: {
    status?: string
    program_type?: string
    partner_institution_id?: string
  }): Promise<ProgramEnrollmentWithRelations[]> {
    const supabase = createClient()
    let query = (supabase as any)
      .from('program_enrollments')
      .select('*')
      .order('created_at', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.program_type) query = query.eq('program_type', filters.program_type)
    if (filters?.partner_institution_id) query = query.eq('partner_institution_id', filters.partner_institution_id)
    const { data, error } = await query
    if (error) throw error

    const enrollments: ProgramEnrollment[] = data ?? []
    if (enrollments.length === 0) return []

    // Fetch related records separately (per copilot-instructions pattern)
    const employeeIds = [...new Set(enrollments.map(e => e.employee_id).filter(Boolean))]
    const institutionIds = [...new Set(enrollments.map(e => e.partner_institution_id).filter(Boolean))]
    const departmentIds = [...new Set(enrollments.map(e => e.department_id).filter(Boolean))]
    const supervisorIds = [...new Set(enrollments.map(e => e.supervisor_id).filter(Boolean))]

    const [empRes, instRes, deptRes, supRes] = await Promise.all([
      employeeIds.length
        ? (supabase as any).from('employees').select('id, employee_id, first_name, last_name, avatar_url').in('id', employeeIds)
        : { data: [] },
      institutionIds.length
        ? (supabase as any).from('partner_institutions').select('id, name, short_name, moa_status').in('id', institutionIds)
        : { data: [] },
      departmentIds.length
        ? (supabase as any).from('departments').select('id, name').in('id', departmentIds)
        : { data: [] },
      supervisorIds.length
        ? (supabase as any).from('employees').select('id, first_name, last_name').in('id', supervisorIds)
        : { data: [] },
    ])

    const empMap = Object.fromEntries((empRes.data ?? []).map((e: any) => [e.id, e]))
    const instMap = Object.fromEntries((instRes.data ?? []).map((i: any) => [i.id, i]))
    const deptMap = Object.fromEntries((deptRes.data ?? []).map((d: any) => [d.id, d]))
    const supMap = Object.fromEntries((supRes.data ?? []).map((s: any) => [s.id, s]))

    return enrollments.map(e => ({
      ...e,
      employee: empMap[e.employee_id],
      partner_institution: e.partner_institution_id ? instMap[e.partner_institution_id] : undefined,
      department: e.department_id ? deptMap[e.department_id] : undefined,
      supervisor: e.supervisor_id ? supMap[e.supervisor_id] : undefined,
    }))
  },

  async getById(id: string): Promise<ProgramEnrollmentWithRelations | null> {
    const all = await programEnrollmentService.getAll()
    return all.find(e => e.id === id) ?? null
  },

  async create(payload: ProgramEnrollmentInsert): Promise<ProgramEnrollment> {
    const res = await fetch('/api/admin/program-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create enrollment')
    return json as ProgramEnrollment
  },

  async update(id: string, payload: ProgramEnrollmentUpdate): Promise<ProgramEnrollment> {
    const res = await fetch('/api/admin/program-enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to update enrollment')
    return json as ProgramEnrollment
  },

  async delete(id: string): Promise<void> {
    const res = await fetch('/api/admin/program-enrollments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Failed to delete enrollment')
    }
  },

  async markCertificateIssued(id: string, filePath?: string): Promise<ProgramEnrollment> {
    return programEnrollmentService.update(id, {
      certificate_issued: true,
      certificate_issued_at: new Date().toISOString(),
      status: 'completed',
      certificate_file_path: filePath ?? null,
    })
  },

  async uploadEndorsementLetter(file: File, enrollmentId: string): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `endorsements/${enrollmentId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('moa-documents').upload(path, file, { upsert: true })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    return path
  },
}

// ─── Internship Assessment ────────────────────────────────────────────────────

export type AssessmentRating = 1 | 2 | 3 | 4 | 5 | 6 | null

export interface InternshipAssessment {
  id: string
  enrollment_id: string
  // Part I – General Workplace Performance
  r_attendance:           AssessmentRating
  r_punctuality:          AssessmentRating
  r_appropriate_dress:    AssessmentRating
  r_attitude:             AssessmentRating
  r_acceptance_criticism: AssessmentRating
  r_asks_questions:       AssessmentRating
  r_self_motivated:       AssessmentRating
  r_ethical_behaviour:    AssessmentRating
  // Part I – Specific Job Assignment Performance
  r_job_knowledge:        AssessmentRating
  r_verbal_communication: AssessmentRating
  r_written_communication:AssessmentRating
  r_analytical_skills:    AssessmentRating
  r_technical_skills:     AssessmentRating
  r_meets_deadlines:      AssessmentRating
  r_takes_initiative:     AssessmentRating
  r_sets_priorities:      AssessmentRating
  // Part I – Open-ended
  strengths_weaknesses:     string | null
  important_achievements:   string | null
  most_difficult:           string | null
  likes_dislikes:           string | null
  overall_performance:      'outstanding' | 'above_average' | 'satisfactory' | 'below_average' | 'unsatisfactory' | null
  intern_other_comments:    string | null
  // Part II – Supervisor
  supervisor_strengths_areas: string | null
  supervisor_comments:        string | null
  // Workflow
  status: 'pending' | 'part1_complete' | 'complete'
  part1_submitted_at: string | null
  part2_submitted_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InternshipAssessmentWithRelations extends InternshipAssessment {
  enrollment?: ProgramEnrollmentWithRelations
}

export type InternshipAssessmentInsert = Pick<InternshipAssessment, 'enrollment_id' | 'created_by'>
export type InternshipAssessmentPart1Update = Pick<
  InternshipAssessment,
  | 'r_attendance' | 'r_punctuality' | 'r_appropriate_dress' | 'r_attitude'
  | 'r_acceptance_criticism' | 'r_asks_questions' | 'r_self_motivated' | 'r_ethical_behaviour'
  | 'r_job_knowledge' | 'r_verbal_communication' | 'r_written_communication' | 'r_analytical_skills'
  | 'r_technical_skills' | 'r_meets_deadlines' | 'r_takes_initiative' | 'r_sets_priorities'
  | 'strengths_weaknesses' | 'important_achievements' | 'most_difficult' | 'likes_dislikes'
  | 'overall_performance' | 'intern_other_comments'
>
export type InternshipAssessmentPart2Update = Pick<
  InternshipAssessment, 'supervisor_strengths_areas' | 'supervisor_comments'
>

export const internshipAssessmentService = {
  async getAll(filters?: { enrollment_id?: string }): Promise<InternshipAssessmentWithRelations[]> {
    const supabase = createClient()
    let query = (supabase as any)
      .from('internship_assessments')
      .select('*')
      .order('created_at', { ascending: false })
    if (filters?.enrollment_id) query = query.eq('enrollment_id', filters.enrollment_id)
    const { data, error } = await query
    if (error) throw error
    const assessments: InternshipAssessment[] = data ?? []
    if (assessments.length === 0) return []

    // Attach enrollment with relations
    const enrollmentIds = [...new Set(assessments.map(a => a.enrollment_id))]
    const allEnrollments = await programEnrollmentService.getAll()
    const enrollmentMap = Object.fromEntries(
      allEnrollments.filter(e => enrollmentIds.includes(e.id)).map(e => [e.id, e])
    )
    return assessments.map(a => ({ ...a, enrollment: enrollmentMap[a.enrollment_id] }))
  },

  async getByEnrollment(enrollmentId: string): Promise<InternshipAssessmentWithRelations | null> {
    const all = await internshipAssessmentService.getAll({ enrollment_id: enrollmentId })
    return all[0] ?? null
  },

  async create(payload: InternshipAssessmentInsert): Promise<InternshipAssessment> {
    const res = await fetch('/api/admin/internship-assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create assessment')
    return json as InternshipAssessment
  },

  async update(id: string, payload: Partial<InternshipAssessment>): Promise<InternshipAssessment> {
    const res = await fetch('/api/admin/internship-assessments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to update assessment')
    return json as InternshipAssessment
  },

  async delete(id: string): Promise<void> {
    const res = await fetch('/api/admin/internship-assessments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Failed to delete assessment')
    }
  },
}
