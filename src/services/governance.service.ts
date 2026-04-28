import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BoardTrustee {
  id: string
  trustee_number: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  avatar_url: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'deceased'
  created_at: string | null
  updated_at: string | null
  // Joined
  current_term?: BoardTerm | null
}

export interface BoardTerm {
  id: string
  trustee_id: string
  position: 'Chairperson' | 'Vice Chairperson' | 'Secretary' | 'Treasurer' | 'Trustee'
  term_start: string
  term_end: string | null
  is_current: boolean
  notes: string | null
  created_at: string | null
  updated_at: string | null
  // Joined
  trustee?: BoardTrustee | null
}

export interface Member {
  id: string
  member_number: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  membership_type: 'regular' | 'associate' | 'honorary' | 'institutional'
  status: 'active' | 'inactive' | 'suspended' | 'lapsed' | 'deceased'
  date_admitted: string | null
  notes: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface GeneralAssembly {
  id: string
  title: string
  ga_date: string
  location: string | null
  description: string | null
  minutes_url: string | null
  status: 'upcoming' | 'completed' | 'cancelled'
  created_at: string | null
  updated_at: string | null
  // Computed
  attendee_count?: number
}

export interface GaAttendee {
  id: string
  ga_id: string
  member_id: string
  notes: string | null
  created_at: string | null
  // Joined
  member?: Member | null
}

// ── Board Trustees ─────────────────────────────────────────────────────────────

export const boardTrusteeService = {
  async getAll(): Promise<BoardTrustee[]> {
    const { data, error } = await supabase
      .from('board_trustees')
      .select('*')
      .order('last_name')
    if (error) throw error
    return (data || []) as BoardTrustee[]
  },

  async getById(id: string): Promise<BoardTrustee | null> {
    const { data, error } = await supabase
      .from('board_trustees')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as BoardTrustee | null
  },

  async create(payload: Omit<BoardTrustee, 'id' | 'created_at' | 'updated_at' | 'current_term'>): Promise<BoardTrustee> {
    const { data, error } = await supabase
      .from('board_trustees')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as BoardTrustee
  },

  async update(id: string, payload: Partial<BoardTrustee>): Promise<BoardTrustee> {
    const { data, error } = await supabase
      .from('board_trustees')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BoardTrustee
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('board_trustees').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Board Terms ────────────────────────────────────────────────────────────────

export const boardTermService = {
  async getAll(filters?: { trustee_id?: string; is_current?: boolean }): Promise<BoardTerm[]> {
    let query = supabase
      .from('board_terms')
      .select('*')
      .order('term_start', { ascending: false })
    if (filters?.trustee_id) query = query.eq('trustee_id', filters.trustee_id)
    if (filters?.is_current !== undefined) query = query.eq('is_current', filters.is_current)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as BoardTerm[]
  },

  async create(payload: Omit<BoardTerm, 'id' | 'created_at' | 'updated_at' | 'trustee'>): Promise<BoardTerm> {
    const { data, error } = await supabase
      .from('board_terms')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as BoardTerm
  },

  async update(id: string, payload: Partial<BoardTerm>): Promise<BoardTerm> {
    const { data, error } = await supabase
      .from('board_terms')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BoardTerm
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('board_terms').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Members ────────────────────────────────────────────────────────────────────

export const memberService = {
  async getAll(filters?: { status?: string; membership_type?: string }): Promise<Member[]> {
    let query = supabase.from('members').select('*').order('last_name')
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.membership_type) query = query.eq('membership_type', filters.membership_type)
    const { data, error } = await query
    if (error) throw error
    return (data || []) as Member[]
  },

  async create(payload: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as Member
  },

  async update(id: string, payload: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Member
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error
  },
}

// ── General Assemblies ─────────────────────────────────────────────────────────

export const generalAssemblyService = {
  async getAll(): Promise<GeneralAssembly[]> {
    const { data, error } = await supabase
      .from('general_assemblies')
      .select('*')
      .order('ga_date', { ascending: false })
    if (error) throw error
    // Fetch attendee counts separately
    const gas = (data || []) as GeneralAssembly[]
    if (gas.length === 0) return gas
    const { data: counts } = await supabase
      .from('ga_attendees')
      .select('ga_id')
      .in('ga_id', gas.map(g => g.id))
    const countMap: Record<string, number> = {}
    for (const row of counts || []) {
      countMap[row.ga_id] = (countMap[row.ga_id] || 0) + 1
    }
    return gas.map(g => ({ ...g, attendee_count: countMap[g.id] || 0 }))
  },

  async create(payload: Omit<GeneralAssembly, 'id' | 'created_at' | 'updated_at' | 'attendee_count'>): Promise<GeneralAssembly> {
    const { data, error } = await supabase
      .from('general_assemblies')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data as GeneralAssembly
  },

  async update(id: string, payload: Partial<GeneralAssembly>): Promise<GeneralAssembly> {
    const { data, error } = await supabase
      .from('general_assemblies')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as GeneralAssembly
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('general_assemblies').delete().eq('id', id)
    if (error) throw error
  },
}

// ── GA Attendees ───────────────────────────────────────────────────────────────

export const gaAttendeeService = {
  async getByGa(gaId: string): Promise<GaAttendee[]> {
    const { data, error } = await supabase
      .from('ga_attendees')
      .select('*')
      .eq('ga_id', gaId)
      .order('created_at')
    if (error) throw error
    // Manually join members
    const attendees = (data || []) as GaAttendee[]
    if (attendees.length === 0) return attendees
    const memberIds = [...new Set(attendees.map(a => a.member_id))]
    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .in('id', memberIds)
    const memberMap: Record<string, Member> = Object.fromEntries(
      (membersData || []).map((m: Member) => [m.id, m])
    )
    return attendees.map(a => ({ ...a, member: memberMap[a.member_id] || null }))
  },

  async addAttendee(gaId: string, memberId: string, notes?: string): Promise<GaAttendee> {
    const { data, error } = await supabase
      .from('ga_attendees')
      .insert({ ga_id: gaId, member_id: memberId, notes: notes || null })
      .select('*')
      .single()
    if (error) throw error
    return data as GaAttendee
  },

  async removeAttendee(id: string): Promise<void> {
    const { error } = await supabase.from('ga_attendees').delete().eq('id', id)
    if (error) throw error
  },

  // Bulk-record attendees from a list of member IDs (ignores duplicates)
  async bulkAdd(gaId: string, memberIds: string[]): Promise<void> {
    const rows = memberIds.map(mid => ({ ga_id: gaId, member_id: mid }))
    const { error } = await supabase.from('ga_attendees').upsert(rows, { onConflict: 'ga_id,member_id' })
    if (error) throw error
  },
}
