import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export interface JobTitle {
  id: string
  title: string
  code?: string | null
  description: string | null
  job_category_id?: string | null
  department_id?: string | null
  min_salary: number | null
  max_salary: number | null
  currency?: string | null
  responsibilities?: string | null
  requirements?: string | null
  benefits?: string | null
  employment_type?: string | null
  experience_level?: string | null
  location?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface JobTitleInsert {
  title: string
  code?: string
  description?: string | null
  job_category_id?: string | null
  min_salary?: number | null
  max_salary?: number | null
  employment_type?: string
  experience_level?: string
  location?: string
  is_active?: boolean
}

export interface JobTitleUpdate {
  title?: string
  code?: string
  description?: string | null
  job_category_id?: string | null
  min_salary?: number | null
  max_salary?: number | null
  employment_type?: string
  experience_level?: string
  location?: string
  is_active?: boolean
}

export interface JobTitleFilters {
  search?: string
}

export const jobTitleKeys = {
  all: ['job-titles'] as const,
  lists: () => [...jobTitleKeys.all, 'list'] as const,
  list: (filters: JobTitleFilters) => [...jobTitleKeys.lists(), filters] as const,
  details: () => [...jobTitleKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobTitleKeys.details(), id] as const,
}

export const jobTitleService = {
  async getAll(filters?: JobTitleFilters): Promise<JobTitle[]> {
    console.log('Fetching job titles from Supabase with filters:', filters)
    const supabase = createClient()
    
    let query = supabase
      .from('job_titles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching job titles:', error)
      throw new Error(`Failed to fetch job titles: ${error.message}`)
    }
    
    console.log('Fetched job titles from Supabase:', data)
    return data as unknown as JobTitle[]
  },

  async getById(id: string): Promise<JobTitle | null> {
    console.log('Fetching job title by id from Supabase:', id)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Job title not found:', id)
        return null
      }
      console.error('Error fetching job title:', error)
      throw new Error(`Failed to fetch job title: ${error.message}`)
    }
    
    console.log('Fetched job title from Supabase:', data)
    return data as unknown as JobTitle
  },

  async create(jobTitleData: JobTitleInsert): Promise<JobTitle> {
    const res = await fetch('/api/admin/job-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobTitleData),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create job title')
    return json as JobTitle
  },

  async update(id: string, jobTitleData: JobTitleUpdate): Promise<JobTitle> {
    const res = await fetch('/api/admin/job-titles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...jobTitleData }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to update job title')
    return json as JobTitle
  },

  async delete(id: string): Promise<void> {
    const res = await fetch('/api/admin/job-titles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Failed to delete job title')
    }
  },
}