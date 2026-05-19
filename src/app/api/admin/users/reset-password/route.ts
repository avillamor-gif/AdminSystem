import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/users/reset-password
 * Body: { user_id?: string, email?: string, new_password?: string }
 *
 * Two modes:
 *  - new_password provided  → directly set password (admin force-reset)
 *  - no new_password        → send password reset email link to the user
 *
 * Restricted to users with role 'admin', 'super admin', or 'ed'.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Check caller has a role permitted to reset passwords
    const allowedRoles = ['admin', 'super admin', 'ed']
    const { data: roleRows } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    const hasAccess = (roleRows ?? []).some((r: any) => allowedRoles.includes(r.role))
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, email, new_password } = await request.json()
    if (!user_id && !email) {
      return NextResponse.json({ error: 'user_id or email is required' }, { status: 400 })
    }

    if (new_password) {
      // Force-set a new password directly
      if (!user_id) {
        return NextResponse.json({ error: 'user_id is required when setting a new password' }, { status: 400 })
      }
      const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password })
      if (error) throw error
      return NextResponse.json({ success: true, mode: 'password_set' })
    } else {
      // Send a password reset email
      const targetEmail = email || (() => {
        throw new Error('email is required to send a reset link')
      })()
      const { error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: targetEmail,
      })
      if (error) throw error
      return NextResponse.json({ success: true, mode: 'reset_email_sent' })
    }
  } catch (error: any) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 })
  }
}
