import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type CompanyStructure = Database['public']['Tables']['company_structures']['Row']
export type CompanyStructureInsert = Database['public']['Tables']['company_structures']['Insert']
export type CompanyStructureUpdate = Database['public']['Tables']['company_structures']['Update']

export interface CompanyStructureWithRelations extends CompanyStructure {
  manager?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  location?: {
    id: string
    name: string
    city: string
    country: string
  }
  children?: CompanyStructure[]
  parent?: CompanyStructure
}

export interface CompanyStructureFilters {
  structure_type?: string
  status?: string
  parent_id?: string | null
  search?: string
}

export const companyStructureService = {
  async getAll(filters?: CompanyStructureFilters): Promise<CompanyStructureWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('company_structures')
      .select(`
        *,
        manager:employees!company_structures_manager_id_fkey(id, first_name, last_name, email),
        location:locations!company_structures_location_id_fkey(id, name, city, country)
      `)
      .order('level', { ascending: true })
      .order('name', { ascending: true })

    if (filters?.structure_type) {
      query = query.eq('structure_type', filters.structure_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching company structures:', error)
      throw error
    }

    return data as unknown as CompanyStructureWithRelations[]
  },

  async getById(id: string): Promise<CompanyStructureWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('company_structures')
      .select(`
        *,
        manager:employees!company_structures_manager_id_fkey(id, first_name, last_name, email),
        location:locations!company_structures_location_id_fkey(id, name, city, country),
        parent:company_structures!company_structures_parent_id_fkey(id, name, structure_type)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching company structure:', error)
      throw error
    }

    return data as unknown as CompanyStructureWithRelations
  },

  async getHierarchy(): Promise<CompanyStructureWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('company_structure_hierarchy')
      .select('*')
      .order('depth', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching company structure hierarchy:', error)
      throw error
    }

    return data as any[]
  },

  async getChildren(parentId: string): Promise<CompanyStructureWithRelations[]> {
    return this.getAll({ parent_id: parentId })
  },

  async getTopLevel(): Promise<CompanyStructureWithRelations[]> {
    return this.getAll({ parent_id: null })
  },

  async create(data: CompanyStructureInsert): Promise<CompanyStructure> {
    const supabase = createClient()
    const { data: newStructure, error } = await supabase
      .from('company_structures')
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating company structure:', error)
      throw error
    }

    return newStructure
  },

  async update(id: string, data: CompanyStructureUpdate): Promise<CompanyStructure> {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('company_structures')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating company structure:', error)
      throw error
    }

    return updated
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('company_structures')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting company structure:', error)
      throw error
    }
  },

  async getMetrics() {
    const supabase = createClient()
    
    const [
      { count: totalCount },
      { count: activeCount },
      { data: byType },
    ] = await Promise.all([
      supabase.from('company_structures').select('*', { count: 'exact', head: true }),
      supabase.from('company_structures').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('company_structures').select('structure_type').order('structure_type'),
    ])

    const typeDistribution = byType?.reduce((acc, item) => {
      acc[item.structure_type] = (acc[item.structure_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: (totalCount || 0) - (activeCount || 0),
      byType: typeDistribution,
    }
  },
}
