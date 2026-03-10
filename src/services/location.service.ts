import { createClient } from '@/lib/supabase/client'

// Manual type — locations (org module) was added via migration after last db:types run
export interface Location {
  id: string
  name: string
  code: string | null
  location_type: string
  parent_location_id: string | null
  company_structure_id: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state_province: string | null
  country: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  fax: string | null
  email: string | null
  website: string | null
  manager_id: string | null
  employee_capacity: number | null
  current_employee_count: number
  operational_hours: string | null
  timezone: string
  established_date: string | null
  monthly_rent: number | null
  square_footage: number | null
  lease_expiry_date: string | null
  status: string
  is_headquarters: boolean
  has_parking: boolean
  parking_spaces: number | null
  has_cafeteria: boolean
  has_gym: boolean
  has_medical_room: boolean
  has_conference_rooms: boolean
  conference_room_count: number
  notes: string | null
  created_at: string | null
  updated_at: string | null
}
export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'>
export type LocationUpdate = Partial<LocationInsert>

export interface LocationWithRelations extends Location {
  manager?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  company_structure?: {
    id: string
    name: string
    structure_type: string
  }
}

export interface LocationFilters {
  location_type?: string
  status?: string
  country?: string
  is_headquarters?: boolean
  search?: string
}

export const locationService = {
  async getAll(filters?: LocationFilters): Promise<LocationWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true })

    if (filters?.location_type) {
      query = query.eq('location_type', filters.location_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    if (filters?.country) {
      query = query.eq('country', filters.country)
    }

    if (filters?.is_headquarters !== undefined) {
      query = query.eq('is_headquarters', filters.is_headquarters)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,code.ilike.%${filters.search}%,address_line1.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching locations:', error)
      throw error
    }

    return data as unknown as LocationWithRelations[]
  },

  async getById(id: string): Promise<LocationWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        manager:employees!locations_manager_id_fkey(id, first_name, last_name, email),
        company_structure:company_structures!locations_company_structure_id_fkey(id, name, structure_type),
        parent_location:locations!locations_parent_location_id_fkey(id, name, location_type)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching location:', error)
      throw error
    }

    return data as unknown as LocationWithRelations
  },

  async getWithDetails(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('locations_with_details' as any)
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching locations with details:', error)
      throw error
    }

    return (data || []) as any
  },

  async getByCountry(country: string): Promise<LocationWithRelations[]> {
    return this.getAll({ country })
  },

  async getByType(location_type: string): Promise<LocationWithRelations[]> {
    return this.getAll({ location_type })
  },

  async getHeadquarters(): Promise<LocationWithRelations[]> {
    return this.getAll({ is_headquarters: true })
  },

  async create(data: LocationInsert): Promise<Location> {
    const supabase = createClient()
    const { data: newLocation, error } = await supabase
      .from('locations')
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      throw error
    }

    return newLocation
  },

  async update(id: string, data: LocationUpdate): Promise<Location> {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('locations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating location:', error)
      throw error
    }

    return updated
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting location:', error)
      throw error
    }
  },

  async getMetrics() {
    const supabase = createClient()
    
    const [
      { count: totalCount },
      { count: activeCount },
      { data: byCountry },
      { data: byType },
    ] = await Promise.all([
      supabase.from('locations').select('*', { count: 'exact', head: true }),
      supabase.from('locations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('locations').select('country').order('country'),
      supabase.from('locations').select('location_type').order('location_type'),
    ])

    const countryDistribution = byCountry?.reduce((acc, item) => {
      acc[item.country] = (acc[item.country] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const typeDistribution = byType?.reduce((acc, item) => {
      acc[item.location_type] = (acc[item.location_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: (totalCount || 0) - (activeCount || 0),
      countries: Object.keys(countryDistribution).length,
      byCountry: countryDistribution,
      byType: typeDistribution,
    }
  },

  async getCountries(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('locations')
      .select('country')
      .order('country')

    if (error) {
      console.error('Error fetching countries:', error)
      throw error
    }

    const uniqueCountries = [...new Set(data?.map(item => item.country) || [])]
    return uniqueCountries
  },
}
