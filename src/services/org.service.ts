import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Department = Tables<'departments'>
export type Employee = Tables<'employees'>

export type OrgNode = {
  id: string
  name: string
  title: string
  department: string
  email: string
  phone?: string
  location?: string
  level: number
  managerId?: string
  directReports: OrgNode[]
  employeeCount: number
  budget?: number
  avatar?: string
  status: 'active' | 'inactive' | 'on_leave'
  isExpanded?: boolean
}

export type DepartmentNode = {
  id: string
  name: string
  description?: string
  parentId?: string
  managerId?: string
  employeeCount: number
  children: DepartmentNode[]
  manager?: {
    id: string
    name: string
    title: string
    email: string
  }
  isExpanded?: boolean
}

export interface OrgFilters {
  search?: string
  department?: string
  level?: number
  status?: string
}

export const orgService = {
  async getOrgChart(): Promise<OrgNode[]> {
    const supabase = createClient()
    
    console.log('Fetching organizational chart data')
    
    try {
      // Get all employees with their department and manager information
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          manager_id,
          department:departments(id, name),
          job_title:job_titles(id, title),
          manager:employees!employees_manager_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .order('first_name')

      if (error) {
        console.error('Error fetching employees for org chart:', error)
        if (error.message?.includes('relation')) {
          return []
        }
        throw error
      }

      // Transform employees into org nodes
      const orgNodes: OrgNode[] = (employees || []).map((emp: any) => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        title: emp.job_title?.title || 'No Title',
        department: emp.department?.name || 'No Department',
        email: emp.email,
        phone: emp.phone,
        location: 'Office', // Default location
        level: 1, // Will be calculated later
        managerId: emp.manager_id,
        directReports: [],
        employeeCount: 0,
        status: emp.status === 'active' ? 'active' : 'inactive',
        isExpanded: true
      }))

      // Build hierarchical structure
      const orgTree = this.buildOrgTree(orgNodes)
      
      console.log('Built org chart:', orgTree)
      return orgTree
    } catch (error) {
      console.error('Error in org service:', error)
      return []
    }
  },

  async getDepartmentHierarchy(): Promise<DepartmentNode[]> {
    const supabase = createClient()
    
    console.log('Fetching department hierarchy')
    
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          parent_id,
          employees(count)
        `)
        .order('name')

      if (error) {
        console.error('Error fetching departments:', error)
        return []
      }

      // Transform departments into tree structure
      const departmentNodes: DepartmentNode[] = (departments || []).map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        parentId: dept.parent_id,
        employeeCount: dept.employees?.[0]?.count || 0,
        children: [],
        isExpanded: true
      }))

      // Build hierarchical structure
      const deptTree = this.buildDepartmentTree(departmentNodes)
      
      console.log('Built department hierarchy:', deptTree)
      return deptTree
    } catch (error) {
      console.error('Error in department hierarchy service:', error)
      return []
    }
  },

  async updateEmployeeManager(employeeId: string, managerId: string | null): Promise<void> {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ 
          manager_id: managerId,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', employeeId)
      
      if (error) {
        console.error('Error updating employee manager:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in update employee manager:', error)
      throw error
    }
  },

  async updateDepartmentParent(departmentId: string, parentId: string | null): Promise<void> {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('departments')
        .update({ parent_id: parentId } as any)
        .eq('id', departmentId)
      
      if (error) {
        console.error('Error updating department parent:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in update department parent:', error)
      throw error
    }
  },

  // Helper method to build org tree from flat employee list
  buildOrgTree(employees: OrgNode[]): OrgNode[] {
    const employeeMap = new Map(employees.map(emp => [emp.id, { ...emp, directReports: [] }]))
    const rootNodes: OrgNode[] = []
    
    // Build parent-child relationships
    employees.forEach(emp => {
      const employee = employeeMap.get(emp.id)!
      
      if (emp.managerId) {
        const manager = employeeMap.get(emp.managerId)
        if (manager) {
          (manager as any).directReports.push(employee as any)
          employee.level = this.calculateLevel(emp.managerId, employeeMap) + 1
        } else {
          // Manager not found, treat as root
          rootNodes.push(employee)
        }
      } else {
        // No manager, this is a root node
        rootNodes.push(employee)
      }
    })

    // Calculate employee counts
    this.calculateEmployeeCounts(rootNodes)
    
    return rootNodes
  },

  // Helper method to build department tree
  buildDepartmentTree(departments: DepartmentNode[]): DepartmentNode[] {
    const deptMap = new Map(departments.map(dept => [dept.id, { ...dept, children: [] }]))
    const rootNodes: DepartmentNode[] = []
    
    departments.forEach(dept => {
      const department = deptMap.get(dept.id)!
      
      if (dept.parentId) {
        const parent = deptMap.get(dept.parentId)
        if (parent) {
          (parent as any).children.push(department as any)
        } else {
          rootNodes.push(department)
        }
      } else {
        rootNodes.push(department)
      }
    })
    
    return rootNodes
  },

  // Helper to calculate hierarchy level
  calculateLevel(managerId: string, employeeMap: Map<string, OrgNode>, visited = new Set()): number {
    if (visited.has(managerId)) return 0 // Prevent infinite loops
    
    visited.add(managerId)
    const manager = employeeMap.get(managerId)
    
    if (!manager || !manager.managerId) {
      return 1
    }
    
    return this.calculateLevel(manager.managerId, employeeMap, visited) + 1
  },

  // Helper to calculate employee counts
  calculateEmployeeCounts(nodes: OrgNode[]): void {
    nodes.forEach(node => {
      if (node.directReports.length > 0) {
        this.calculateEmployeeCounts(node.directReports)
        node.employeeCount = node.directReports.reduce((sum, report) => sum + report.employeeCount + 1, 0)
      } else {
        node.employeeCount = 0
      }
    })
  }
}