import { createAdminClient } from '@/lib/supabase/admin'
import { type Tables } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { updates } = await request.json() as {
      updates: Array<{ employeeId: string; roleId: string }>
    }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request: updates array required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const results = []
    const errors = []

    // Get all roles once
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return NextResponse.json(
        { error: `Failed to fetch roles: ${rolesError.message}` },
        { status: 500 }
      )
    }

    const roleMap: Record<string, { id: string; name: string }> = {}
    allRoles?.forEach((r: any) => {
      roleMap[r.id] = { id: r.id, name: r.name }
    })

    for (const update of updates) {
      try {
        const { employeeId, roleId } = update

        if (!employeeId || !roleId) {
          errors.push(`Missing employeeId or roleId for update`)
          continue
        }

        // Validate role exists
        if (!roleMap[roleId]) {
          errors.push(`Role ${roleId} not found`)
          continue
        }

        // Step 1: Get employee to verify it exists
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('id, email, first_name, last_name')
          .eq('id', employeeId)
          .single()

        if (empError || !employee) {
          console.error(`Employee not found: ${employeeId}`, empError)
          errors.push(`Employee ${employeeId} not found`)
          continue
        }

        if (!employee.email) {
          errors.push(`Employee ${employee.first_name} ${employee.last_name} has no email`)
          continue
        }

        // Step 2: Get user_id from auth.users by email
        // Use query to auth.users table with admin client
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
          perPage: 1000
        })

        if (authError) {
          console.error('Error fetching auth users:', authError)
          errors.push(`Failed to fetch auth users: ${authError.message}`)
          continue
        }

        const authUser = users?.find((u: any) => u.email === employee.email)
        if (!authUser) {
          console.warn(`No auth user found for ${employee.email}`)
          errors.push(`No auth user found for ${employee.first_name} ${employee.last_name}`)
          continue
        }

        const userId = authUser.id

        // Step 3: Get role details
        const role = roleMap[roleId]
        const roleName = role.name.toLowerCase().replace(/\s+/g, '_')

        console.log(`Updating user ${userId} to role ${roleName} (${roleId})`)

        // Step 4: Upsert into user_roles
        const { data, error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            {
              user_id: userId,
              employee_id: employeeId,
              role: roleName,
              role_id: roleId,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .select()

        if (upsertError) {
          console.error(`Error upserting for employee ${employeeId}:`, upsertError)
          errors.push(`Failed to update ${employee.first_name} ${employee.last_name}: ${upsertError.message}`)
          continue
        }

        results.push({
          employee_id: employeeId,
          user_id: userId,
          role_id: roleId,
          role_name: role.name,
          status: 'updated'
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Exception processing update for ${update.employeeId}:`, error)
        errors.push(`Error: ${errorMsg}`)
      }
    }

    console.log(`Completed: ${results.length} updated, ${errors.length} errors`)

    return NextResponse.json(
      {
        success: errors.length === 0,
        updated: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: errors.length > 0 && results.length === 0 ? 400 : 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/employee-roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update employee roles' },
      { status: 500 }
    )
  }
}
