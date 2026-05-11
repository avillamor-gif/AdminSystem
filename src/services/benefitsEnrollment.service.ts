import { createClient } from '../lib/supabase/client'

// ── Benefits Enrollment ───────────────────────────────────────

export type BenefitsCoverageType = 'employee_only' | 'with_dependents'
export type BereavementRelationship = 'parent' | 'sibling' | 'spouse' | 'child' | 'other'
export type BereavementClaimStatus = 'pending' | 'approved' | 'released' | 'rejected'

export interface EmployeeBenefitsEnrollment {
  id: string
  employee_id: string
  benefits_plan_id: string
  enrollment_date: string
  effectivity_date: string | null
  end_date: string | null
  is_active: boolean
  coverage_type: BenefitsCoverageType
  employee_share: number | null
  employer_share: number | null
  total_premium: number | null
  notes: string | null
  enrolled_by: string | null
  created_at: string
  updated_at: string
}

export interface EnrollmentWithRelations extends EmployeeBenefitsEnrollment {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
  benefits_plan?: { id: string; name: string; type: string; amount: number } | null
}

export interface EnrollmentInsert {
  employee_id: string
  benefits_plan_id: string
  enrollment_date?: string
  effectivity_date?: string | null
  coverage_type?: BenefitsCoverageType
  employee_share?: number | null
  employer_share?: number | null
  total_premium?: number | null
  notes?: string | null
  enrolled_by?: string | null
}

// ── Bereavement Assistance ────────────────────────────────────

export interface BereavementClaim {
  id: string
  employee_id: string
  deceased_name: string
  relationship: BereavementRelationship
  date_of_death: string
  amount: number
  status: BereavementClaimStatus
  approved_by: string | null
  approved_at: string | null
  released_at: string | null
  supporting_docs: { name: string; url: string }[] | null
  notes: string | null
  requested_by: string | null
  created_at: string
  updated_at: string
}

export interface BereavementClaimWithRelations extends BereavementClaim {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
}

export interface BereavementClaimInsert {
  employee_id: string
  deceased_name: string
  relationship: BereavementRelationship
  date_of_death: string
  amount?: number
  notes?: string | null
  requested_by?: string | null
}

export const benefitsEnrollmentService = {
  async getAll(): Promise<EnrollmentWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_benefits_enrollment')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const enrollments = (data || []) as EmployeeBenefitsEnrollment[]
    const employeeIds = [...new Set(enrollments.map(e => e.employee_id))]
    const planIds = [...new Set(enrollments.map(e => e.benefits_plan_id))]

    let empMap: Record<string, any> = {}
    let planMap: Record<string, any> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await supabase.from('employees').select('id, first_name, last_name, email, avatar_url').in('id', employeeIds)
      ;(emps || []).forEach((e: any) => { empMap[e.id] = e })
    }
    if (planIds.length > 0) {
      const { data: plans } = await supabase.from('benefits_plans').select('id, name, type, amount').in('id', planIds)
      ;(plans || []).forEach((p: any) => { planMap[p.id] = p })
    }

    return enrollments.map(e => ({ ...e, employee: empMap[e.employee_id] || null, benefits_plan: planMap[e.benefits_plan_id] || null }))
  },

  async getByEmployee(employeeId: string): Promise<EnrollmentWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_benefits_enrollment')
      .select('*')
      .eq('employee_id', employeeId)
      .order('enrollment_date', { ascending: false })
    if (error) throw error

    const enrollments = (data || []) as EmployeeBenefitsEnrollment[]
    const planIds = [...new Set(enrollments.map(e => e.benefits_plan_id))]
    let planMap: Record<string, any> = {}
    if (planIds.length > 0) {
      const { data: plans } = await supabase.from('benefits_plans').select('id, name, type, amount').in('id', planIds)
      ;(plans || []).forEach((p: any) => { planMap[p.id] = p })
    }
    return enrollments.map(e => ({ ...e, employee: null, benefits_plan: planMap[e.benefits_plan_id] || null }))
  },

  async enroll(payload: EnrollmentInsert): Promise<EmployeeBenefitsEnrollment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_benefits_enrollment')
      .insert({ ...payload, is_active: true } as never)
      .select('*')
      .single()
    if (error) throw error
    return data as EmployeeBenefitsEnrollment
  },

  async terminate(id: string, endDate: string): Promise<EmployeeBenefitsEnrollment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_benefits_enrollment')
      .update({ is_active: false, end_date: endDate } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as EmployeeBenefitsEnrollment
  },
}

export const bereavementService = {
  async getAll(): Promise<BereavementClaimWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const claims = (data || []) as BereavementClaim[]
    const empIds = [...new Set(claims.map(c => c.employee_id))]
    let empMap: Record<string, any> = {}
    if (empIds.length > 0) {
      const { data: emps } = await supabase.from('employees').select('id, first_name, last_name, email, avatar_url').in('id', empIds)
      ;(emps || []).forEach((e: any) => { empMap[e.id] = e })
    }
    return claims.map(c => ({ ...c, employee: empMap[c.employee_id] || null }))
  },

  async getByEmployee(employeeId: string): Promise<BereavementClaimWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(c => ({ ...c, employee: null })) as BereavementClaimWithRelations[]
  },

  async create(payload: BereavementClaimInsert): Promise<BereavementClaim> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .insert({ ...payload, amount: payload.amount ?? 15000 } as never)
      .select('*')
      .single()
    if (error) throw error
    return data as BereavementClaim
  },

  async approve(id: string, approverId: string): Promise<BereavementClaim> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .update({ status: 'approved', approved_by: approverId, approved_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BereavementClaim
  },

  async release(id: string): Promise<BereavementClaim> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .update({ status: 'released', released_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BereavementClaim
  },

  async reject(id: string, approverId: string, notes: string): Promise<BereavementClaim> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bereavement_assistance_claims')
      .update({ status: 'rejected', approved_by: approverId, approved_at: new Date().toISOString(), notes } as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BereavementClaim
  },
}
