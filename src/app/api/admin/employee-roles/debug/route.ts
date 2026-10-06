import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (empError) {
      return NextResponse.json({ error: `Employee fetch error: ${empError.message}`, empError })
    }

    if (!employee) {
      return NextResponse.json({ error: `Employee not found` })
    }

    // Try to find user by email
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    })

    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}`, authError })
    }

    const matchingUser = users?.find((u: any) => u.email === employee.email)

    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')

    if (rolesError) {
      return NextResponse.json({ error: `Roles fetch error: ${rolesError.message}` })
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name
      },
      authUser: matchingUser ? {
        id: matchingUser.id,
        email: matchingUser.email
      } : null,
      totalAuthUsers: users?.length || 0,
      rolesCount: roles?.length || 0,
      roles: roles?.map((r: any) => ({ id: r.id, name: r.name })) || []
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug error' },
      { status: 500 }
    )
  }
}
