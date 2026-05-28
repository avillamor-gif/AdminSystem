import { createClient } from '@/lib/supabase/client'

// ─── Raw DB row types (mirrors the SQL tables) ────────────────────────────────

type ProgramRow = {
  id: string; name: string; description: string | null
  program_type: MEProgram['program_type']; status: MEProgram['status']
  start_date: string | null; end_date: string | null; budget: number | null
  currency: string; lead_staff_id: string | null; beneficiary_target: number | null
  beneficiary_count: number; location: string | null; notes: string | null
  created_by: string | null; created_at: string; updated_at: string
}
type ProjectRow = {
  id: string; program_id: string | null; name: string; description: string | null
  project_type: MEProject['project_type']; status: MEProject['status']
  start_date: string | null; end_date: string | null; budget: number | null
  currency: string; lead_staff_id: string | null; location: string | null
  notes: string | null; created_by: string | null; created_at: string; updated_at: string
}
type IndicatorRow = {
  id: string; program_id: string | null; project_id: string | null; name: string
  description: string | null; indicator_type: MEIndicator['indicator_type']
  unit_of_measure: string; baseline_value: number | null; target_value: number
  frequency: MEIndicator['frequency']; data_source: string | null
  responsible_staff_id: string | null; is_active: boolean; created_at: string; updated_at: string
}
type DataEntryRow = {
  id: string; indicator_id: string; period_label: string; period_start: string
  period_end: string; actual_value: number; narrative: string | null
  entered_by: string | null; verified_by: string | null; status: MEDataEntry['status']
  attachments: unknown[]; created_at: string; updated_at: string
}
type ReportRow = {
  id: string; title: string; program_id: string | null; project_id: string | null
  report_type: MEReport['report_type']; period_label: string | null
  period_start: string | null; period_end: string | null; content: string | null
  status: MEReport['status']; prepared_by: string | null; created_at: string; updated_at: string
}
type StaffRow = { id: string; first_name: string; last_name: string }
type NameRow = { id: string; name: string }
type IndicatorNameRow = { id: string; name: string; unit_of_measure: string; target_value: number }

export interface MEProgram {
  id: string
  name: string
  description: string | null
  program_type: 'project' | 'advocacy' | 'research' | 'capacity_building' | 'other'
  status: 'planning' | 'active' | 'completed' | 'suspended'
  start_date: string | null
  end_date: string | null
  budget: number | null
  currency: string
  lead_staff_id: string | null
  beneficiary_target: number | null
  beneficiary_count: number
  location: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  lead_staff?: { id: string; first_name: string; last_name: string } | null
}

export interface MEProject {
  id: string
  program_id: string | null
  name: string
  description: string | null
  project_type: 'implementation' | 'pilot' | 'research' | 'training' | 'advocacy' | 'other'
  status: 'planning' | 'active' | 'completed' | 'suspended'
  start_date: string | null
  end_date: string | null
  budget: number | null
  currency: string
  lead_staff_id: string | null
  location: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  program?: { id: string; name: string } | null
  lead_staff?: { id: string; first_name: string; last_name: string } | null
}

export interface MEIndicator {
  id: string
  program_id: string | null
  project_id: string | null
  name: string
  description: string | null
  indicator_type: 'input' | 'output' | 'outcome' | 'impact' | 'process'
  unit_of_measure: string
  baseline_value: number | null
  target_value: number
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'as-needed'
  data_source: string | null
  responsible_staff_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  program?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  responsible_staff?: { id: string; first_name: string; last_name: string } | null
}

export interface MEDataEntry {
  id: string
  indicator_id: string
  period_label: string
  period_start: string
  period_end: string
  actual_value: number
  narrative: string | null
  entered_by: string | null
  verified_by: string | null
  status: 'draft' | 'submitted' | 'verified'
  attachments: unknown[]
  created_at: string
  updated_at: string
  // joined
  indicator?: { id: string; name: string; unit_of_measure: string; target_value: number } | null
  entered_by_emp?: { id: string; first_name: string; last_name: string } | null
}

export interface MEReport {
  id: string
  title: string
  program_id: string | null
  project_id: string | null
  report_type: 'progress' | 'quarterly' | 'annual' | 'evaluation' | 'baseline' | 'endline'
  period_label: string | null
  period_start: string | null
  period_end: string | null
  content: string | null
  status: 'draft' | 'final'
  prepared_by: string | null
  created_at: string
  updated_at: string
  program?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  prepared_by_emp?: { id: string; first_name: string; last_name: string } | null
}

// ─── Program Service ──────────────────────────────────────────────────────────

export const programService = {
  async getAll(): Promise<MEProgram[]> {
    const supabase = createClient()
    const { data: rawData, error } = await supabase
      .from('me_programs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const data = (rawData ?? []) as ProgramRow[]

    // Fetch lead staff separately
    const staffIds = [...new Set(data.map((p) => p.lead_staff_id).filter(Boolean))] as string[]
    let staffMap: Record<string, StaffRow> = {}
    if (staffIds.length) {
      const { data: staff } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((p) => ({
      ...p,
      lead_staff: p.lead_staff_id ? staffMap[p.lead_staff_id] ?? null : null,
    }))
  },

  async create(payload: Omit<MEProgram, 'id' | 'created_at' | 'updated_at' | 'lead_staff'>) {
    const res = await fetch('/api/admin/me/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MEProgram>) {
    const res = await fetch('/api/admin/me/programs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/programs?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}

// ─── Project Service ──────────────────────────────────────────────────────────

export const projectService = {
  async getAll(programId?: string): Promise<MEProject[]> {
    const supabase = createClient()
    let query = supabase.from('me_projects').select('*').order('created_at', { ascending: false })
    if (programId) query = query.eq('program_id', programId)
    const { data: rawData, error } = await query
    if (error) throw error
    const data = (rawData ?? []) as ProjectRow[]

    const programIds = [...new Set(data.map((p) => p.program_id).filter(Boolean))] as string[]
    const staffIds = [...new Set(data.map((p) => p.lead_staff_id).filter(Boolean))] as string[]
    let programMap: Record<string, NameRow> = {}
    let staffMap: Record<string, StaffRow> = {}

    if (programIds.length) {
      const { data: programs } = await supabase
        .from('me_programs')
        .select('id, name')
        .in('id', programIds)
      ;(programs as NameRow[] ?? []).forEach((p) => { programMap[p.id] = p })
    }
    if (staffIds.length) {
      const { data: staff } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((p) => ({
      ...p,
      program: p.program_id ? programMap[p.program_id] ?? null : null,
      lead_staff: p.lead_staff_id ? staffMap[p.lead_staff_id] ?? null : null,
    }))
  },

  async create(payload: Omit<MEProject, 'id' | 'created_at' | 'updated_at' | 'program' | 'lead_staff'>) {
    const res = await fetch('/api/admin/me/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MEProject>) {
    const res = await fetch('/api/admin/me/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/projects?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}

// ─── Indicator Service ────────────────────────────────────────────────────────

export const indicatorService = {
  async getAll(filters?: { program_id?: string; project_id?: string }): Promise<MEIndicator[]> {
    const supabase = createClient()
    let query = supabase.from('me_indicators').select('*').order('created_at', { ascending: false })
    if (filters?.program_id) query = query.eq('program_id', filters.program_id)
    if (filters?.project_id) query = query.eq('project_id', filters.project_id)
    const { data: rawData, error } = await query
    if (error) throw error
    const data = (rawData ?? []) as IndicatorRow[]

    const programIds = [...new Set(data.map((i) => i.program_id).filter(Boolean))] as string[]
    const projectIds = [...new Set(data.map((i) => i.project_id).filter(Boolean))] as string[]
    const staffIds = [...new Set(data.map((i) => i.responsible_staff_id).filter(Boolean))] as string[]
    let programMap: Record<string, NameRow> = {}
    let projectMap: Record<string, NameRow> = {}
    let staffMap: Record<string, StaffRow> = {}

    if (programIds.length) {
      const { data: programs } = await supabase.from('me_programs').select('id, name').in('id', programIds)
      ;(programs as NameRow[] ?? []).forEach((p) => { programMap[p.id] = p })
    }
    if (projectIds.length) {
      const { data: projects } = await supabase.from('me_projects').select('id, name').in('id', projectIds)
      ;(projects as NameRow[] ?? []).forEach((p) => { projectMap[p.id] = p })
    }
    if (staffIds.length) {
      const { data: staff } = await supabase.from('employees').select('id, first_name, last_name').in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((i) => ({
      ...i,
      program: i.program_id ? programMap[i.program_id] ?? null : null,
      project: i.project_id ? projectMap[i.project_id] ?? null : null,
      responsible_staff: i.responsible_staff_id ? staffMap[i.responsible_staff_id] ?? null : null,
    }))
  },

  async create(payload: Omit<MEIndicator, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'responsible_staff'>) {
    const res = await fetch('/api/admin/me/indicators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MEIndicator>) {
    const res = await fetch('/api/admin/me/indicators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/indicators?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}

// ─── Data Entry Service ───────────────────────────────────────────────────────

export const dataEntryService = {
  async getAll(indicatorId?: string): Promise<MEDataEntry[]> {
    const supabase = createClient()
    let query = supabase.from('me_data_entries').select('*').order('period_start', { ascending: false })
    if (indicatorId) query = query.eq('indicator_id', indicatorId)
    const { data: rawData, error } = await query
    if (error) throw error
    const data = (rawData ?? []) as DataEntryRow[]

    const indicatorIds = [...new Set(data.map((e) => e.indicator_id).filter(Boolean))] as string[]
    const staffIds = [...new Set(data.map((e) => e.entered_by).filter(Boolean))] as string[]
    let indicatorMap: Record<string, IndicatorNameRow> = {}
    let staffMap: Record<string, StaffRow> = {}

    if (indicatorIds.length) {
      const { data: indicators } = await supabase
        .from('me_indicators')
        .select('id, name, unit_of_measure, target_value')
        .in('id', indicatorIds)
      ;(indicators as IndicatorNameRow[] ?? []).forEach((i) => { indicatorMap[i.id] = i })
    }
    if (staffIds.length) {
      const { data: staff } = await supabase.from('employees').select('id, first_name, last_name').in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((e) => ({
      ...e,
      indicator: indicatorMap[e.indicator_id] ?? null,
      entered_by_emp: e.entered_by ? staffMap[e.entered_by] ?? null : null,
    }))
  },

  async create(payload: Omit<MEDataEntry, 'id' | 'created_at' | 'updated_at' | 'indicator' | 'entered_by_emp'>) {
    const res = await fetch('/api/admin/me/data-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MEDataEntry>) {
    const res = await fetch('/api/admin/me/data-entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/data-entries?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}

// ─── Report Service ───────────────────────────────────────────────────────────

export const meReportService = {
  async getAll(): Promise<MEReport[]> {
    const supabase = createClient()
    const { data: rawData, error } = await supabase
      .from('me_reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const data = (rawData ?? []) as ReportRow[]

    const programIds = [...new Set(data.map((r) => r.program_id).filter(Boolean))] as string[]
    const projectIds = [...new Set(data.map((r) => r.project_id).filter(Boolean))] as string[]
    const staffIds = [...new Set(data.map((r) => r.prepared_by).filter(Boolean))] as string[]
    let programMap: Record<string, NameRow> = {}
    let projectMap: Record<string, NameRow> = {}
    let staffMap: Record<string, StaffRow> = {}
    if (programIds.length) {
      const { data: programs } = await supabase.from('me_programs').select('id, name').in('id', programIds)
      ;(programs as NameRow[] ?? []).forEach((p) => { programMap[p.id] = p })
    }
    if (projectIds.length) {
      const { data: projects } = await supabase.from('me_projects').select('id, name').in('id', projectIds)
      ;(projects as NameRow[] ?? []).forEach((p) => { projectMap[p.id] = p })
    }
    if (staffIds.length) {
      const { data: staff } = await supabase.from('employees').select('id, first_name, last_name').in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((r) => ({
      ...r,
      program: r.program_id ? programMap[r.program_id] ?? null : null,
      project: r.project_id ? projectMap[r.project_id] ?? null : null,
      prepared_by_emp: r.prepared_by ? staffMap[r.prepared_by] ?? null : null,
    }))
  },

  async create(payload: Omit<MEReport, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'prepared_by_emp'>) {
    const res = await fetch('/api/admin/me/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MEReport>) {
    const res = await fetch('/api/admin/me/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/reports?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}

// ─── Citation types ───────────────────────────────────────────────────────────

type CitationRow = {
  id: string
  title: string
  source_name: string
  source_type: MECitation['source_type']
  url: string | null
  publication_date: string | null
  authors: string | null
  program_id: string | null
  project_id: string | null
  work_type: MECitation['work_type']
  work_title: string | null
  notes: string | null
  tags: string[] | null
  added_by: string | null
  created_at: string
  updated_at: string
}

export interface MECitation {
  id: string
  title: string
  source_name: string
  source_type:
    | 'news_article' | 'academic_journal' | 'policy_document'
    | 'government_report' | 'social_media' | 'book' | 'conference' | 'website' | 'other'
  url: string | null
  publication_date: string | null
  authors: string | null
  program_id: string | null
  project_id: string | null
  work_type: 'research' | 'advocacy' | 'policy' | 'program' | 'project' | 'publication' | 'other'
  work_title: string | null
  notes: string | null
  tags: string[] | null
  added_by: string | null
  created_at: string
  updated_at: string
  // joined
  program?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  added_by_emp?: { id: string; first_name: string; last_name: string } | null
}

export const citationService = {
  async getAll(): Promise<MECitation[]> {
    const supabase = createClient()
    const { data: rawData, error } = await supabase
      .from('me_citations')
      .select('*')
      .order('publication_date', { ascending: false })
    if (error) throw error
    const data = (rawData ?? []) as CitationRow[]

    // Resolve programs
    const programIds = [...new Set(data.map((c) => c.program_id).filter(Boolean))] as string[]
    let programMap: Record<string, NameRow> = {}
    if (programIds.length) {
      const { data: progs } = await supabase.from('me_programs').select('id, name').in('id', programIds)
      ;(progs as NameRow[] ?? []).forEach((p) => { programMap[p.id] = p })
    }

    // Resolve projects
    const projectIds = [...new Set(data.map((c) => c.project_id).filter(Boolean))] as string[]
    let projectMap: Record<string, NameRow> = {}
    if (projectIds.length) {
      const { data: projs } = await supabase.from('me_projects').select('id, name').in('id', projectIds)
      ;(projs as NameRow[] ?? []).forEach((p) => { projectMap[p.id] = p })
    }

    // Resolve staff who added the citation
    const staffIds = [...new Set(data.map((c) => c.added_by).filter(Boolean))] as string[]
    let staffMap: Record<string, StaffRow> = {}
    if (staffIds.length) {
      const { data: staff } = await supabase.from('employees').select('id, first_name, last_name').in('id', staffIds)
      ;(staff as StaffRow[] ?? []).forEach((s) => { staffMap[s.id] = s })
    }

    return data.map((c) => ({
      ...c,
      program: c.program_id ? programMap[c.program_id] ?? null : null,
      project: c.project_id ? projectMap[c.project_id] ?? null : null,
      added_by_emp: c.added_by ? staffMap[c.added_by] ?? null : null,
    }))
  },

  async create(payload: Omit<MECitation, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'added_by_emp'>) {
    const res = await fetch('/api/admin/me/citations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async update(id: string, payload: Partial<MECitation>) {
    const res = await fetch('/api/admin/me/citations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async delete(id: string) {
    const res = await fetch(`/api/admin/me/citations?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
  },
}
