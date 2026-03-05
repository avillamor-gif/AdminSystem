import { createClient } from '@/lib/supabase/client'

// Types
export interface CustomField {
  id: string
  name: string
  field_key: string
  field_type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select' | 'multi_select' | 'textarea' | 'checkbox' | 'url' | 'file'
  category: 'personal' | 'contact' | 'job' | 'emergency' | 'education' | 'certification' | 'custom'
  description?: string
  required: boolean
  visible: boolean
  editable: boolean
  searchable: boolean
  show_in_profile: boolean
  show_in_list: boolean
  field_order: number
  options?: any
  validation_rules?: any
  default_value?: string
  help_text?: string
  placeholder?: string
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface CustomFieldValue {
  id: string
  employee_id: string
  field_id: string
  value?: string
  value_array?: string[]
  created_at: string
  updated_at: string
}

export interface PIMFieldConfig {
  id: string
  field_name: string
  display_name: string
  field_group: 'basic' | 'contact' | 'job' | 'personal' | 'emergency' | 'documents' | 'salary' | 'benefits'
  is_required: boolean
  is_visible: boolean
  is_editable: boolean
  is_sensitive: boolean
  show_in_employee_list: boolean
  show_in_employee_profile: boolean
  show_in_reports: boolean
  field_order: number
  access_level: 'public' | 'internal' | 'restricted' | 'confidential'
  created_at: string
  updated_at: string
}

export interface DataImportLog {
  id: string
  import_type: 'bulk_create' | 'bulk_update' | 'csv_import' | 'excel_import' | 'api_sync'
  file_name?: string
  total_records: number
  successful_records: number
  failed_records: number
  error_log?: any
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partially_completed'
  imported_by?: string
  started_at: string
  completed_at?: string
  created_at: string
}

// Custom Fields Service
export const customFieldsService = {
  async getAll(filters?: { category?: string; status?: string }): Promise<CustomField[]> {
    const supabase = createClient()
    let query = supabase
      .from('employee_custom_fields')
      .select('*')
      .order('field_order', { ascending: true })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as any
  },

  async getById(id: string): Promise<CustomField> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_custom_fields')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as any
  },

  async create(field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>): Promise<CustomField> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_custom_fields')
      .insert(field as any)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async update(id: string, updates: Partial<CustomField>): Promise<CustomField> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_custom_fields')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('employee_custom_fields')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorder(fieldIds: string[]): Promise<void> {
    const supabase = createClient()
    const updates = fieldIds.map((id, index) => ({
      id,
      field_order: index
    }))

    for (const update of updates) {
      await supabase
        .from('employee_custom_fields')
        .update({ field_order: update.field_order })
        .eq('id', update.id)
    }
  }
}

// Custom Field Values Service
export const customFieldValuesService = {
  async getByEmployee(employeeId: string): Promise<CustomFieldValue[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_custom_field_values')
      .select('*')
      .eq('employee_id', employeeId)

    if (error) throw error
    return (data || []) as any
  },

  async upsert(employeeId: string, fieldId: string, value: string | string[]): Promise<CustomFieldValue> {
    const supabase = createClient()
    const isArray = Array.isArray(value)
    
    const { data, error } = await supabase
      .from('employee_custom_field_values')
      .upsert({
        employee_id: employeeId,
        field_id: fieldId,
        value: isArray ? null : value,
        value_array: isArray ? value : null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async delete(employeeId: string, fieldId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('employee_custom_field_values')
      .delete()
      .eq('employee_id', employeeId)
      .eq('field_id', fieldId)

    if (error) throw error
  }
}

// PIM Configuration Service
export const pimConfigService = {
  async getAll(filters?: { field_group?: string }): Promise<PIMFieldConfig[]> {
    const supabase = createClient()
    let query = supabase
      .from('pim_field_config')
      .select('*')
      .order('field_order', { ascending: true })

    if (filters?.field_group) {
      query = query.eq('field_group', filters.field_group)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as any
  },

  async update(id: string, updates: Partial<PIMFieldConfig>): Promise<PIMFieldConfig> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pim_field_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async bulkUpdate(configs: Array<{ id: string; updates: Partial<PIMFieldConfig> }>): Promise<void> {
    const supabase = createClient()
    
    for (const config of configs) {
      await supabase
        .from('pim_field_config')
        .update({ ...config.updates, updated_at: new Date().toISOString() })
        .eq('id', config.id)
    }
  }
}

// Data Import Service
export const dataImportService = {
  async getAll(filters?: { status?: string; limit?: number }): Promise<DataImportLog[]> {
    const supabase = createClient()
    let query = supabase
      .from('employee_data_imports')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as any
  },

  async create(importLog: Omit<DataImportLog, 'id' | 'created_at'>): Promise<DataImportLog> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_data_imports')
      .insert(importLog as any)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async updateStatus(id: string, status: DataImportLog['status'], updates?: Partial<DataImportLog>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('employee_data_imports')
      .update({ status, ...updates })
      .eq('id', id)

    if (error) throw error
  }
}
