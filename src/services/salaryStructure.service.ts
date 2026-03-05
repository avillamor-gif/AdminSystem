import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type SalaryStructure = Tables<'salary_structures'>
export type SalaryStructureInsert = InsertTables<'salary_structures'>
export type SalaryStructureUpdate = UpdateTables<'salary_structures'>

export type SalaryStructureWithRelations = SalaryStructure & {
  pay_grade?: { id: string; name: string; code: string } | null
}

export interface SalaryStructureFilters {
  search?: string
  status?: string
  pay_grade_id?: string
}

export const salaryStructureService = {
  async getAll(filters?: SalaryStructureFilters): Promise<SalaryStructureWithRelations[]> {
    const supabase = createClient()
    
    console.log('Fetching salary structures with filters:', filters)
    
    try {
      let query = supabase
        .from('salary_structures')
        .select(`
          *,
          pay_grade:pay_grades(id, name, code)
        `)
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.pay_grade_id) {
        query = query.eq('pay_grade_id', filters.pay_grade_id)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching salary structures:', error)
        if (error.message?.includes('relation "salary_structures" does not exist')) {
          console.warn('Salary structures table does not exist. Please run the migration script.')
          return []
        }
        throw error
      }
      
      console.log('Fetched salary structures:', data)
      return (data || []) as SalaryStructureWithRelations[]
    } catch (error) {
      console.error('Error in salary structures service:', error)
      return []
    }
  },

  async getById(id: string): Promise<SalaryStructureWithRelations | null> {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('salary_structures')
        .select(`
          *,
          pay_grade:pay_grades(id, name, code)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching salary structure:', error)
        if (error.message?.includes('relation "salary_structures" does not exist')) {
          return null
        }
        throw error
      }
      
      return data as SalaryStructureWithRelations
    } catch (error) {
      console.error('Error in getById salary structure:', error)
      return null
    }
  },

  async create(data: SalaryStructureInsert): Promise<SalaryStructure> {
    const supabase = createClient()
    
    const { data: newStructure, error } = await supabase
      .from('salary_structures')
      .insert(data as any)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating salary structure:', error)
      throw error
    }
    
    return newStructure
  },

  async update(id: string, data: SalaryStructureUpdate): Promise<SalaryStructure> {
    const supabase = createClient()
    
    const { data: updatedStructure, error } = await supabase
      .from('salary_structures')
      .update(data as any)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating salary structure:', error)
      throw error
    }
    
    return updatedStructure
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('salary_structures')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting salary structure:', error)
      throw error
    }
  }
}
