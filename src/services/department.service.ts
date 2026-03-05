import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Department = Tables<'departments'>
export type DepartmentInsert = InsertTables<'departments'>
export type DepartmentUpdate = UpdateTables<'departments'>

export const departmentService = {
  async getAll(): Promise<Department[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (error) throw error
    return (data || []) as unknown as Department[]
  },

  async create(department: DepartmentInsert): Promise<Department> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('departments')
      .insert(department as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Department
  },

  async update(id: string, department: DepartmentUpdate): Promise<Department> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('departments')
      .update(department as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Department
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
