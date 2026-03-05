import { createClient } from '@/lib/supabase/client'

export interface EmployeeAsset {
  id: string
  employee_id: string
  asset_type: string
  asset_name: string
  asset_number?: string
  serial_number?: string
  description?: string
  assigned_date: string
  expected_return_date?: string
  actual_return_date?: string
  status: 'assigned' | 'returned' | 'lost' | 'damaged' | 'retired'
  condition_on_assignment?: string
  condition_on_return?: string
  purchase_value?: number
  current_value?: number
  returned_to?: string
  return_notes?: string
  created_at: string
  updated_at: string
  returned_to_employee?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface EmployeeAssetInsert {
  employee_id: string
  asset_type: string
  asset_name: string
  asset_number?: string
  serial_number?: string
  description?: string
  assigned_date: string
  expected_return_date?: string
  status?: string
  condition_on_assignment?: string
  purchase_value?: number
  current_value?: number
}

export interface AssetReturnData {
  actual_return_date: string
  condition_on_return: string
  returned_to?: string
  return_notes?: string
}

export const employeeAssetService = {
  /**
   * Get all assets for an employee
   */
  async getAllByEmployee(employeeId: string): Promise<EmployeeAsset[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .select(`
        *,
        returned_to_employee:employees!employee_assets_returned_to_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('employee_id', employeeId)
      .order('assigned_date', { ascending: false })

    if (error) {
      console.error('Error fetching employee assets:', error)
      throw error
    }

    return (data as EmployeeAsset[]) || []
  },

  /**
   * Get unreturned assets for an employee
   */
  async getUnreturnedByEmployee(employeeId: string): Promise<EmployeeAsset[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .select(`
        *,
        returned_to_employee:employees!employee_assets_returned_to_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'assigned')
      .order('assigned_date', { ascending: false })

    if (error) {
      console.error('Error fetching unreturned assets:', error)
      throw error
    }

    return (data as EmployeeAsset[]) || []
  },

  /**
   * Create a new asset assignment
   */
  async create(asset: EmployeeAssetInsert): Promise<EmployeeAsset> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .insert(asset)
      .select()
      .single()

    if (error) {
      console.error('Error creating asset:', error)
      throw error
    }

    return data as EmployeeAsset
  },

  /**
   * Mark asset as returned
   */
  async markAsReturned(id: string, returnData: AssetReturnData): Promise<EmployeeAsset> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .update({
        status: 'returned',
        ...returnData,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error marking asset as returned:', error)
      throw error
    }

    return data as EmployeeAsset
  },

  /**
   * Update asset status
   */
  async updateStatus(
    id: string, 
    status: 'assigned' | 'returned' | 'lost' | 'damaged' | 'retired',
    notes?: string
  ): Promise<EmployeeAsset> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .update({
        status,
        return_notes: notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset status:', error)
      throw error
    }

    return data as EmployeeAsset
  },

  /**
   * Delete an asset
   */
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('employee_assets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting asset:', error)
      throw error
    }
  },

  /**
   * Check if employee has unreturned assets
   */
  async hasUnreturnedAssets(employeeId: string): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_assets')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('status', 'assigned')
      .limit(1)

    if (error) {
      console.error('Error checking unreturned assets:', error)
      return false
    }

    return (data?.length || 0) > 0
  }
}
