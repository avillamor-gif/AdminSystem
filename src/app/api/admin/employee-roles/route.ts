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

        // Upsert into user_roles table
        // This will insert or update based on employee_id
        const { data, error: upsertError } = await supabase
          .from('user_roles')
          .upsert(
            {
              employee_id: employeeId,
              role_id: roleId,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'employee_id' }
          )
          .select()
          .single()

        if (upsertError) {
          console.error(`Error updating role for employee ${employeeId}:`, upsertError)
          errors.push(`Failed to update employee ${employeeId}: ${upsertError.message}`)
          continue
        }

        results.push({
          employee_id: employeeId,
          role_id: roleId,
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
