import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role, employee_id, password } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
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

    // Generate a default password if not provided
    const userPassword = password || `${email.split('@')[0]}123!`

    // Step 1: Try to create auth user, or find existing one
    let authUserId: string
    let isExistingUser = false
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        role,
        employee_id
      }
    })

    if (authError) {
      // If user already exists, try to find them
      if (authError.message.includes('already been registered')) {
        console.log('User already exists, finding existing user...')
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return NextResponse.json(
            { error: listError.message },
            { status: 500 }
          )
        }
        
        const existingUser = users.find(u => u.email === email)
        
        if (!existingUser) {
          return NextResponse.json(
            { error: 'User exists but could not be found' },
            { status: 500 }
          )
        }
        
        authUserId = existingUser.id
        isExistingUser = true
      } else {
        console.error('Auth creation error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 500 }
        )
      }
    } else if (authData.user) {
      authUserId = authData.user.id
    } else {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Step 2: Create user_roles entry (or update if exists)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', authUserId)
      .single()

    let roleData
    let roleError

    if (existingRole) {
      // Update existing role
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .update({
          role,
          employee_id: employee_id || null
        })
        .eq('user_id', authUserId)
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
      
      roleData = data
      roleError = error
    } else {
      // Create new role
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUserId,
          role,
          employee_id: employee_id || null
        })
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
      
      roleData = data
      roleError = error
    }

    if (roleError) {
      console.error('Role creation error:', roleError)
      return NextResponse.json(
        { error: roleError.message },
        { status: 500 }
      )
    }

    // Transform response
    const employee = (roleData as any)?.employee
    const name = employee 
      ? `${employee.first_name} ${employee.last_name}` 
      : email.split('@')[0]

    return NextResponse.json({
      success: true,
      data: {
        id: roleData?.user_id,
        email,
        name,
        role: roleData?.role,
        status: 'active',
        employee_id: employee?.employee_id || null,
        created_at: roleData?.created_at,
        updated_at: roleData?.updated_at,
        employee: employee ? {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          avatar_url: employee.avatar_url,
          department: null,
          job_title: null
        } : null
      },
      tempPassword: isExistingUser ? undefined : userPassword,
      message: isExistingUser ? 'User role synced successfully' : 'User created successfully'
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
