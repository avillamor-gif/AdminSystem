import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Verify the requesting user is authenticated
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id, email, password } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (email) updateData.email = email
    if (password) updateData.password = password

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, updateData)
    if (error) {
      console.error('Auth update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Auth user updated' })
  } catch (err: any) {
    console.error('update-auth route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
