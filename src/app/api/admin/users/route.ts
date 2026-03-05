import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client for all DB queries — bypasses RLS, avoids join alias PGRST200
    const adminClient = createAdminClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    
    // Fetch user_roles (no join — plain columns only)
    let rolesQuery = adminClient
      .from('user_roles')
      .select('id, user_id, role, employee_id, created_at, updated_at')
    
    if (role) {
      rolesQuery = rolesQuery.eq('role', role)
    }
    
    const { data: userRoles, error: rolesError } = await rolesQuery
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Collect unique employee_ids to fetch in one query
    // user_roles.employee_id may be a UUID (employees.id) or HR code (employees.employee_id)
    const employeeIds = [...new Set(
      (userRoles || []).map((ur: any) => ur.employee_id).filter(Boolean)
    )]

    // Fetch employees, departments, job_titles in parallel
    // Match on both employees.id (UUID) AND employees.employee_id (HR code) to handle both cases
    const [
      { data: authUsersData, error: authUsersError },
      { data: employeesByUuid },
      { data: employeesByHrCode },
      { data: departments },
      { data: jobTitles },
    ] = await Promise.all([
      adminClient.auth.admin.listUsers(),
      employeeIds.length
        ? adminClient.from('employees').select('id, first_name, last_name, avatar_url, department_id, job_title_id, employee_id').in('id', employeeIds)
        : Promise.resolve({ data: [] }),
      employeeIds.length
        ? adminClient.from('employees').select('id, first_name, last_name, avatar_url, department_id, job_title_id, employee_id').in('employee_id', employeeIds)
        : Promise.resolve({ data: [] }),
      adminClient.from('departments').select('id, name'),
      adminClient.from('job_titles').select('id, title'),
    ])

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError)
      return NextResponse.json({ error: authUsersError.message }, { status: 500 })
    }

    const authUsers = authUsersData?.users ?? []
    // Build lookup maps for both UUID and HR code
    const allEmployees = [...(employeesByUuid || []), ...(employeesByHrCode || [])]
    const empByUuid   = Object.fromEntries(allEmployees.map((e: any) => [e.id, e]))
    const empByHrCode = Object.fromEntries(allEmployees.map((e: any) => [e.employee_id, e]))
    const deptMap = Object.fromEntries((departments || []).map((d: any) => [d.id, d.name]))
    const jtMap   = Object.fromEntries((jobTitles   || []).map((j: any) => [j.id, j.title]))
    // Map and combine data
    const users = (userRoles || []).map((userRole: any) => {
      const authUser = authUsers.find((u: any) => u.id === userRole.user_id)
      // Try UUID lookup first, fall back to HR code lookup
      const employee = userRole.employee_id
        ? (empByUuid[userRole.employee_id] ?? empByHrCode[userRole.employee_id] ?? null)
        : null
      
      return {
        id: userRole.id,
        email: authUser?.email || 'unknown@example.com',
        name: employee ? `${employee.first_name} ${employee.last_name}` : (authUser?.email?.split('@')[0] || 'Unknown'),
        role: userRole.role,
        status: 'active',
        employee_id: employee?.id || userRole.employee_id,
        last_login: authUser?.last_sign_in_at || null,
        created_at: userRole.created_at,
        updated_at: userRole.updated_at,
        employee: employee ? {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          avatar_url: employee.avatar_url,
          employee_id: employee.employee_id,
          department: employee.department_id ? { name: deptMap[employee.department_id] ?? null } : null,
          job_title:  employee.job_title_id  ? { title: jtMap[employee.job_title_id]   ?? null } : null,
        } : null
      }
    })
    
    // Apply search filter
    let filteredUsers = users
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = users.filter((u: any) => 
        u.email.toLowerCase().includes(searchLower) ||
        u.name.toLowerCase().includes(searchLower)
      )
    }
    
    return NextResponse.json(filteredUsers)
    
  } catch (error: any) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
