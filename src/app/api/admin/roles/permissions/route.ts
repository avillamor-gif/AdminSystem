/**
 * PUT /api/admin/roles/permissions
 * Body: { roleId: string, permissionIds: string[] }
 *
 * Replaces all permissions for the given role.
 * Uses service-role client to bypass RLS on role_permissions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { roleId, permissionIds } = await req.json()

    if (!roleId) return NextResponse.json({ error: 'roleId is required' }, { status: 400 })

    // Delete existing permissions for this role
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) throw deleteError

    // Insert new permissions
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const rows = permissionIds.map((permission_id: string) => ({ role_id: roleId, permission_id }))
      const { error: insertError } = await supabase.from('role_permissions').insert(rows)
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
