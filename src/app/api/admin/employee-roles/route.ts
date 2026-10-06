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

    for (const update of updates) {
      try {
        const { employeeId, roleId } = update

        if (!employeeId || !roleId) {
          errors.push(`Missing employeeId or roleId for update`)
          continue
        }

        // Step 1: Get employee and email
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

        // Step 2: Get user_id from auth.users by email
        let userId: string | null = null
        if (employee.email) {
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
          if (authError) {
            console.error('Error listing auth users:', authError)
          } else {
            const authUser = authUsers?.users?.find((u: any) => u.email === employee.email)
            userId = authUser?.id || null
          }
        }

        if (!userId) {
          console.error(`No auth user found for employee ${employeeId} (${employee.email})`)
          errors.push(`No auth user found for ${employee.first_name} ${employee.last_name}`)
          continue
        }

        // Step 3: Get role name from roles table
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id, name')
          .eq('id', roleId)
          .single()

        if (roleError || !role) {
          console.error(`Role not found: ${roleId}`, roleError)
          errors.push(`Role ${roleId} not found`)
          continue
        }

        // Convert role name to lowercase with underscores for the enum
        const roleName = role.name.toLowerCase().replace(/\s+/g, '_')

        // Step 4: Upsert into user_roles table
        // Using user_id as the unique key (UNIQUE constraint on user_id)
        const { data, error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            {
              user_id: userId,
              employee_id: employeeId,
              role_id: roleId,
              role: roleName,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single()

        if (upsertError) {
          console.error(`Error updating role for employee ${employeeId}:`, upsertError)
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
        console.error(`Error processing update for ${update.employeeId}:`, error)
        errors.push(`Error: ${errorMsg}`)
      }
    }

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
    console.error('Error updating employee roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update employee roles' },
      { status: 500 }
    )
  }
}
