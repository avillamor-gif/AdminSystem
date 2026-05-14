import { createClient } from '@/lib/supabase/client'
import { notifySupervisorsAndAdmins, notifyRequesterOfDecision } from './requestNotification.helper'

const supabase = createClient()

// =====================================================
// TYPES
// =====================================================

export interface AssetCategory {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface AssetBrand {
  id: string
  name: string
  description?: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface AssetVendor {
  id: string
  name: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface Asset {
  id: string
  asset_tag: string | null
  name: string
  category_id?: string | null
  brand_id?: string | null
  model?: string | null
  serial_number?: string | null
  vendor_id?: string | null
  purchase_date?: string | null
  purchase_price?: number | null
  purchase_order_number?: string | null
  warranty_start_date?: string | null
  warranty_end_date?: string | null
  warranty_details?: string | null
  useful_life_years?: number | null
  salvage_value?: number | null
  depreciation_method?: 'straight_line' | 'declining_balance' | 'none' | null
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost' | 'damaged' | null
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
  location?: string | null
  assigned_to?: string | null
  assigned_date?: string | null
  specifications?: any
  qr_code?: string | null
  image_url?: string | null
  image_urls?: string[] | null
  notes?: string | null
  location_id?: string | null
  borrowable_by?: 'employees' | 'external' | 'both' | 'none' | null
  created_at: string | null
  updated_at: string | null
  // Relations
  category?: AssetCategory
  brand?: AssetBrand
  vendor?: AssetVendor
  employee?: any
  assetLocation?: AssetLocation
}

export interface AssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  assigned_by?: string | null
  assigned_date: string
  returned_date?: string | null
  returned_by?: string | null
  condition_on_assignment?: string | null
  condition_on_return?: string | null
  notes?: string | null
  created_at: string | null
  // Relations
  asset?: Asset
  employee?: any
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: 'repair' | 'inspection' | 'upgrade' | 'cleaning' | 'calibration' | null
  scheduled_date?: string | null
  completed_date?: string | null
  performed_by?: string | null
  vendor_id?: string | null
  cost?: number | null
  description: string
  notes?: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | null
  created_at: string | null
  updated_at: string | null
  // Relations
  asset?: Asset
  vendor?: AssetVendor
}

export interface AssetLocation {
  id: string
  name: string
  description?: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface AssetRequest {
  id: string
  asset_id?: string | null
  employee_id?: string | null
  category_id?: string | null
  item_description: string
  justification?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent' | null
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | null
  requested_date: string
  approved_by?: string | null
  approved_date?: string | null
  fulfilled_date?: string | null
  assigned_asset_id?: string | null
  rejection_reason?: string | null
  notes?: string | null
  returned_date?: string | null
  return_notes?: string | null
  borrow_start_date?: string | null
  borrow_end_date?: string | null
  // External borrower fields
  borrower_type?: 'employee' | 'external' | null
  external_borrower_name?: string | null
  external_borrower_org?: string | null
  external_borrower_contact?: string | null
  external_borrower_position?: string | null
  created_at: string | null
  updated_at: string | null
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
    return (data || []) as any
  },

  async getById(id: string): Promise<AssetCategory | null> {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(category: Partial<AssetCategory>): Promise<AssetCategory> {
    const { data, error } = await supabase
      .from('asset_categories')
      .insert(category as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<AssetCategory>): Promise<AssetCategory> {
    const { data, error } = await supabase
      .from('asset_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
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
    return (data || []) as any
  },

  async getById(id: string): Promise<AssetBrand | null> {
    const { data, error } = await supabase
      .from('asset_brands')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(brand: Partial<AssetBrand>): Promise<AssetBrand> {
    const { data, error } = await supabase
      .from('asset_brands')
      .insert(brand as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<AssetBrand>): Promise<AssetBrand> {
    const { data, error } = await supabase
      .from('asset_brands')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
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
    return (data || []) as any
  },

  async getById(id: string): Promise<AssetVendor | null> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async create(vendor: Partial<AssetVendor>): Promise<AssetVendor> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .insert(vendor as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<AssetVendor>): Promise<AssetVendor> {
    const { data, error } = await supabase
      .from('asset_vendors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
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
// ASSET LOCATIONS SERVICE
// =====================================================

export const assetLocationService = {
  async getAll(): Promise<AssetLocation[]> {
    const { data, error } = await supabase
      .from('asset_locations')
      .select('*')
      .order('name')
    if (error) throw error
    return (data || []) as unknown as AssetLocation[]
  },

  async create(location: Partial<AssetLocation>): Promise<AssetLocation> {
    const { data, error } = await supabase
      .from('asset_locations')
      .insert(location as any)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as AssetLocation
  },

  async update(id: string, updates: Partial<AssetLocation>): Promise<AssetLocation> {
    const { data, error } = await supabase
      .from('asset_locations')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as AssetLocation
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_locations')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
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
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters?.search) {
      query = query.or(`asset_tag.ilike.%${filters.search}%,name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
    }

    // Fetch assets
    const { data: assets, error } = await query
    if (error) throw error
    if (!assets || assets.length === 0) return []

    // Fetch all categories and employees referenced by assets
    const [categoriesRes, employeesRes] = await Promise.all([
      supabase.from('asset_categories').select('*'),
      supabase.from('employees').select('id, first_name, last_name, email')
    ])
    const categories = categoriesRes.data || []
    const employees = employeesRes.data || []

    // Map categories and employees by id
    const categoryMap = Object.fromEntries(categories.map((c: any) => [c.id, c]))
    const employeeMap = Object.fromEntries(employees.map((e: any) => [e.id, e]))

    // Attach category and employee objects to each asset
    const assetsWithRelations = assets.map((asset: any) => ({
      ...asset,
      category: asset.category_id ? categoryMap[asset.category_id] || null : null,
      employee: asset.assigned_to ? employeeMap[asset.assigned_to] || null : null
    }))

    return assetsWithRelations as Asset[]
  },

  async getById(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as unknown as Asset | null
  },

  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset as any)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as Asset
  },

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as Asset
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

    return data as any
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

    return data as any
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
      .select('*')
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
    return (data || []) as any
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
      .select('*')
      .order('scheduled_date', { ascending: false })

    if (filters?.asset_id) {
      query = query.eq('asset_id', filters.asset_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as unknown as AssetMaintenance[]
  },

  async getById(id: string): Promise<AssetMaintenance | null> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as unknown as AssetMaintenance | null
  },

  async create(maintenance: Partial<AssetMaintenance>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert(maintenance as any)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as AssetMaintenance
  },

  async update(id: string, updates: Partial<AssetMaintenance>): Promise<AssetMaintenance> {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as AssetMaintenance
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
      .select('*')
      .order('requested_date', { ascending: false })

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as unknown as AssetRequest[]
  },

  async getById(id: string): Promise<AssetRequest | null> {
    const { data, error } = await supabase
      .from('asset_requests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as unknown as AssetRequest | null
  },

  async create(request: Partial<AssetRequest>): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .insert(request as any)
      .select()
      .single()
    
    if (error) throw error

    // Notify supervisor + admins (employee requests only — external borrowers have no user account)
    if (request.employee_id && request.borrower_type !== 'external') {
      await notifySupervisorsAndAdmins(
        'equipment_request_notifications',
        request.employee_id,
        data.id,
        'New Equipment Request',
        '{name} has submitted an equipment request for "' + (request.item_description ?? 'an item') + '".',
        '',
        (request as any).request_number,
        'admin_resources'
      )
    }

    return data as any
  },

  async update(id: string, updates: Partial<AssetRequest>): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
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

    return data as any
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

    return data as any
  },

  async fulfill(id: string, assetId?: string | null): Promise<AssetRequest> {
    const update: Record<string, unknown> = {
      status: 'fulfilled',
      fulfilled_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }
    // Only set assigned_asset_id if we have a real asset UUID distinct from the request id
    if (assetId && assetId !== id) {
      update.assigned_asset_id = assetId
    }
    const { data, error } = await supabase
      .from('asset_requests')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    // Flip the physical asset to 'assigned' so it stops appearing as available
    const linkedAssetId = (assetId && assetId !== id)
      ? assetId
      : (data as any).assigned_asset_id   // only use the FK that definitely exists in DB
    if (linkedAssetId) {
      await supabase.from('assets').update({
        status: 'assigned',
        assigned_date: new Date().toISOString().split('T')[0],
      }).eq('id', linkedAssetId)
    }

    await notifyRequesterOfDecision(
      'equipment_request_notifications', 'asset_requests', id,
      'fulfilled', 'Equipment Request Fulfilled',
      'Your equipment request has been fulfilled and the item has been assigned to you.'
    )

    return data as any
  },

  async markReturned(id: string, notes?: string): Promise<AssetRequest> {
    const { data, error } = await supabase
      .from('asset_requests')
      .update({
        returned_date: new Date().toISOString().split('T')[0],
        return_notes: notes ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    // Restore the physical asset to 'available'
    const linkedAssetId = (data as any).assigned_asset_id || (data as any).asset_id
    if (linkedAssetId) {
      await supabase.from('assets').update({
        status: 'available',
        assigned_to: null,
        assigned_date: null,
      }).eq('id', linkedAssetId)
    }

    return data as any
  },

  /**
   * Check whether an asset has any conflicting borrows (pending/approved/fulfilled, not returned)
   * during the given date range (inclusive). Returns the conflicting requests.
   */
  async checkAvailability(
    assetId: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string
  ): Promise<AssetRequest[]> {
    // Query both assigned_asset_id (admin-assigned) and the asset_id stored at request creation
    const base = {
      from: 'asset_requests',
      statuses: ['pending', 'approved', 'fulfilled'] as string[],
    }

    const run = async (col: string) => {
      // Rows where borrow_end_date covers the requested range
      let q1 = supabase
        .from(base.from)
        .select('*')
        .eq(col, assetId)
        .in('status', base.statuses)
        .is('returned_date', null)
        .lte('borrow_start_date', endDate)
        .gte('borrow_end_date', startDate)
      if (excludeRequestId) q1 = q1.neq('id', excludeRequestId)

      // Rows with no borrow_end_date (open-ended / no scheduled return) — always block
      let q2 = supabase
        .from(base.from)
        .select('*')
        .eq(col, assetId)
        .in('status', base.statuses)
        .is('returned_date', null)
        .is('borrow_end_date', null)
        .lte('borrow_start_date', endDate)
      if (excludeRequestId) q2 = q2.neq('id', excludeRequestId)

      const [{ data: d1 }, { data: d2 }] = await Promise.all([q1, q2])
      return [...(d1 || []), ...(d2 || [])] as any[]
    }

    const [byAssigned, byRequested] = await Promise.all([
      run('assigned_asset_id'),
      run('asset_id'),
    ])

    // Deduplicate by id
    const seen = new Set<string>()
    const results: AssetRequest[] = []
    for (const r of [...byAssigned, ...byRequested]) {
      if (!seen.has(r.id)) { seen.add(r.id); results.push(r) }
    }
    return results
  },

  /**
   * Returns the earliest date the asset is free again (day after latest borrow_end_date),
   * or null if there are no active borrows.
   */
  async getNextAvailableDate(assetId: string): Promise<string | null> {
    const { data } = await supabase
      .from('asset_requests')
      .select('borrow_end_date')
      .or(`assigned_asset_id.eq.${assetId},asset_id.eq.${assetId}`)
      .in('status', ['pending', 'approved', 'fulfilled'])
      .is('returned_date', null)
      .not('borrow_end_date', 'is', null)
      .order('borrow_end_date', { ascending: false })
      .limit(1)
    if (!data || data.length === 0) return null
    // Day after the latest end date
    const latest = data[0].borrow_end_date as string
    const d = new Date(latest + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  },

  async delete(id: string): Promise<void> {
    const { error} = await supabase
      .from('asset_requests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
