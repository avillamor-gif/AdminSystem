import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { resend, FROM_ADDRESS } from '@/lib/resend'
import { welcomeEmail } from '@/lib/emailTemplates'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const body = await request.json()
    const { email, password, employeeId } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, first_name, last_name, employee_id, work_email')
      .eq('work_email', email)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: `Employee with email ${email} not found in database` },
        { status: 404 }
      )
    }

    // Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some((u) => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { message: `Auth account already exists for ${email}` },
        { status: 200 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        employee_id: employee.id,
        full_name: `${employee.first_name} ${employee.last_name}`,
        role: 'employee',
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        employee_id: employee.id,
        role: 'employee'
      })

    if (roleError) {
      console.error('Error creating user_roles:', roleError)
      // Don't fail the request, just log it
    }

    // Send welcome email (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      try {
        const { subject, html } = welcomeEmail({
          employeeName: `${employee.first_name} ${employee.last_name}`,
          email,
          temporaryPassword: password,
        })
        await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html })
      } catch (emailErr) {
        console.warn('[create-employee-auth] Welcome email failed:', emailErr)
      }
    }

    // Create Google Workspace account (fire-and-forget)
    // Only attempt if the email belongs to the Workspace domain
    const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN
    if (workspaceDomain && email.endsWith(`@${workspaceDomain}`)) {
      ;(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
          await fetch(`${baseUrl}/api/google/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'createUser',
              firstName: employee.first_name,
              lastName: employee.last_name,
              email,
              password,
              changePasswordAtNextLogin: true,
            }),
          })
        } catch (e) {
          console.warn('[create-employee-auth] Google Workspace account creation failed:', e)
        }
      })()
    }

    return NextResponse.json({
      message: `Employee auth account created successfully!`,
      details: {
        email: email,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_id: employee.employee_id,
        auth_user_id: authData.user.id
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create employee auth: ${error}` },
      { status: 500 }
    )
  }
}
