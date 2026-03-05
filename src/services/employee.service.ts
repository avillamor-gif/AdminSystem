import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Employee = Tables<'employees'>
export type EmployeeInsert = InsertTables<'employees'>
export type EmployeeUpdate = UpdateTables<'employees'>

export type EmployeeWithRelations = Employee & {
  department?: { id: string; name: string } | null
  job_title?: { id: string; title: string } | null
  manager?: { id: string; first_name: string; last_name: string } | null
}

export interface EmployeeFilters {
  search?: string
  department?: string
  status?: string
  jobTitle?: string
}

export const employeeService = {
  async getAll(filters?: EmployeeFilters): Promise<EmployeeWithRelations[]> {
    const supabase = createClient()
    
    console.log('Fetching employees with filters:', filters)
    
    // Fetch employees without nested joins to avoid relationship ambiguity
    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.department) {
      query = query.eq('department_id', filters.department)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status as Employee['status'])
    }

    const { data: employees, error } = await query

    console.log('Employee query result:', { count: employees?.length, error })

    if (error) {
      console.error('Error fetching employees:', error)
      throw error
    }

    if (!employees || employees.length === 0) {
      return []
    }

    // Fetch departments and job titles separately
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')

    const { data: jobTitles } = await supabase
      .from('job_titles')
      .select('id, title')

    // Map departments and job titles to employees
    const employeesWithRelations: EmployeeWithRelations[] = employees.map(emp => ({
      ...emp,
      department: departments?.find(d => d.id === emp.department_id) || null,
      job_title: jobTitles?.find(jt => jt.id === emp.job_title_id) || null,
      manager: null
    }))
    
    return employeesWithRelations
  },

  async getById(id: string): Promise<EmployeeWithRelations | null> {
    const supabase = createClient()
    
    // Fetch employee without nested joins
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching employee by id:', error)
      throw error
    }

    if (!employee) {
      return null
    }

    // Fetch related data separately
    const [departmentResult, jobTitleResult, managerResult] = await Promise.all([
      employee.department_id 
        ? supabase.from('departments').select('id, name').eq('id', employee.department_id).single()
        : Promise.resolve({ data: null }),
      employee.job_title_id
        ? supabase.from('job_titles').select('id, title').eq('id', employee.job_title_id).single()
        : Promise.resolve({ data: null }),
      employee.manager_id
        ? supabase.from('employees').select('id, first_name, last_name').eq('id', employee.manager_id).single()
        : Promise.resolve({ data: null })
    ])
    
    return {
      ...employee,
      department: departmentResult.data,
      job_title: jobTitleResult.data,
      manager: managerResult.data
    } as EmployeeWithRelations
  },

  async getByEmployeeId(employeeId: string): Promise<EmployeeWithRelations | null> {
    const supabase = createClient()
    
    // Fetch employee without nested joins
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (error) {
      console.error('Error fetching employee by employee_id:', error)
      throw error
    }

    if (!employee) {
      return null
    }

    // Fetch related data separately
    const [departmentResult, jobTitleResult] = await Promise.all([
      employee.department_id 
        ? supabase.from('departments').select('id, name').eq('id', employee.department_id).single()
        : Promise.resolve({ data: null }),
      employee.job_title_id
        ? supabase.from('job_titles').select('id, title').eq('id', employee.job_title_id).single()
        : Promise.resolve({ data: null })
    ])
    
    return {
      ...employee,
      department: departmentResult.data,
      job_title: jobTitleResult.data,
      manager: null
    } as EmployeeWithRelations
    
    // Fetch manager separately if manager_id exists
    if (data && data.manager_id) {
      const { data: managerData } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('id', data.manager_id)
        .single()
      
      if (managerData) {
        return { ...data, manager: managerData } as EmployeeWithRelations
      }
    }
    
    return data as EmployeeWithRelations | null
  },

  async create(employee: EmployeeInsert): Promise<Employee> {
    const supabase = createClient()
    console.log('Creating employee with data:', employee)
    
    const { data, error } = await supabase
      .from('employees')
      .insert(employee as never)
      .select()
      .single()

    if (error) {
      console.error('Supabase create error:', error)
      throw error
    }
    
    console.log('Employee created successfully:', data)
    return data as Employee
  },

  async update(id: string, employee: EmployeeUpdate): Promise<Employee> {
    // Use the server API route to bypass RLS — allows both admins and employees
    // editing their own profile to succeed without requiring an admin-only RLS policy.
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || 'Failed to update employee')
    }

    return res.json() as Promise<Employee>
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getCurrentEmployee(): Promise<EmployeeWithRelations | null> {
    const supabase = createClient()
    
    console.log('getCurrentEmployee: Starting...')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('getCurrentEmployee: User:', user?.id, user?.email)
    if (!user) {
      console.log('getCurrentEmployee: No user found')
      return null
    }

    // Get employee_id from user_roles
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('employee_id')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('getCurrentEmployee: User role:', userRole, 'Error:', roleError)

    if (roleError || !userRole?.employee_id) {
      // Try to find employee by email as fallback
      const { data: employeeByEmail, error: emailError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      if (emailError || !employeeByEmail) {
        console.error('Error getting employee from user_roles:', roleError)
        return null
      }

      // Create user_role entry for future use
      const { error: createRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          employee_id: employeeByEmail.id,
          role: 'employee'
        })

      if (createRoleError) {
        console.error('Error creating user_role:', createRoleError)
        // Continue anyway, we have the employee data
      } else {
        console.log('Created user_role entry for employee:', employeeByEmail.id)
      }

      // Use employee found by email
      const employeeId = employeeByEmail.id

      // Get full employee details
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (error || !employee) {
        return null
      }

      // Fetch related data
      const [departmentResult, jobTitleResult, managerResult] = await Promise.all([
        employee.department_id 
          ? supabase.from('departments').select('id, name').eq('id', employee.department_id).single()
          : Promise.resolve({ data: null }),
        employee.job_title_id
          ? supabase.from('job_titles').select('id, title').eq('id', employee.job_title_id).single()
          : Promise.resolve({ data: null }),
        employee.manager_id
          ? supabase.from('employees').select('id, first_name, last_name').eq('id', employee.manager_id).single()
          : Promise.resolve({ data: null })
      ])

      return {
        ...employee,
        department: departmentResult.data,
        job_title: jobTitleResult.data,
        manager: managerResult.data
      } as EmployeeWithRelations
    }

    // Get full employee details without nested joins
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userRole.employee_id)
      .single()

    console.log('getCurrentEmployee: Employee data:', employee, 'Error:', error)

    if (error) {
      console.error('Error fetching employee details:', error)
      return null
    }

    if (!employee) {
      return null
    }

    // Fetch related data separately
    const [departmentResult, jobTitleResult, managerResult] = await Promise.all([
      employee.department_id 
        ? supabase.from('departments').select('id, name').eq('id', employee.department_id).single()
        : Promise.resolve({ data: null }),
      employee.job_title_id
        ? supabase.from('job_titles').select('id, title').eq('id', employee.job_title_id).single()
        : Promise.resolve({ data: null }),
      employee.manager_id
        ? supabase.from('employees').select('id, first_name, last_name').eq('id', employee.manager_id).single()
        : Promise.resolve({ data: null })
    ])

    const employeeWithRelations = {
      ...employee,
      department: departmentResult.data,
      job_title: jobTitleResult.data,
      manager: managerResult.data
    } as EmployeeWithRelations

    console.log('getCurrentEmployee: Success, returning:', employeeWithRelations)
    return employeeWithRelations
  },
}
