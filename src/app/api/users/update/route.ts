import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, password, role, status, employee_id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Step 1: Update auth user if password or email changed
    if (password || email) {
      const updateData: any = {}
      if (email) updateData.email = email
      if (password) updateData.password = password

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        updateData
      )

      if (authError) {
        console.error('Auth update error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 500 }
        )
      }
    }

    // Step 2: Update user_roles entry
    const updateRoleData: any = {
      updated_at: new Date().toISOString()
    }
    if (role) updateRoleData.role = role
    if (employee_id !== undefined) updateRoleData.employee_id = employee_id || null

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update(updateRoleData)
      .eq('user_id', id)
      .select(`
        id,
        user_id,
        role,
        created_at,
        updated_at,
        employee:employees(
          id,
          employee_id,
          first_name,
          last_name,
          email,
          status,
          avatar_url,
          department_id,
          job_title_id
        )
      `)
      .single()

    if (roleError) {
      console.error('Role update error:', roleError)
      return NextResponse.json(
        { error: roleError.message },
        { status: 500 }
      )
    }

    // Transform response
    const employee = (roleData as any).employee
    const name = employee 
      ? `${employee.first_name} ${employee.last_name}` 
      : email || 'Updated User'

    return NextResponse.json({
      success: true,
      data: {
        id: roleData.user_id,
        email: email || employee?.email || 'user@system.local',
        name,
        role: roleData.role,
        status: status || 'active',
        employee_id: employee?.employee_id || null,
        created_at: roleData.created_at,
        updated_at: roleData.updated_at,
        employee: employee ? {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          avatar_url: employee.avatar_url,
          department: null,
          job_title: null
        } : null
      }
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
