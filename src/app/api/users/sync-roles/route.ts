import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find user by email in auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      )
    }

    const authUser = users.find(u => u.email === email)
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      )
    }

    // Check if user_roles entry exists
    const { data: existingRole, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (existingRole) {
      return NextResponse.json({
        message: 'User role already exists',
        user: existingRole
      })
    }

    // Create user_roles entry
    // Also look up the matching role_id from the roles table so the user_permissions view works
    const roleString = role || 'employee'
    const roleNameMap: Record<string, string> = {
      admin: 'Admin',
      hr: 'HR Manager',
      manager: 'Manager',
      employee: 'Employee',
      super_admin: 'Super Admin',
    }
    const roleName = roleNameMap[roleString] ?? 'Employee'
    const { data: roleRecord } = await supabaseAdmin
      .from('roles')
      .select('id')
      .ilike('name', roleName)
      .single()

    const { data: newRole, error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.id,
        role: roleString,
        role_id: roleRecord?.id ?? null,
        employee_id: null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user role:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User role created successfully',
      user: newRole
    })
  } catch (error) {
    console.error('Error syncing user roles:', error)
    return NextResponse.json(
      { error: 'Failed to sync user roles' },
      { status: 500 }
    )
  }
}
