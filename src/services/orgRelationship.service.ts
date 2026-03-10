import { createClient } from '@/lib/supabase/client'

// Manual type — org_relationships was added via migration after last db:types run
export interface OrgRelationship {
  id: string
  parent_id: string
  child_id: string
  relationship_type: string
  department_id: string | null
  start_date: string | null
  end_date: string | null
  status: string
  notes: string | null
  created_at: string | null
  updated_at: string | null
}
export type OrgRelationshipInsert = Omit<OrgRelationship, 'id' | 'created_at' | 'updated_at'>
export type OrgRelationshipUpdate = Partial<OrgRelationshipInsert>

export interface OrgRelationshipWithRelations extends OrgRelationship {
  parent?: {
    id: string
    first_name: string
    last_name: string
    email: string
    job_title_id: string | null
    department_id: string | null
  }
  child?: {
    id: string
    first_name: string
    last_name: string
    email: string
    job_title_id: string | null
    department_id: string | null
  }
  department?: {
    id: string
    name: string
    description: string | null
  }
}

export interface OrgRelationshipFilters {
  parent_id?: string
  child_id?: string
  department_id?: string
  relationship_type?: string
  status?: string
}

export interface OrgChartNode {
  id: string
  name: string
  title: string
  department: string
  email: string
  children: OrgChartNode[]
  relationship_type?: string
}

export const orgRelationshipService = {
  async getAll(filters?: OrgRelationshipFilters): Promise<OrgRelationshipWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('org_relationships')
      .select(`
        *,
        parent:employees!org_relationships_parent_id_fkey(id, first_name, last_name, email, job_title_id, department_id),
        child:employees!org_relationships_child_id_fkey(id, first_name, last_name, email, job_title_id, department_id),
        department:departments(id, name, description)
      `)
      .order('created_at', { ascending: false })

    if (filters?.parent_id) {
      query = query.eq('parent_id', filters.parent_id)
    }

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id)
    }

    if (filters?.relationship_type) {
      query = query.eq('relationship_type', filters.relationship_type)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching org relationships:', error)
      throw error
    }

    return data as unknown as OrgRelationshipWithRelations[]
  },

  async getById(id: string): Promise<OrgRelationshipWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('org_relationships')
      .select(`
        *,
        parent:employees!org_relationships_parent_id_fkey(id, first_name, last_name, email, job_title_id, department_id),
        child:employees!org_relationships_child_id_fkey(id, first_name, last_name, email, job_title_id, department_id),
        department:departments(id, name, description)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching org relationship:', error)
      throw error
    }

    return data as unknown as OrgRelationshipWithRelations
  },

  async getDirectReports(employeeId: string): Promise<OrgRelationshipWithRelations[]> {
    return this.getAll({ 
      parent_id: employeeId, 
      relationship_type: 'direct_report',
      status: 'active' 
    })
  },

  async getManager(employeeId: string): Promise<OrgRelationshipWithRelations | null> {
    const relationships = await this.getAll({ 
      child_id: employeeId, 
      relationship_type: 'direct_report',
      status: 'active' 
    })
    return relationships[0] || null
  },

  async buildOrgChart(rootEmployeeId?: string): Promise<OrgChartNode[]> {
    const supabase = createClient()
    
    // If no root provided, find top-level employees (those without a manager)
    let rootEmployees: any[] = []
    
    if (rootEmployeeId) {
      const { data, error } = await supabase
        .from('employees')
        .select('*, job_title:job_titles(title), department:departments(name)')
        .eq('id', rootEmployeeId)
      
      if (!error && data) {
        rootEmployees = data
      }
    } else {
      // Find employees who are not children in any active direct_report relationship
      const { data: allEmployees } = await supabase
        .from('employees')
        .select('*, job_title:job_titles(title), department:departments(name)')
      
      const { data: allRelationships } = await supabase
        .from('org_relationships')
        .select('child_id')
        .eq('relationship_type', 'direct_report')
        .eq('status', 'active')
      
      const childIds = new Set(allRelationships?.map(r => r.child_id) || [])
      rootEmployees = allEmployees?.filter(emp => !childIds.has(emp.id)) || []
    }

    // Recursively build the tree
    const buildTree = async (employee: any): Promise<OrgChartNode> => {
      const directReports = await this.getDirectReports(employee.id)
      
      const children = await Promise.all(
        directReports.map(async (rel) => {
          if (rel.child) {
            const childEmployee = await supabase
              .from('employees')
              .select('*, job_title:job_titles(title), department:departments(name)')
              .eq('id', rel.child.id)
              .single()
            
            if (childEmployee.data) {
              return buildTree(childEmployee.data)
            }
          }
          return null
        })
      )

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        title: employee.job_title?.title || 'No Title',
        department: employee.department?.name || 'No Department',
        email: employee.email,
        children: children.filter(Boolean) as unknown as OrgChartNode[],
      }
    }

    return Promise.all(rootEmployees.map(emp => buildTree(emp)))
  },

  async create(data: OrgRelationshipInsert): Promise<OrgRelationship> {
    const supabase = createClient()
    const { data: newRelationship, error } = await supabase
      .from('org_relationships')
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating org relationship:', error)
      throw error
    }

    return newRelationship
  },

  async update(id: string, data: OrgRelationshipUpdate): Promise<OrgRelationship> {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('org_relationships')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating org relationship:', error)
      throw error
    }

    return updated
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('org_relationships')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting org relationship:', error)
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
      supabase.from('org_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('org_relationships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('org_relationships').select('relationship_type').order('relationship_type'),
    ])

    const typeDistribution = byType?.reduce((acc, item) => {
      const key = item.relationship_type ?? 'unknown'
      acc[key] = (acc[key] || 0) + 1
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
