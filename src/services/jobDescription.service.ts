import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type JobDescription = Tables<'job_descriptions'>
export type JobDescriptionInsert = InsertTables<'job_descriptions'>
export type JobDescriptionUpdate = UpdateTables<'job_descriptions'>

export type JobDescriptionWithRelations = JobDescription & {
  job_title?: { id: string; title: string } | null
  department?: { id: string; name: string } | null
  employment_type?: { id: string; name: string; category: string } | null
}

export interface JobDescriptionFilters {
  search?: string
  status?: string
  department_id?: string
  job_title_id?: string
}

export const jobDescriptionService = {
  async getAll(filters?: JobDescriptionFilters): Promise<JobDescriptionWithRelations[]> {
    const supabase = createClient()
    
    console.log('Fetching job descriptions with filters:', filters)
    
    try {
      let query = supabase
        .from('job_descriptions')
        .select('*')
        .order('updated_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`job_code.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,reports_to.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status as any)
      }

      if (filters?.department_id) {
        query = query.eq('department_id', filters.department_id)
      }

      if (filters?.job_title_id) {
        query = query.eq('job_title_id', filters.job_title_id)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching job descriptions:', error)
        // If table doesn't exist, return empty array instead of throwing
        if (error.message?.includes('relation "job_descriptions" does not exist')) {
          console.warn('Job descriptions table does not exist. Please run the migration script.')
          return []
        }
        throw error
      }
      
      console.log('Fetched job descriptions:', data)
      return (data || []) as unknown as JobDescriptionWithRelations[]
    } catch (error) {
      console.error('Error in job descriptions service:', error)
      // Return empty array if there's any error to prevent page crashes
      return []
    }
  },

  async getById(id: string): Promise<JobDescriptionWithRelations | null> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching job description:', error)
        if (error.message?.includes('relation "job_descriptions" does not exist')) {
          return null
        }
        throw error
      }
      
      return data as unknown as JobDescriptionWithRelations
    } catch (error) {
      console.error('Error in getById job description:', error)
      return null
    }
  },

  async create(jobDescription: JobDescriptionInsert): Promise<JobDescriptionWithRelations> {
    const supabase = createClient()
    
    const payload = {
      ...jobDescription,
      updated_at: new Date().toISOString(),
    }
    console.log('Creating job description with payload:', JSON.stringify(payload, null, 2))

    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .insert(payload as any)
        .select('*')
        .single()
      
      if (error) {
        console.error('Error creating job description — code:', error.code, '| message:', error.message, '| details:', error.details, '| hint:', error.hint)
        throw error
      }
      
      console.log('Job description created successfully:', data)
      return data as unknown as JobDescriptionWithRelations
    } catch (error: any) {
      console.error('Error in create job description — message:', error?.message, '| full:', error)
      throw error
    }
  },

  async update(id: string, jobDescription: JobDescriptionUpdate): Promise<JobDescriptionWithRelations> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .update({
          ...jobDescription,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) {
        console.error('Error updating job description:', error)
        if (error.message?.includes('relation "job_descriptions" does not exist')) {
          throw new Error('Job descriptions table not found. Please run the migration script first.')
        }
        throw error
      }
      
      return data as unknown as JobDescriptionWithRelations
    } catch (error) {
      console.error('Error in update job description:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting job description:', error)
        if (error.message?.includes('relation "job_descriptions" does not exist')) {
          throw new Error('Job descriptions table not found. Please run the migration script first.')
        }
        throw error
      }
    } catch (error) {
      console.error('Error in delete job description:', error)
      throw error
    }
  },
}