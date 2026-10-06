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

        // Step 2: Try to find existing user_roles entry for this employee
        // OR query user_roles to see if we already have a user_id for this employee
        const { data: existingUserRole, error: existingError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('employee_id', employeeId)
          .single()

        let userId: string | null = null

        if (existingUserRole?.user_id) {
          // We already have a user_id for this employee
          userId = existingUserRole.user_id
          console.log(`Found existing user_id ${userId} for employee ${employeeId}`)
        } else {
          // Need to find user by email from auth.users
          // Fall back to querying auth endpoint or throwing error
          console.warn(`No existing user_roles entry for employee ${employeeId}`)
          errors.push(`No existing auth user found for ${employee.first_name} ${employee.last_name}. Please create user first via employee setup.`)
          continue
        }

        // Step 3: Get role details
        const role = roleMap[roleId]

        console.log(`Updating user ${userId} to role ${roleId} (${role.name})`)

        // Step 4: Upsert into user_roles
        // First: upsert the basic fields (avoid schema cache issues with role_id)
        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            {
              user_id: userId,
              employee_id: employeeId,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .select('*')

        if (upsertError) {
          console.error(`Error upserting for employee ${employeeId}:`, upsertError)
          errors.push(`Failed to update ${employee.first_name} ${employee.last_name}: ${upsertError.message}`)
          continue
        }

        // Step 5: Update role_id separately to avoid schema cache issues
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role_id: roleId })
          .eq('user_id', userId)

        if (updateError) {
          console.error(`Error updating role_id for employee ${employeeId}:`, updateError)
          errors.push(`Failed to update role for ${employee.first_name} ${employee.last_name}: ${updateError.message}`)
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
