import { createClient } from '../lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type JobCategory = {
  id: string
  name: string
  code: string
  description?: string | null
  parent_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type JobCategoryInsert = Omit<JobCategory, 'id' | 'created_at' | 'updated_at'>
export type JobCategoryUpdate = Partial<JobCategoryInsert>

export interface JobCategoryFilters {
  search?: string
  parent_id?: string | null
  is_active?: boolean
}

export const jobCategoryService = {
  async getAll(filters?: JobCategoryFilters): Promise<JobCategory[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('job_categories')
      .select('*')
      .order('name', { ascending: true })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching job categories:', error)
      throw error
    }

    return data as JobCategory[]
  },

  async getById(id: string): Promise<JobCategory> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('job_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching job category:', error)
      throw error
    }

    return data as JobCategory
  },

  async create(data: JobCategoryInsert): Promise<JobCategory> {
    const supabase = createClient()
    
    const { data: newCategory, error } = await supabase
      .from('job_categories')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating job category:', error)
      throw error
    }

    return newCategory as JobCategory
  },

  async update(id: string, data: JobCategoryUpdate): Promise<JobCategory> {
    const supabase = createClient()
    
    const { data: updatedCategory, error } = await supabase
      .from('job_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job category:', error)
      throw error
    }

    return updatedCategory as JobCategory
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('job_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting job category:', error)
      throw error
    }
  },
}