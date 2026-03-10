import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase'

export type PayComponent = Tables<'pay_components'>
export type PayComponentInsert = InsertTables<'pay_components'>
export type PayComponentUpdate = UpdateTables<'pay_components'>

const table = 'pay_components'

export const payComponentService = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as PayComponent[]
  },
  async create(payload: PayComponentInsert) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error) throw error
    return data as PayComponent
  },
  async update(id: string, payload: PayComponentUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return data as PayComponent
  },
  async remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return true
  },
}
