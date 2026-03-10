import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type InternationalOperation = Database['public']['Tables']['international_operations']['Row']
export type InternationalOperationInsert = Database['public']['Tables']['international_operations']['Insert']
export type InternationalOperationUpdate = Database['public']['Tables']['international_operations']['Update']

export interface InternationalOperationWithRelations extends InternationalOperation {
  country_director?: {
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
  company_structure?: {
    id: string
    name: string
    structure_type: string
  }
}

export interface InternationalOperationFilters {
  country?: string
  region?: string
  operation_type?: string
  status?: string
  search?: string
}

export const internationalOperationService = {
  async getAll(filters?: InternationalOperationFilters): Promise<InternationalOperationWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('international_operations')
      .select(`
        *,
        country_director:employees!international_operations_country_director_id_fkey(id, first_name, last_name, email),
        location:locations!international_operations_location_id_fkey(id, name, city, country),
        company_structure:company_structures!international_operations_company_structure_id_fkey(id, name, structure_type)
      `)
      .order('country', { ascending: true })

    if (filters?.country) {
      query = query.eq('country', filters.country)
    }

    if (filters?.region) {
      query = query.eq('region', filters.region)
    }

    if (filters?.operation_type) {
      query = query.eq('operation_type', filters.operation_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    if (filters?.search) {
      query = query.or(`country.ilike.%${filters.search}%,office_name.ilike.%${filters.search}%,region.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching international operations:', error)
      throw error
    }

    return data as unknown as InternationalOperationWithRelations[]
  },

  async getById(id: string): Promise<InternationalOperationWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('international_operations')
      .select(`
        *,
        country_director:employees!international_operations_country_director_id_fkey(id, first_name, last_name, email),
        location:locations!international_operations_location_id_fkey(id, name, city, country),
        company_structure:company_structures!international_operations_company_structure_id_fkey(id, name, structure_type)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching international operation:', error)
      throw error
    }

    return data as unknown as InternationalOperationWithRelations
  },

  async getSummary(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('intl_operations_summary' as any)
      .select('*')
      .order('country', { ascending: true })

    if (error) {
      console.error('Error fetching international operations summary:', error)
      throw error
    }

    return (data || []) as any
  },

  async getByCountry(country: string): Promise<InternationalOperationWithRelations[]> {
    return this.getAll({ country })
  },

  async getByRegion(region: string): Promise<InternationalOperationWithRelations[]> {
    return this.getAll({ region })
  },

  async create(data: InternationalOperationInsert): Promise<InternationalOperation> {
    const supabase = createClient()
    const { data: newOperation, error } = await supabase
      .from('international_operations')
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating international operation:', error)
      throw error
    }

    return newOperation
  },

  async update(id: string, data: InternationalOperationUpdate): Promise<InternationalOperation> {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('international_operations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating international operation:', error)
      throw error
    }

    return updated
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('international_operations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting international operation:', error)
      throw error
    }
  },

  async getMetrics() {
    const supabase = createClient()
    
    const [
      { count: totalCount },
      { count: activeCount },
      { data: operations },
    ] = await Promise.all([
      supabase.from('international_operations').select('*', { count: 'exact', head: true }),
      supabase.from('international_operations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('international_operations').select('country, region, employee_count, local_staff_count, expat_staff_count, active_programs, beneficiary_count'),
    ])

    const countryCount = new Set(operations?.map(op => op.country)).size
    const regionCount = new Set(operations?.map(op => op.region).filter(Boolean)).size
    
    const totalEmployees = operations?.reduce((sum, op) => sum + (op.employee_count || 0), 0) || 0
    const totalLocalStaff = operations?.reduce((sum, op) => sum + (op.local_staff_count || 0), 0) || 0
    const totalExpatStaff = operations?.reduce((sum, op) => sum + (op.expat_staff_count || 0), 0) || 0
    const totalPrograms = operations?.reduce((sum, op) => sum + (op.active_programs || 0), 0) || 0
    const totalBeneficiaries = operations?.reduce((sum, op) => sum + (op.beneficiary_count || 0), 0) || 0

    const byRegion = operations?.reduce((acc, op) => {
      if (op.region) {
        acc[op.region] = (acc[op.region] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: (totalCount || 0) - (activeCount || 0),
      countries: countryCount,
      regions: regionCount,
      totalEmployees,
      localStaff: totalLocalStaff,
      expatStaff: totalExpatStaff,
      programs: totalPrograms,
      beneficiaries: totalBeneficiaries,
      byRegion,
    }
  },

  async getCountries(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('international_operations')
      .select('country')
      .order('country')

    if (error) {
      console.error('Error fetching countries:', error)
      throw error
    }

    const uniqueCountries = [...new Set(data?.map(item => item.country) || [])]
    return uniqueCountries
  },

  async getRegions(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('international_operations')
      .select('region')
      .order('region')

    if (error) {
      console.error('Error fetching regions:', error)
      throw error
    }

    const uniqueRegions = [...new Set(data?.map(item => item.region).filter(Boolean) || [])]
    return uniqueRegions as string[]
  },
}
