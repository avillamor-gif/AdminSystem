import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MemberApplication {
  id: string
  status: 'draft' | 'submitted' | 'under_review' | 'more_info_needed' | 'approved' | 'rejected'
  first_name: string
  last_name: string
  email: string
  age: number | null
  citizenship: string | null
  sex: string | null
  home_address: string | null
  office_address: string | null
  phone_home: string | null
  phone_office: string | null
  photo_url: string | null
  how_learned_about_ibon: string | null
  why_join: string | null
  publications_read: string | null
  endorser_name: string | null
  endorser_relationship: string | null
  endorser_email: string | null
  endorser_verified: boolean
  endorser_verified_at: string | null
  admin_notes: string | null
  admin_decision_reason: string | null
  created_by: string | null
  created_by_email: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  reference_number: string | null
  created_at: string | null
  updated_at: string | null
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_member_id: string | null
}

export interface MemberEducation {
  id: string
  application_id: string
  highest_attainment: string | null
  institution_name: string | null
  institution_address: string | null
  years_inclusive: string | null
  created_at: string | null
  updated_at: string | null
}

export interface MemberOrgAffiliation {
  id: string
  application_id: string
  organization_name: string
  position: string | null
  years_involved: number | null
  organization_address: string | null
  organization_type: string | null
  created_at: string | null
  updated_at: string | null
}

export interface MemberEngagementHistory {
  id: string
  application_id: string
  title: string | null
  engagement_type: string | null
  date_participated: string | null
  location: string | null
  participation_type: string | null
  created_at: string | null
}

export interface MemberApplicationWithRelations extends MemberApplication {
  education?: MemberEducation[]
  affiliations?: MemberOrgAffiliation[]
  engagements?: MemberEngagementHistory[]
}

// ── Member Applications Service ────────────────────────────────────────────────

export const memberApplicationService = {
  // Get all applications (admin only - handled by RLS)
  async getAll(filters?: { status?: string }): Promise<MemberApplication[]> {
    let query = supabase
      .from('member_applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    if (error) throw error
    return (data || []) as MemberApplication[]
  },

  // Get single application with all relations
  async getById(id: string): Promise<MemberApplicationWithRelations | null> {
    const { data: app, error: appError } = await supabase
      .from('member_applications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (appError) throw appError
    if (!app) return null

    // Fetch relations separately
    const [education, affiliations, engagements] = await Promise.all([
      supabase.from('member_education').select('*').eq('application_id', id),
      supabase.from('member_org_affiliations').select('*').eq('application_id', id),
      supabase.from('member_engagement_history').select('*').eq('application_id', id),
    ])

    return {
      ...(app as MemberApplication),
      education: (education.data || []) as MemberEducation[],
      affiliations: (affiliations.data || []) as MemberOrgAffiliation[],
      engagements: (engagements.data || []) as MemberEngagementHistory[],
    }
  },

  // Create application (returns with reference number)
  async create(payload: Omit<MemberApplication, 'id' | 'created_at' | 'updated_at' | 'reference_number'>): Promise<MemberApplication> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('member_applications')
      .insert({
        ...payload,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_by: user?.id || null,
        created_by_email: user?.email || payload.email || null,
      })
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Save as draft
  async saveDraft(payload: Partial<MemberApplication>): Promise<MemberApplication> {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('member_applications')
      .insert({
        ...payload,
        status: 'draft',
        created_by: user?.id || null,
        created_by_email: user?.email || payload.email || null,
      })
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Update application
  async update(id: string, payload: Partial<MemberApplication>): Promise<MemberApplication> {
    const { data, error } = await supabase
      .from('member_applications')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Approve application
  async approve(id: string, createdMemberId: string, reviewedBy: string): Promise<MemberApplication> {
    const { data, error } = await supabase
      .from('member_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        created_member_id: createdMemberId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Reject application
  async reject(id: string, reason: string, reviewedBy: string): Promise<MemberApplication> {
    const { data, error } = await supabase
      .from('member_applications')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        admin_decision_reason: reason,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Request more info
  async requestMoreInfo(id: string, reason: string, reviewedBy: string): Promise<MemberApplication> {
    const { data, error } = await supabase
      .from('member_applications')
      .update({
        status: 'more_info_needed',
        admin_decision_reason: reason,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberApplication
  },

  // Delete application (draft only)
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('member_applications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

// ── Education Service ──────────────────────────────────────────────────────────

export const memberEducationService = {
  async getByApplication(applicationId: string): Promise<MemberEducation[]> {
    const { data, error } = await supabase
      .from('member_education')
      .select('*')
      .eq('application_id', applicationId)
    
    if (error) throw error
    return (data || []) as MemberEducation[]
  },

  async create(payload: Omit<MemberEducation, 'id' | 'created_at' | 'updated_at'>): Promise<MemberEducation> {
    const { data, error } = await supabase
      .from('member_education')
      .insert(payload)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberEducation
  },

  async update(id: string, payload: Partial<MemberEducation>): Promise<MemberEducation> {
    const { data, error } = await supabase
      .from('member_education')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberEducation
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('member_education').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Org Affiliation Service ────────────────────────────────────────────────────

export const memberOrgAffiliationService = {
  async getByApplication(applicationId: string): Promise<MemberOrgAffiliation[]> {
    const { data, error } = await supabase
      .from('member_org_affiliations')
      .select('*')
      .eq('application_id', applicationId)
    
    if (error) throw error
    return (data || []) as MemberOrgAffiliation[]
  },

  async create(payload: Omit<MemberOrgAffiliation, 'id' | 'created_at' | 'updated_at'>): Promise<MemberOrgAffiliation> {
    const { data, error } = await supabase
      .from('member_org_affiliations')
      .insert(payload)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberOrgAffiliation
  },

  async update(id: string, payload: Partial<MemberOrgAffiliation>): Promise<MemberOrgAffiliation> {
    const { data, error } = await supabase
      .from('member_org_affiliations')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberOrgAffiliation
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('member_org_affiliations').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Engagement History Service ─────────────────────────────────────────────────

export const memberEngagementHistoryService = {
  async getByApplication(applicationId: string): Promise<MemberEngagementHistory[]> {
    const { data, error } = await supabase
      .from('member_engagement_history')
      .select('*')
      .eq('application_id', applicationId)
    
    if (error) throw error
    return (data || []) as MemberEngagementHistory[]
  },

  async create(payload: Omit<MemberEngagementHistory, 'id' | 'created_at'>): Promise<MemberEngagementHistory> {
    const { data, error } = await supabase
      .from('member_engagement_history')
      .insert(payload)
      .select('*')
      .single()
    
    if (error) throw error
    return data as MemberEngagementHistory
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('member_engagement_history').delete().eq('id', id)
    if (error) throw error
  },
}
