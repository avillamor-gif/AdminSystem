import { createClient } from '@/lib/supabase/client'
import { notifySupervisorsAndAdmins, notifyRequesterOfDecision } from './requestNotification.helper'

const supabase = createClient()

// =====================================================
// TYPES
// =====================================================

export interface AssetCategory {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssetBrand {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssetVendor {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  asset_tag: string
  name: string
  category_id?: string
  brand_id?: string
  model?: string
  serial_number?: string
  vendor_id?: string
  purchase_date?: string
  purchase_price?: number
  purchase_order_number?: string
  warranty_start_date?: string
  warranty_end_date?: string
  warranty_details?: string
  useful_life_years?: number
  salvage_value?: number
  depreciation_method?: 'straight_line' | 'declining_balance' | 'none'
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost' | 'damaged'
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  location?: string
  assigned_to?: string
  assigned_date?: string
  specifications?: any
  qr_code?: string
  image_url?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  category?: AssetCategory
  brand?: AssetBrand
  vendor?: AssetVendor
  employee?: any
}

export interface AssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  assigned_by?: string
  assigned_date: string
  returned_date?: string
  returned_by?: string
  condition_on_assignment?: string
  condition_on_return?: string
  notes?: string
  created_at: string
  // Relations
  asset?: Asset
  employee?: any
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: 'repair' | 'inspection' | 'upgrade' | 'cleaning' | 'calibration'
  scheduled_date?: string
  completed_date?: string
  performed_by?: string
  vendor_id?: string
  cost?: number
  description: string
  notes?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  // Relations
  asset?: Asset
  vendor?: AssetVendor
}

export interface AssetRequest {
  id: string
  employee_id: string
  category_id?: string
  item_description: string
  justification?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  requested_date: string
  approved_by?: string
  approved_date?: string
  fulfilled_date?: string
  assigned_asset_id?: string
  rejection_reason?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  employee?: any
  category?: AssetCategory
  approver?: any
  assigned_asset?: Asset
}

// =====================================================
// ASSET CATEGORIES SERVICE
// =====================================================

export const assetCategoryService = {
  async getAll(): Promise<AssetCategory[]> {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<AssetCategory | null> {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(category: Partial<AssetCategory>): Promise<AssetCategory> {
    const { data, error } = await supabase
      .from('asset_categories')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AssetCategory>): Promise<AssetCategory> {
    const { data, error } = await supabase
      .from('asset_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// ASSET BRANDS SERVICE
// =====================================================

export const assetBrandService = {
  async getAll(): Promise<AssetBrand[]> {
    const { data, error } = await supabase
      .from('asset_brands')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<AssetBrand | null> {
    const { data, error } = await supabase
      .from('asset_brands')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(brand: Partial<AssetBrand>): Promise<AssetBrand> {
    const { data, error } = await supabase
      .from('asset_brands')
      .insert(brand)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AssetBrand>): Promise<AssetBrand> {
    const { data, error } = await supabase
      .from('asset_brands')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_brands')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// ASSET VENDORS SERVICE
// =====================================================

export const assetVendorService = {
  async getAll(): Promise<AssetVendor[]> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<AssetVendor | null> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(vendor: Partial<AssetVendor>): Promise<AssetVendor> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .insert(vendor)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AssetVendor>): Promise<AssetVendor> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_vendors')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// ASSETS SERVICE
// =====================================================

export const assetService = {
  async getAll(filters?: {
    category_id?: string
    status?: string
    assigned_to?: string
    search?: string
  }): Promise<Asset[]> {
    let query = supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(*),
        brand:asset_brands(*),
        vendor:asset_vendors(*),
        employee:employees(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters?.search) {
      query = query.or(`asset_tag.ilike.%${filters.search}%,name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(*),
        brand:asset_brands(*),
        vendor:asset_vendors(*),
        employee:employees(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async assign(assetId: string, employeeId: string, assignedBy: string, condition?: string): Promise<AssetAssignment> {
    // Guard: check the asset is still available before assigning
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, status, name, asset_tag')
      .eq('id', assetId)
      .single()

    if (assetError) throw assetError
    if (asset.status !== 'available') {
      throw new Error(`"${asset.name} (${asset.asset_tag})" is already assigned or unavailable. Return it first before reassigning.`)
    }

    // Check for any open assignment record (extra safety net)
    const { data: existing } = await supabase
      .from('asset_assignments')
      .select('id')
      .eq('asset_id', assetId)
      .is('returned_date', null)
      .maybeSingle()

    if (existing) {
      throw new Error(`This asset already has an active assignment. Return it first before reassigning.`)
    }

    // Insert assignment record
    const { data, error } = await supabase
      .from('asset_assignments')
      .insert({
        asset_id: assetId,
        employee_id: employeeId,
        assigned_by: assignedBy,
        assigned_date: new Date().toISOString().split('T')[0],
        condition_on_assignment: condition
      })
      .select()
      .single()
    
    if (error) throw error

    // Update the asset status and assignment fields
    await supabase
      .from('assets')
      .update({
        status: 'assigned',
        assigned_to: employeeId,
        assigned_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', assetId)

    return data
  },

  async return(assignmentId: string, returnedBy: string, condition?: string, notes?: string): Promise<AssetAssignment> {
    const { data, error } = await supabase
      .from('asset_assignments')
      .update({
        returned_date: new Date().toISOString().split('T')[0],
        returned_by: returnedBy || null,
        condition_on_return: condition,
        notes: notes
      })
      .eq('id', assignmentId)
      .select()
      .single()
    
    if (error) throw error

    // Set asset back to available
    await supabase
      .from('assets')
      .update({
        status: 'available',
        assigned_to: null,
        assigned_date: null
      })
      .eq('id', data.asset_id)

    return data
  }
}

// =====================================================
// ASSET ASSIGNMENTS SERVICE
// =====================================================

export const assetAssignmentService = {
  async getAll(filters?: {
    asset_id?: string
    employee_id?: string
    is_active?: boolean
  }): Promise<AssetAssignment[]> {
    let query = supabase
      .from('asset_assignments')
      .select(`
        *,
        asset:assets(*),
        employee:employees!employee_id(id, first_name, last_name, email)
      `)
      .order('assigned_date', { ascending: false })

    if (filters?.asset_id) {
      query = query.eq('asset_id', filters.asset_id)
    }

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }

    if (filters?.is_active !== undefined) {
      if (filters.is_active) {
        query = query.is('returned_date', null)
      } else {
        query = query.not('returned_date', 'is', null)
      }
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }
}

// =====================================================
// ASSET MAINTENANCE SERVICE
// =====================================================

export const assetMaintenanceService = {
  async getAll(filters?: {
    asset_id?: string
    status?: string
  }): Promise<AssetMaintenance[]> {
    let query = supabase
      .from('asset_maintenance')
      .select(`
        *,
        asset:assets(*),
        vendor:asset_vendors(*)
      `)
      .order('scheduled_date', { ascending: false })

    if (filters?.asset_id) {
      query = query.eq('asset_id', filters.asset_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<AssetMaintenance | null> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .select(`
        *,
        asset:assets(*),
        vendor:asset_vendors(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(maintenance: Partial<AssetMaintenance>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert(maintenance)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AssetMaintenance>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_maintenance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// ASSET REQUESTS SERVICE
// =====================================================

export const assetRequestService = {
  async getAll(filters?: {
    employee_id?: string
    status?: string
    priority?: string
  }): Promise<AssetRequest[]> {
    let query = supabase
      .from('asset_requests')
      .select(`
        *,
        employee:employees!asset_requests_employee_id_fkey(id, first_name, last_name, email),
        category:asset_categories(*),
        approver:employees!asset_requests_approved_by_fkey(id, first_name, last_name),
        assigned_asset:assets(*)
      `)
      .order('requested_date', { ascending: false })

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<AssetRequest | null> {
    const { data, error } = await supabase
      .from('asset_requests')
      .select(`
        *,
        employee:employees!asset_requests_employee_id_fkey(id, first_name, last_name, email),
        category:asset_categories(*),
        approver:employees!asset_requests_approved_by_fkey(id, first_name, last_name),
        assigned_asset:assets(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(request: Partial<AssetRequest>): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .insert(request)
      .select()
      .single()
    
    if (error) throw error

    // Notify supervisor + admins
    if (request.employee_id) {
      await notifySupervisorsAndAdmins(
        'equipment_request_notifications',
        request.employee_id,
        data.id,
        'New Equipment Request',
        '{name} has submitted an equipment request for "' + (request.item_description ?? 'an item') + '".',
        '',
        (request as any).request_number
      )
    }

    return data
  },

  async update(id: string, updates: Partial<AssetRequest>): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async approve(id: string, approvedBy: string | null): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    await notifyRequesterOfDecision(
      'equipment_request_notifications', 'asset_requests', id,
      'approved', 'Equipment Request Approved',
      'Your equipment request has been approved.'
    )

    return data
  },

  async reject(id: string, approvedBy: string | null, reason: string): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        approved_date: new Date().toISOString().split('T')[0],
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    await notifyRequesterOfDecision(
      'equipment_request_notifications', 'asset_requests', id,
      'rejected', 'Equipment Request Rejected',
      `Your equipment request has been rejected: ${reason}`
    )

    return data
  },

  async fulfill(id: string, assetId: string): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({
        status: 'fulfilled',
        assigned_asset_id: assetId,
        fulfilled_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error} = await supabase
      .from('asset_requests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
