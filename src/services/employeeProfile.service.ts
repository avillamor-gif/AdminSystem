import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type Employee = Tables<'employees'>
export type EmployeeInsert = InsertTables<'employees'>
export type EmployeeUpdate = UpdateTables<'employees'>

export type EmployeeProfile = {
  id: string
  employeeId: string
  personalInfo: {
    firstName: string
    lastName: string
    middleName?: string
    preferredName?: string
    dateOfBirth?: string
    nationality?: string
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
    profilePhoto?: string
  }
  contactInfo: {
    email: string
    personalEmail?: string
    phone?: string
    mobilePhone?: string
    address?: string
    city?: string
    country?: string
    emergencyContact?: {
      name: string
      relationship: string
      phone: string
    }
  }
  employmentInfo: {
    hireDate: string
    status: 'active' | 'inactive' | 'terminated'
    department?: string
    jobTitle?: string
    employmentType?: string
    manager?: string
    workLocation?: string
    salary?: number
    currency?: string
  }
  skills?: string[]
  certifications?: Array<{
    name: string
    issuer: string
    dateIssued: string
    expiryDate?: string
  }>
  education?: Array<{
    institution: string
    degree: string
    fieldOfStudy: string
    graduationYear: string
  }>
  created_at: string
  updated_at: string
}

export type EmployeeProfileInsert = {
  personalInfo: EmployeeProfile['personalInfo']
  contactInfo: Omit<EmployeeProfile['contactInfo'], 'emergencyContact'> & {
    emergencyContact?: EmployeeProfile['contactInfo']['emergencyContact']
  }
  employmentInfo: Omit<EmployeeProfile['employmentInfo'], 'salary'>
  skills?: string[]
  certifications?: EmployeeProfile['certifications']
  education?: EmployeeProfile['education']
}

export type EmployeeProfileUpdate = Partial<EmployeeProfileInsert>

export interface ProfileFilters {
  search?: string
  department?: string
  status?: string
  jobTitle?: string
  location?: string
}

export const employeeProfileService = {
  async getAll(filters?: ProfileFilters): Promise<EmployeeProfile[]> {
    const supabase = createClient()
    
    console.log('Fetching employee profiles with filters:', filters)
    
    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          job_title:job_titles(*),
          manager:employees!employees_manager_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .order('first_name')

      // Apply filters
      if (filters?.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        )
      }

      if (filters?.status) {
        query = query.eq('status', filters.status as 'active' | 'inactive' | 'terminated')
      }

      const { data: employees, error } = await query as { data: any[] | null, error: any }

      if (error) {
        console.error('Error fetching employee profiles:', error)
        if (error.message?.includes('relation')) {
          return []
        }
        throw error
      }

      // Transform to EmployeeProfile format
      const profiles: EmployeeProfile[] = (employees || []).map((emp: any) => ({
        id: emp.id,
        employeeId: emp.employee_id,
        personalInfo: {
          firstName: emp.first_name,
          lastName: emp.last_name,
          dateOfBirth: emp.date_of_birth,
          profilePhoto: emp.avatar_url,
        },
        contactInfo: {
          email: emp.email,
          phone: emp.phone,
          address: emp.address,
          city: emp.city,
          country: emp.country,
        },
        employmentInfo: {
          hireDate: emp.hire_date,
          status: emp.status,
          department: emp.department?.name,
          jobTitle: emp.job_title?.title,
          manager: emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : undefined,
        },
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      }))

      // Apply additional client-side filters
      let filteredProfiles = profiles

      if (filters?.department && filters.department !== '') {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.employmentInfo.department === filters.department
        )
      }

      if (filters?.jobTitle && filters.jobTitle !== '') {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.employmentInfo.jobTitle === filters.jobTitle
        )
      }

      console.log('Fetched employee profiles:', filteredProfiles)
      return filteredProfiles
    } catch (error) {
      console.error('Error in employee profile service:', error)
      return []
    }
  },

  async getById(id: string): Promise<EmployeeProfile | null> {
    const supabase = createClient()
    
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          job_title:job_titles(*),
          manager:employees!employees_manager_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single() as { data: any | null, error: any }

      if (error || !employee) {
        console.error('Error fetching employee profile:', error)
        return null
      }

      const profile: EmployeeProfile = {
        id: employee.id,
        employeeId: employee.employee_id,
        personalInfo: {
          firstName: employee.first_name,
          lastName: employee.last_name,
          dateOfBirth: employee.date_of_birth,
          profilePhoto: employee.avatar_url,
        },
        contactInfo: {
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          city: employee.city,
          country: employee.country,
        },
        employmentInfo: {
          hireDate: employee.hire_date,
          status: employee.status,
          department: employee.department?.name,
          jobTitle: employee.job_title?.title,
          manager: employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : undefined,
        },
        created_at: employee.created_at,
        updated_at: employee.updated_at,
      }

      return profile
    } catch (error) {
      console.error('Error in getById employee profile:', error)
      return null
    }
  },

  async create(profileData: EmployeeProfileInsert): Promise<EmployeeProfile> {
    const supabase = createClient()
    
    try {
      // Create employee record
      const { data: employee, error } = await supabase
        .from('employees')
        .insert({
          employee_id: `EMP-${Date.now()}`, // Generate employee ID
          first_name: profileData.personalInfo.firstName,
          last_name: profileData.personalInfo.lastName,
          email: profileData.contactInfo.email,
          phone: profileData.contactInfo.phone,
          date_of_birth: profileData.personalInfo.dateOfBirth,
          hire_date: profileData.employmentInfo.hireDate,
          status: 'active',
          address: profileData.contactInfo.address,
          city: profileData.contactInfo.city,
          country: profileData.contactInfo.country,
        } as any)
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          hire_date,
          status,
          address,
          city,
          country,
          created_at,
          updated_at
        `)
        .single()

      if (error || !employee) {
        console.error('Error creating employee profile:', error)
        throw error || new Error('Failed to create employee profile')
      }

      // Transform to EmployeeProfile format
      const emp = employee as any
      const profile: EmployeeProfile = {
        id: emp.id,
        employeeId: emp.employee_id,
        personalInfo: {
          firstName: emp.first_name,
          lastName: emp.last_name,
          dateOfBirth: emp.date_of_birth,
        },
        contactInfo: {
          email: emp.email,
          phone: emp.phone,
          address: emp.address,
          city: emp.city,
          country: emp.country,
        },
        employmentInfo: {
          hireDate: emp.hire_date,
          status: emp.status,
        },
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      }

      return profile
    } catch (error) {
      console.error('Error in create employee profile:', error)
      throw error
    }
  },

  async update(id: string, profileData: EmployeeProfileUpdate): Promise<EmployeeProfile> {
    const supabase = createClient()
    
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Map profile data to employee table fields
      if (profileData.personalInfo) {
        if (profileData.personalInfo.firstName) updateData.first_name = profileData.personalInfo.firstName
        if (profileData.personalInfo.lastName) updateData.last_name = profileData.personalInfo.lastName
        if (profileData.personalInfo.dateOfBirth) updateData.date_of_birth = profileData.personalInfo.dateOfBirth
      }

      if (profileData.contactInfo) {
        if (profileData.contactInfo.email) updateData.email = profileData.contactInfo.email
        if (profileData.contactInfo.phone) updateData.phone = profileData.contactInfo.phone
        if (profileData.contactInfo.address) updateData.address = profileData.contactInfo.address
        if (profileData.contactInfo.city) updateData.city = profileData.contactInfo.city
        if (profileData.contactInfo.country) updateData.country = profileData.contactInfo.country
      }

      if (profileData.employmentInfo) {
        if (profileData.employmentInfo.hireDate) updateData.hire_date = profileData.employmentInfo.hireDate
        if (profileData.employmentInfo.status) updateData.status = profileData.employmentInfo.status
      }

      const { data: employee, error } = await supabase
        .from('employees')
        .update(updateData as any)
        .eq('id', id)
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          hire_date,
          status,
          address,
          city,
          country,
          created_at,
          updated_at
        `)
        .single()

      if (error || !employee) {
        console.error('Error updating employee profile:', error)
        throw error || new Error('Failed to update employee profile')
      }

      // Transform to EmployeeProfile format
      const emp2 = employee as any
      const profile: EmployeeProfile = {
        id: emp2.id,
        employeeId: emp2.employee_id,
        personalInfo: {
          firstName: emp2.first_name,
          lastName: emp2.last_name,
          dateOfBirth: emp2.date_of_birth,
        },
        contactInfo: {
          email: emp2.email,
          phone: emp2.phone,
          address: emp2.address,
          city: emp2.city,
          country: emp2.country,
        },
        employmentInfo: {
          hireDate: emp2.hire_date,
          status: emp2.status,
        },
        created_at: emp2.created_at,
        updated_at: emp2.updated_at,
      }

      return profile
    } catch (error) {
      console.error('Error in update employee profile:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting employee profile:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in delete employee profile:', error)
      throw error
    }
  },
}