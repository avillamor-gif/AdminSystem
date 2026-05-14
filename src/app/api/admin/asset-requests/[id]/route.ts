import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/admin/asset-requests/:id
 * Allows admins to patch specific fields on an asset_request row.
 * Used by the manual borrow flow to correct fulfilled_date / borrow_start_date
 * when the borrow date is different from today.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('asset_requests')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error patching asset request:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}
