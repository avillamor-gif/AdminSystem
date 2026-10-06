import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch all user_roles with employee_id and role_id
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('id, employee_id, role_id')

    if (error) {
      console.error('Error fetching user roles:', error)
      throw error
    }

    // Build assignments map: employee_id -> role_id
    const assignments: Record<string, string> = {}
    userRoles?.forEach((ur: any) => {
      if (ur.employee_id && ur.role_id) {
        assignments[ur.employee_id] = ur.role_id
      }
    })

    console.log('Loaded assignments:', assignments)

    return NextResponse.json({
      success: true,
      assignments
    })
  } catch (error) {
    console.error('Error in GET /api/admin/employee-roles/get:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch employee roles' },
      { status: 500 }
    )
  }
}
