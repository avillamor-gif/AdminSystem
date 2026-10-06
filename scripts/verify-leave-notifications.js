#!/usr/bin/env node

/**
 * Verify Leave Request Notification Setup
 * 
 * This script checks:
 * 1. workflow_configs is properly configured for leave requests
 * 2. Admins and managers exist in the system
 * 3. Previous leave requests show notifications were sent
 * 4. Email addresses are properly configured
 */

const fs = require('fs')
const path = require('path')

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function verify() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║   Verify Leave Request Notification Configuration             ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  let hasErrors = false
  const results = {
    workflowConfig: { status: '⚠️', message: 'Not checked' },
    adminCount: { status: '⚠️', message: 'Not checked' },
    managerCount: { status: '⚠️', message: 'Not checked' },
    leaveRequests: { status: '⚠️', message: 'Not checked' },
    emailConfig: { status: '⚠️', message: 'Not checked' },
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Check Workflow Config
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📋 Checking workflow_configs for "leave"...')
  const { data: wfConfig, error: wfError } = await supabase
    .from('workflow_configs')
    .select('*')
    .eq('request_type', 'leave')
    .maybeSingle()

  if (wfError) {
    console.error('   ❌ Error:', wfError.message)
    results.workflowConfig = { status: '❌', message: wfError.message }
    hasErrors = true
  } else if (!wfConfig) {
    console.log('   ❌ No workflow config found for "leave"')
    results.workflowConfig = { status: '❌', message: 'Not found in workflow_configs' }
    hasErrors = true
  } else {
    console.log(`   ✅ Found workflow config for "leave"`)
    console.log(`      Display name: ${wfConfig.display_name}`)
    console.log(`      Is active: ${wfConfig.is_active}`)
    console.log(`      Notify on submit: ${JSON.stringify(wfConfig.notify_on_submit)}`)
    console.log(`      Notify on decision: ${JSON.stringify(wfConfig.notify_on_decision)}`)

    // Verify it includes both direct_manager and admin
    const submitNotifs = wfConfig.notify_on_submit || []
    const hasManager = submitNotifs.includes('direct_manager')
    const hasAdmin = submitNotifs.includes('admin')

    if (!wfConfig.is_active) {
      console.log('   ❌ Workflow config is INACTIVE')
      results.workflowConfig = { status: '❌', message: 'Config is inactive' }
      hasErrors = true
    } else if (!hasManager || !hasAdmin) {
      console.log(`   ⚠️  Notify on submit should include ["direct_manager", "admin"]`)
      console.log(`      Currently has: ${JSON.stringify(submitNotifs)}`)
      if (!hasManager) console.log('      Missing: direct_manager')
      if (!hasAdmin) console.log('      Missing: admin')
      results.workflowConfig = { status: '⚠️', message: 'Missing notification recipients' }
    } else {
      console.log(`   ✅ Correctly configured to notify both manager and admin`)
      results.workflowConfig = { status: '✅', message: 'Properly configured' }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Check for Admin Users
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Checking admin users...')
  const { data: adminUsers, error: adminError } = await supabase
    .from('user_roles')
    .select('user_id, employee_id')
    .eq('role', 'admin')

  if (adminError) {
    console.error('   ❌ Error:', adminError.message)
    results.adminCount = { status: '❌', message: adminError.message }
    hasErrors = true
  } else if (!adminUsers || adminUsers.length === 0) {
    console.log('   ❌ No admin users found in user_roles')
    results.adminCount = { status: '❌', message: 'No admin users found' }
    hasErrors = true
  } else {
    console.log(`   ✅ Found ${adminUsers.length} admin user(s)`)
    
    // Check if admins have email addresses
    const empIds = adminUsers.map((u: any) => u.employee_id).filter(Boolean)
    if (empIds.length > 0) {
      const { data: admins } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .in('id', empIds)
        .limit(3)

      if (admins) {
        admins.forEach((admin: any) => {
          console.log(`      - ${admin.first_name} ${admin.last_name}`)
          console.log(`        Email: ${admin.email || '❌ NO EMAIL'}`)
        })
      }
    }
    results.adminCount = { status: '✅', message: `${adminUsers.length} admin users` }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Check for Managers
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Checking managers...')
  const { data: managers, error: managerError } = await supabase
    .from('user_roles')
    .select('user_id, employee_id')
    .eq('role', 'manager')

  if (managerError) {
    console.error('   ❌ Error:', managerError.message)
    results.managerCount = { status: '❌', message: managerError.message }
    hasErrors = true
  } else if (!managers || managers.length === 0) {
    console.log('   ⚠️  No dedicated manager role users found')
    console.log('      (Supervisors are usually marked as direct_manager via employees.manager_id)')
    results.managerCount = { status: '⚠️', message: 'No dedicated manager users' }
  } else {
    console.log(`   ✅ Found ${managers.length} manager user(s)`)
    results.managerCount = { status: '✅', message: `${managers.length} manager users` }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Check Recent Leave Requests
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Checking recent leave requests and their notifications...')
  const { data: recentRequests, error: requestError } = await supabase
    .from('leave_requests')
    .select('id, employee_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (requestError) {
    console.error('   ❌ Error:', requestError.message)
    results.leaveRequests = { status: '❌', message: requestError.message }
    hasErrors = true
  } else if (!recentRequests || recentRequests.length === 0) {
    console.log('   ℹ️  No leave requests found in system')
    results.leaveRequests = { status: 'ℹ️', message: 'No requests to check' }
  } else {
    console.log(`   Found ${recentRequests.length} recent leave request(s):`)
    
    for (const req of recentRequests) {
      const { data: notifs } = await supabase
        .from('leave_request_notifications')
        .select('recipient_user_id, type, title')
        .eq('leave_request_id', req.id)

      const reqDate = new Date(req.created_at).toLocaleString()
      console.log(`\n      Request: ${req.id.slice(0, 8)}...`)
      console.log(`      Status: ${req.status}`)
      console.log(`      Created: ${reqDate}`)
      
      if (!notifs || notifs.length === 0) {
        console.log(`      ❌ NO NOTIFICATIONS SENT`)
        hasErrors = true
      } else {
        console.log(`      ✅ ${notifs.length} notification(s) sent to:`)
        notifs.forEach((n: any) => {
          console.log(`         - ${n.recipient_user_id.slice(0, 8)}... (${n.type})`)
        })
      }
    }
    results.leaveRequests = { status: '✅', message: 'Checked' }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Check Email Configuration
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📋 Checking email configuration...')
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log('   ❌ RESEND_API_KEY not configured in .env.local')
    results.emailConfig = { status: '❌', message: 'RESEND_API_KEY not set' }
    hasErrors = true
  } else {
    console.log('   ✅ RESEND_API_KEY is configured')
    console.log(`      Key: ${resendKey.slice(0, 10)}...`)
    results.emailConfig = { status: '✅', message: 'Email service configured' }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                        SUMMARY                               ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  console.log('Workflow Configuration:    ' + results.workflowConfig.status + ' ' + results.workflowConfig.message)
  console.log('Admin Users:               ' + results.adminCount.status + ' ' + results.adminCount.message)
  console.log('Manager Users:             ' + results.managerCount.status + ' ' + results.managerCount.message)
  console.log('Leave Requests:            ' + results.leaveRequests.status + ' ' + results.leaveRequests.message)
  console.log('Email Service:             ' + results.emailConfig.status + ' ' + results.emailConfig.message)

  if (hasErrors) {
    console.log('\n⚠️  Issues detected! See details above.\n')
    process.exit(1)
  } else {
    console.log('\n✅ All checks passed!\n')
    console.log('Leave request notifications are properly configured.')
    console.log('New leave requests will notify:')
    console.log('  • The direct manager (supervisor)')
    console.log('  • All admin-role users')
    console.log('  • Via system notification bell AND email\n')
  }
}

verify().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
