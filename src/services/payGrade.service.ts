import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type PayGrade = Tables<'pay_grades'>
export type PayGradeInsert = InsertTables<'pay_grades'>
export type PayGradeUpdate = UpdateTables<'pay_grades'>

export interface PayGradeFilters {
  search?: string
  category?: string
  status?: string
  level?: number
}

export const payGradeService = {
  async getAll(filters?: PayGradeFilters): Promise<PayGrade[]> {
    const supabase = createClient()
    
    console.log('Fetching pay grades with filters:', filters)
    
    let query = supabase
      .from('pay_grades')
      .select('*')
      .order('level', { ascending: true })

    if (filters?.search) {
      query = query.or(`grade.ilike.%${filters.search}%,title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.level) {
      query = query.eq('level', filters.level)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching pay grades:', error)
      throw error
    }
    
    console.log('Fetched pay grades:', data)
    return data || []
  },

  async getById(id: string): Promise<PayGrade | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('pay_grades')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching pay grade:', error)
      throw error
    }
    
    return data
  },

  async create(data: PayGradeInsert): Promise<PayGrade> {
    const supabase = createClient()
    
    const { data: newPayGrade, error } = await supabase
      .from('pay_grades')
      .insert(data as any)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating pay grade:', error)
      throw error
    }
    
    return newPayGrade
  },

  async update(id: string, data: PayGradeUpdate): Promise<PayGrade> {
    const supabase = createClient()
    
    const { data: updatedPayGrade, error } = await supabase
      .from('pay_grades')
      .update(data as any)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating pay grade:', error)
      throw error
    }
    
    return updatedPayGrade
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('pay_grades')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting pay grade:', error)
      throw error
    }
  },
}