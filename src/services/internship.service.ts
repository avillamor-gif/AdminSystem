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
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('partner_institutions')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: PartnerInstitutionUpdate): Promise<PartnerInstitution> {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('partner_institutions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await (supabase as any).from('partner_institutions').delete().eq('id', id)
    if (error) throw error
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
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('program_enrollments')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, payload: ProgramEnrollmentUpdate): Promise<ProgramEnrollment> {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('program_enrollments')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await (supabase as any).from('program_enrollments').delete().eq('id', id)
    if (error) throw error
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
