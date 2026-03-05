import { createClient } from '@/lib/supabase/client'

export interface LocationType {
  id: string
  name: string
  code: string
  description: string | null
  icon: string | null
  color: string | null
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface LocationTypeInsert {
  name: string
  code: string
  description?: string | null
  icon?: string | null
  color?: string | null
  status?: 'active' | 'inactive'
}

export interface LocationTypeUpdate {
  name?: string
  code?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  status?: 'active' | 'inactive'
}

export interface LocationTypeFilters {
  search?: string
  status?: 'active' | 'inactive'
}

export const locationTypeKeys = {
  all: ['location-types'] as const,
  lists: () => [...locationTypeKeys.all, 'list'] as const,
  list: (filters: LocationTypeFilters) => [...locationTypeKeys.lists(), filters] as const,
  details: () => [...locationTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationTypeKeys.details(), id] as const,
}

export const locationTypeService = {
  async getAll(filters?: LocationTypeFilters): Promise<LocationType[]> {
    console.log('Fetching location types from Supabase with filters:', filters)
    const supabase = createClient()
    
    let query = supabase
      .from('location_types')
      .select('*')
      .order('name', { ascending: true })
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching location types:', error)
      throw new Error(`Failed to fetch location types: ${error.message}`)
    }
    
    console.log('Fetched location types from Supabase:', data)
    return data as LocationType[]
  },

  async getById(id: string): Promise<LocationType | null> {
    console.log('Fetching location type by id from Supabase:', id)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('location_types')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Location type not found:', id)
        return null
      }
      console.error('Error fetching location type:', error)
      throw new Error(`Failed to fetch location type: ${error.message}`)
    }
    
    console.log('Fetched location type from Supabase:', data)
    return data as LocationType
  },

  async create(locationTypeData: LocationTypeInsert): Promise<LocationType> {
    console.log('Creating location type in Supabase:', locationTypeData)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('location_types')
      .insert([locationTypeData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating location type:', error)
      throw new Error(`Failed to create location type: ${error.message}`)
    }
    
    console.log('Created location type in Supabase:', data)
    return data as LocationType
  },

  async update(id: string, locationTypeData: LocationTypeUpdate): Promise<LocationType> {
    console.log('Updating location type in Supabase:', id, locationTypeData)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('location_types')
      .update(locationTypeData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating location type:', error)
      throw new Error(`Failed to update location type: ${error.message}`)
    }
    
    console.log('Updated location type in Supabase:', data)
    return data as LocationType
  },

  async delete(id: string): Promise<void> {
    console.log('Deleting location type from Supabase:', id)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('location_types')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting location type:', error)
      throw new Error(`Failed to delete location type: ${error.message}`)
    }
    
    console.log('Deleted location type from Supabase:', id)
  },
}
