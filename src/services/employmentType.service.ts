// Mock implementation until employment_types table is properly configured
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface EmploymentType {
  id: string
  name: string
  code: string
  description: string | null
  category: 'permanent' | 'contract' | 'temporary' | 'intern' | 'volunteer' | 'consultant' | 'board_member'
  is_active: boolean
  benefits: any | null
  working_conditions: any | null
  contract_details: any | null
  created_at: string
  updated_at: string
}

export interface EmploymentTypeInsert {
  name: string
  code: string
  description?: string | null
  category: string
  is_active?: boolean
  benefits?: any | null
  working_conditions?: any | null
  contract_details?: any | null
}

export interface EmploymentTypeUpdate {
  name?: string
  code?: string
  description?: string | null
  category?: string
  is_active?: boolean
  benefits?: any | null
  working_conditions?: any | null
  contract_details?: any | null
}

export interface EmploymentTypeFilters {
  search?: string
  category?: string
  is_active?: boolean
}

export const employmentTypeService = {
  async getAll(filters?: EmploymentTypeFilters): Promise<EmploymentType[]> {
    console.log('Fetching employment types with filters:', filters)
    
    try {
      let query = supabase
        .from('employment_types')
        .select('*')
        .order('name', { ascending: true })
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching employment types:', error)
        throw error
      }
      
      console.log('Fetched employment types from database:', data)
      return (data || []) as any
    } catch (error) {
      console.error('Error in getAll employment types:', error)
      return []
    }
  },

  async getById(id: string): Promise<EmploymentType | null> {
    console.log('Fetching employment type by id:', id)
    
    try {
      const { data, error } = await supabase
        .from('employment_types')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching employment type:', error)
        return null
      }
      
      console.log('Fetched employment type:', data)
      return data as any
    } catch (error) {
      console.error('Error in getById employment type:', error)
      return null
    }
  },

  async create(typeData: EmploymentTypeInsert): Promise<EmploymentType> {
    console.log('Creating employment type:', typeData)
    
    try {
      const { data, error } = await supabase
        .from('employment_types')
        .insert([typeData])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error creating employment type:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      
      console.log('Created employment type:', data)
      return data as any
    } catch (error) {
      console.error('Catch block error:', error)
      throw error
    }
  },

  async update(id: string, typeData: EmploymentTypeUpdate): Promise<EmploymentType> {
    console.log('Updating employment type:', id, typeData)
    
    const { data, error } = await supabase
      .from('employment_types')
      .update(typeData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating employment type:', error)
      throw error
    }
    
    console.log('Updated employment type:', data)
    return data as any
  },

  async delete(id: string): Promise<void> {
    console.log('Deleting employment type:', id)
    
    const { error } = await supabase
      .from('employment_types')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting employment type:', error)
      throw error
    }
    
    console.log('Deleted employment type:', id)
  }
}