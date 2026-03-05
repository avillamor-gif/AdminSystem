import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface EmergencyContact {
  id: string
  employee_id: string
  name: string
  relationship: string
  home_phone: string | null
  mobile_phone: string
  work_phone: string | null
  created_at: string
  updated_at: string
}

export interface EmergencyContactInsert {
  employee_id: string
  name: string
  relationship: string
  home_phone?: string | null
  mobile_phone: string
  work_phone?: string | null
}

export interface EmergencyContactUpdate {
  name?: string
  relationship?: string
  home_phone?: string | null
  mobile_phone?: string
  work_phone?: string | null
}

export const emergencyContactService = {
  async getAllByEmployee(employeeId: string): Promise<EmergencyContact[]> {
    console.log('Fetching emergency contacts for employee:', employeeId)
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching emergency contacts:', error)
        throw error
      }
      
      console.log('Fetched emergency contacts:', data)
      return (data || []) as unknown as EmergencyContact[]
    } catch (error) {
      console.error('Error in getAllByEmployee:', error)
      return []
    }
  },

  async getById(id: string): Promise<EmergencyContact | null> {
    console.log('Fetching emergency contact by id:', id)
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching emergency contact:', error)
        return null
      }
      
      console.log('Fetched emergency contact:', data)
      return data as unknown as EmergencyContact | null
    } catch (error) {
      console.error('Error in getById:', error)
      return null
    }
  },

  async create(contactData: EmergencyContactInsert): Promise<EmergencyContact> {
    console.log('Creating emergency contact:', contactData)
    
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert([contactData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating emergency contact:', error)
      throw error
    }
    
    console.log('Created emergency contact:', data)
    return data as unknown as EmergencyContact
  },

  async update(id: string, contactData: EmergencyContactUpdate): Promise<EmergencyContact> {
    console.log('Updating emergency contact:', id, contactData)
    
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating emergency contact:', error)
      throw error
    }
    
    console.log('Updated emergency contact:', data)
    return data as unknown as EmergencyContact
  },

  async delete(id: string): Promise<void> {
    console.log('Deleting emergency contact:', id)
    
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting emergency contact:', error)
      throw error
    }
    
    console.log('Deleted emergency contact:', id)
  }
}
