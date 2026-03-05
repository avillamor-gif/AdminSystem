import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First, delete from user_roles table
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (userRoleError) {
      console.error('Error deleting user role:', userRoleError)
      // Continue anyway - might not exist
    }

    // Then, delete from auth.users using admin client
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to delete user from auth' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete user route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
