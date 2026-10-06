import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/employee-roles/status
 * 
 * Returns onboarding status for all employees:
 * - onboarded: true if user_roles entry exists
 * - onboarded: false if no user_roles entry
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all user_roles entries to see which employees are onboarded
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('employee_id, user_id')

    if (rolesError) {
      console.error('Error fetching user_roles:', rolesError)
      return NextResponse.json(
        { error: `Failed to fetch onboarding status: ${rolesError.message}` },
        { status: 500 }
      )
    }

    // Create a set of employee IDs that are onboarded
    const onboardedEmployeeIds = new Set(
      (userRoles || [])
        .filter((ur: any) => ur.employee_id)
        .map((ur: any) => ur.employee_id)
    )

    return NextResponse.json({
      success: true,
      onboardedEmployeeIds: Array.from(onboardedEmployeeIds),
      count: onboardedEmployeeIds.size
    })
  } catch (error) {
    console.error('Error in GET /api/admin/employee-roles/status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}
