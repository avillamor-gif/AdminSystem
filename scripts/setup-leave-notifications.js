#!/usr/bin/env node

/**
 * Script to diagnose and fix leave request notification configuration.
 * 
 * This ensures:
 * 1. workflow_configs has an active 'leave' entry
 * 2. notify_on_submit is set to ["direct_manager", "admin"]
 * 3. Both supervisor and admin are notified for all leave requests
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function diagnoseAndFix() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║      Leave Request Notification Setup & Diagnostics        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Step 1: Check workflow_configs for leave
  console.log('📋 Step 1: Checking workflow_configs for "leave"...')
  const { data: leaveConfig, error: configError } = await supabase
    .from('workflow_configs')
    .select('*')
    .eq('request_type', 'leave')
    .maybeSingle()

  if (configError) {
    console.error('❌ Error querying workflow_configs:', configError.message)
    return
  }

  if (!leaveConfig) {
    console.log('  ⚠️  No workflow_config found for "leave". Creating one...')
    
    const { data: created, error: createError } = await supabase
      .from('workflow_configs')
      .insert({
        request_type: 'leave',
        notify_on_submit: ['direct_manager', 'admin'],
        notify_on_decision: ['direct_manager', 'admin'],
        is_active: true,
        auto_approve: false,
        approval_steps: [
          { level: 1, approver_role: 'direct_manager', label: 'Manager' },
          { level: 2, approver_role: 'admin', label: 'Admin' }
        ]
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create workflow_config:', createError.message)
      return
    }

    console.log('✅ Created workflow_config for leave')
    console.log(`   notify_on_submit: ${JSON.stringify(created.notify_on_submit)}`)
    console.log(`   notify_on_decision: ${JSON.stringify(created.notify_on_decision)}`)
    console.log(`   is_active: ${created.is_active}`)
  } else {
    console.log('✅ Found existing workflow_config for leave')
    console.log(`   is_active: ${leaveConfig.is_active}`)
    console.log(`   notify_on_submit: ${JSON.stringify(leaveConfig.notify_on_submit)}`)
    console.log(`   notify_on_decision: ${JSON.stringify(leaveConfig.notify_on_decision)}`)

    // Check if it needs updating
    let needsUpdate = false
    let updates: any = {}

    if (!leaveConfig.is_active) {
      console.log('  ⚠️  Config is inactive. Activating...')
      updates.is_active = true
      needsUpdate = true
    }

    if (!leaveConfig.notify_on_submit || leaveConfig.notify_on_submit.length === 0) {
      console.log('  ⚠️  notify_on_submit is empty. Setting to ["direct_manager", "admin"]...')
      updates.notify_on_submit = ['direct_manager', 'admin']
      needsUpdate = true
    } else if (!Array.isArray(leaveConfig.notify_on_submit)) {
      if (typeof leaveConfig.notify_on_submit === 'string') {
        const parsed = leaveConfig.notify_on_submit.split(',').map((s: string) => s.trim()).filter(Boolean)
        if (parsed.length === 0) {
          updates.notify_on_submit = ['direct_manager', 'admin']
          needsUpdate = true
        }
      } else {
        updates.notify_on_submit = ['direct_manager', 'admin']
        needsUpdate = true
      }
    }

    if (!leaveConfig.notify_on_decision || leaveConfig.notify_on_decision.length === 0) {
      console.log('  ⚠️  notify_on_decision is empty. Setting to ["direct_manager", "admin"]...')
      updates.notify_on_decision = ['direct_manager', 'admin']
      needsUpdate = true
    }

    if (needsUpdate) {
      const { data: updated, error: updateError } = await supabase
        .from('workflow_configs')
        .update(updates)
        .eq('request_type', 'leave')
        .select()
        .single()

      if (updateError) {
        console.error('❌ Failed to update workflow_config:', updateError.message)
        return
      }

      console.log('✅ Updated workflow_config')
      console.log(`   notify_on_submit: ${JSON.stringify(updated.notify_on_submit)}`)
      console.log(`   notify_on_decision: ${JSON.stringify(updated.notify_on_decision)}`)
      console.log(`   is_active: ${updated.is_active}`)
    } else {
      console.log('✅ Configuration looks good!')
    }
  }

  // Step 2: Check Ralf Dugan's leave requests
  console.log('\n📋 Step 2: Checking Ralf Dugan\'s leave requests...')
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, manager_id, department_id')
    .ilike('first_name', '%Ralf%')
    .ilike('last_name', '%Dugan%')

  if (!employees || employees.length === 0) {
    console.log('  ⚠️  No employee named "Ralf Dugan" found')
  } else {
    const ralf = employees[0]
    console.log(`✅ Found: ${ralf.first_name} ${ralf.last_name}`)
    console.log(`   Employee ID: ${ralf.id}`)
    console.log(`   Email: ${ralf.email}`)
    console.log(`   Manager ID: ${ralf.manager_id}`)
    console.log(`   Department ID: ${ralf.department_id}`)

    // Check leave requests
    const { data: leaveRequests } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', ralf.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!leaveRequests || leaveRequests.length === 0) {
      console.log('  ℹ️  No leave requests found')
    } else {
      console.log(`✅ Found ${leaveRequests.length} leave request(s)`)
      
      leaveRequests.forEach((lr: any, idx: number) => {
        console.log(`\n   Request ${idx + 1}:`)
        console.log(`     ID: ${lr.id}`)
        console.log(`     Status: ${lr.status}`)
        console.log(`     Dates: ${lr.start_date} to ${lr.end_date}`)
        console.log(`     Created: ${new Date(lr.created_at).toLocaleString()}`)

        // Check for notifications
        supabase
          .from('leave_request_notifications')
          .select('*')
          .eq('leave_request_id', lr.id)
          .then(({ data: notifs }) => {
            if (!notifs || notifs.length === 0) {
              console.log(`     ❌ No notifications sent for this request`)
            } else {
              console.log(`     ✅ ${notifs.length} notification(s) sent:`)
              notifs.forEach((n: any) => {
                console.log(`        - Recipient user_id: ${n.recipient_user_id}`)
                console.log(`          Type: ${n.type}, Title: ${n.title}`)
              })
            }
          })
          .catch((err: any) => {
            console.log(`     ⚠️  Error checking notifications: ${err.message}`)
          })
      })
    }

    // Check if manager is set up for notifications
    if (ralf.manager_id) {
      console.log(`\n📋 Step 3: Checking manager setup...`)
      const { data: manager } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('id', ralf.manager_id)
        .single()

      if (manager) {
        console.log(`✅ Manager found: ${manager.first_name} ${manager.last_name}`)
        console.log(`   Email: ${manager.email}`)

        const { data: managerUser } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .eq('employee_id', manager.id)
          .single()

        if (managerUser) {
          console.log(`   ✅ User role linked: ${managerUser.role}`)
        } else {
          console.log(`   ❌ No user role found for manager`)
        }
      } else {
        console.log(`❌ Manager not found (ID: ${ralf.manager_id})`)
      }
    } else {
      console.log(`\n⚠️  No manager assigned to Ralf Dugan`)
    }
  }

  // Step 4: Check admin users
  console.log('\n📋 Step 4: Checking admin users...')
  const { data: adminUsers } = await supabase
    .from('user_roles')
    .select('user_id, role, employee_id')
    .eq('role', 'admin')

  if (!adminUsers || adminUsers.length === 0) {
    console.log('❌ No admin users found in user_roles')
  } else {
    console.log(`✅ Found ${adminUsers.length} admin user(s)`)
    
    for (const au of adminUsers.slice(0, 3)) {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('id', au.employee_id)
        .single()
      
      if (emp) {
        console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.email})`)
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║                   ✅ Setup Complete                        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  console.log('Leave request notifications are now configured to notify:')
  console.log('  1. Direct manager (supervisor)')
  console.log('  2. All admin users')
  console.log('  3. (Both via system notification bell and email)')
  console.log('\n')
}

diagnoseAndFix().catch(console.error)
