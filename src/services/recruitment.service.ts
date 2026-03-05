import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Vacancy = Tables<'vacancies'>
export type VacancyInsert = InsertTables<'vacancies'>
export type VacancyUpdate = UpdateTables<'vacancies'>

export type Candidate = Tables<'candidates'>
export type CandidateInsert = InsertTables<'candidates'>
export type CandidateUpdate = UpdateTables<'candidates'>

export type VacancyWithRelations = Vacancy & {
  job_title?: { id: string; title: string } | null
  hiring_manager?: { id: string; first_name: string; last_name: string } | null
}

export type CandidateWithRelations = Candidate & {
  vacancy?: VacancyWithRelations | null
}

export interface VacancyFilters {
  search?: string
  status?: string
}

export interface CandidateFilters {
  search?: string
  vacancy_id?: string
  status?: string
}

export const recruitmentService = {
  // Vacancies
  async getVacancies(filters?: VacancyFilters): Promise<VacancyWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('vacancies')
      .select(`
        *,
        job_title:job_titles(id, title),
        hiring_manager:employees(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as VacancyWithRelations[]
  },

  async getVacancyById(id: string): Promise<VacancyWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancies')
      .select(`
        *,
        job_title:job_titles(id, title),
        hiring_manager:employees(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as VacancyWithRelations | null
  },

  async createVacancy(vacancy: VacancyInsert): Promise<Vacancy> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancies')
      .insert(vacancy as never)
      .select()
      .single()

    if (error) throw error
    return data as Vacancy
  },

  async updateVacancy(id: string, vacancy: VacancyUpdate): Promise<Vacancy> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancies')
      .update({ ...vacancy, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Vacancy
  },

  async deleteVacancy(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('vacancies').delete().eq('id', id)
    if (error) throw error
  },

  // Candidates
  async getCandidates(filters?: CandidateFilters): Promise<CandidateWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('candidates')
      .select(`
        *,
        vacancy:vacancies(
          *,
          job_title:job_titles(id, title)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.vacancy_id) {
      query = query.eq('vacancy_id', filters.vacancy_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as CandidateWithRelations[]
  },

  async getCandidateById(id: string): Promise<CandidateWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        vacancy:vacancies(
          *,
          job_title:job_titles(id, title)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as CandidateWithRelations | null
  },

  async createCandidate(candidate: CandidateInsert): Promise<Candidate> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate as never)
      .select()
      .single()

    if (error) throw error
    return data as Candidate
  },

  async updateCandidate(id: string, candidate: CandidateUpdate): Promise<Candidate> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('candidates')
      .update({ ...candidate, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Candidate
  },

  async deleteCandidate(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('candidates').delete().eq('id', id)
    if (error) throw error
  },

  async updateCandidateStatus(id: string, status: string): Promise<Candidate> {
    return this.updateCandidate(id, { status } as CandidateUpdate)
  },
}
