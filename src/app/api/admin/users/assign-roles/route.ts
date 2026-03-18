import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/users/assign-roles
 * Body: { user_id: string, role_names: string[] }
 * Syncs user_role_assignments to exactly the provided roles.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id, role_names } = await request.json()
    if (!user_id || !Array.isArray(role_names)) {
      return NextResponse.json({ error: 'user_id and role_names are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Resolve role names → role IDs
    const { data: roles, error: rolesError } = await admin
      .from('roles')
      .select('id, name')
      .in('name', role_names)

    if (rolesError) throw rolesError

    const roleIds = (roles || []).map((r: any) => r.id)

    // Delete all existing assignments for this user
    await admin
      .from('user_role_assignments' as any)
      .delete()
      .eq('user_id', user_id)

    // Insert new assignments
    if (roleIds.length > 0) {
      const inserts = roleIds.map((role_id: string) => ({ user_id, role_id }))
      const { error: insertError } = await admin
        .from('user_role_assignments' as any)
        .insert(inserts)
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, assigned: roleIds.length })
  } catch (error: any) {
    console.error('Error assigning user roles:', error)
    return NextResponse.json({ error: error.message || 'Failed to assign roles' }, { status: 500 })
  }
}

/**
 * GET /api/admin/users/assign-roles?user_id=...
 * Returns all role names assigned to a user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user_id = request.nextUrl.searchParams.get('user_id')
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: assignments, error } = await admin
      .from('user_role_assignments' as any)
      .select('role_id')
      .eq('user_id', user_id)

    if (error) throw error

    if (!assignments || (assignments as any[]).length === 0) {
      return NextResponse.json({ roles: [] })
    }

    const roleIds = (assignments as any[]).map((a: any) => a.role_id)
    const { data: roles, error: rolesError } = await admin
      .from('roles')
      .select('id, name')
      .in('id', roleIds)

    if (rolesError) throw rolesError

    return NextResponse.json({ roles: (roles || []).map((r: any) => r.name) })
  } catch (error: any) {
    console.error('Error fetching user role assignments:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch roles' }, { status: 500 })
  }
}
