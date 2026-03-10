import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase'

export type TaxConfiguration = Tables<'tax_configurations'>
export type TaxConfigurationInsert = InsertTables<'tax_configurations'>
export type TaxConfigurationUpdate = UpdateTables<'tax_configurations'>

const table = 'tax_configurations'

export const taxConfigurationService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*').order('min_income', { ascending: true })
    if (error) throw error
    return data as TaxConfiguration[]
  },
  async create(payload: TaxConfigurationInsert) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error) throw error
    return data as TaxConfiguration
  },
  async update(id: string, payload: TaxConfigurationUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return data as TaxConfiguration
  },
  async remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  },
}
