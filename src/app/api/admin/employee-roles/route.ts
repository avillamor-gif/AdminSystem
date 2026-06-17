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

    // 1. Get role mappings (roles table)
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')

    if (rolesError) throw rolesError

    // Build role ID to name map
    const roleIdToName: Record<string, string> = {}
    roles?.forEach((role: any) => {
      roleIdToName[role.id] = role.name
    })

    // 2. Get all employees involved
    const employeeIds = updates.map(u => u.employeeId)
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name')
      .in('id', employeeIds)

    if (employeesError) throw employeesError

    const employeeIdMap: Record<string, any> = {}
    employees?.forEach((emp: any) => {
      employeeIdMap[emp.id] = emp
    })

    // 3. Get user_id from employees via email/name lookup
    // This requires cross-referencing with auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) throw authError

    const authUserMap: Record<string, string> = {}
    authUsers?.users?.forEach((user: any) => {
      // Try to match by email or custom metadata
      authUserMap[user.email || ''] = user.id
    })

    // 4. Update user_roles for each employee
    const results = []
    const errors = []

    for (const update of updates) {
      try {
        const employee = employeeIdMap[update.employeeId]
        if (!employee) {
          errors.push(`Employee ${update.employeeId} not found`)
          continue
        }

        // If no roleId provided, delete the user_role entry
        if (!update.roleId) {
          const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('employee_id', update.employeeId)

          if (deleteError) {
            errors.push(`Failed to clear role for ${employee.first_name} ${employee.last_name}: ${deleteError.message}`)
          } else {
            results.push({
              employee_id: update.employeeId,
              role_id: null,
              status: 'cleared'
            })
          }
          continue
        }

        const roleName = roleIdToName[update.roleId]
        if (!roleName) {
          errors.push(`Role ${update.roleId} not found`)
          continue
        }

        // Update or insert user_role
        const { error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            {
              employee_id: update.employeeId,
              role: roleName.toLowerCase().replace(/\s+/g, '_'),
              updated_at: new Date().toISOString()
            },
            { onConflict: 'employee_id' }
          )

        if (upsertError) {
          errors.push(`Failed to update ${employee.first_name} ${employee.last_name}: ${upsertError.message}`)
        } else {
          results.push({
            employee_id: update.employeeId,
            role_id: update.roleId,
            role_name: roleName,
            status: 'updated'
          })
        }
      } catch (error) {
        errors.push(`Error processing ${update.employeeId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
