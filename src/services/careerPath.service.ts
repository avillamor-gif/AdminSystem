import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type CareerPath = Tables<'career_paths'>
export type CareerPathInsert = InsertTables<'career_paths'>
export type CareerPathUpdate = UpdateTables<'career_paths'>

export interface CareerPathFilters {
  search?: string
  status?: string
  category?: string
}

export const careerPathService = {
  async getAll(filters?: CareerPathFilters): Promise<CareerPath[]> {
    const supabase = createClient()
    
    console.log('Fetching career paths with filters:', filters)
    
    try {
      let query = supabase
        .from('career_paths')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,category.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching career paths:', error)
        if (error.message?.includes('relation "career_paths" does not exist')) {
          console.warn('Career paths table does not exist. Please run the migration script.')
          return []
        }
        throw error
      }
      
      console.log('Fetched career paths:', data)
      return data || []
    } catch (error) {
      console.error('Error in career paths service:', error)
      return []
    }
  },

  async getById(id: string): Promise<CareerPath | null> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('career_paths')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching career path:', error)
        if (error.message?.includes('relation "career_paths" does not exist')) {
          return null
        }
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error in getById career path:', error)
      return null
    }
  },

  async create(data: CareerPathInsert): Promise<CareerPath> {
    const supabase = createClient()
    
    const { data: newPath, error } = await supabase
      .from('career_paths')
      .insert(data as any)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating career path:', error)
      throw error
    }
    
    return newPath
  },

  async update(id: string, data: CareerPathUpdate): Promise<CareerPath> {
    const supabase = createClient()
    
    const { data: updatedPath, error } = await supabase
      .from('career_paths')
      .update(data as any)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating career path:', error)
      throw error
    }
    
    return updatedPath
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('career_paths')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting career path:', error)
      throw error
    }
  }
}
