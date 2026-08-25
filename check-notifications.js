// Check notification system status
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkNotifications() {
  console.log('🔍 Checking notification system status...\n')

  // Check recent requests (last 30 days)
  console.log('📋 Recent requests (last 30 days):')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const tables = [
    'travel_requests',
    'publication_requests',
    'asset_requests',
    'supply_requests',
    'leave_requests',
    'leave_credit_requests',
  ]

  let totalRequests = 0
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, created_at, status')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.log(`  ${table}: ⚠️  Error - ${error.message}`)
      } else {
        console.log(`  ${table}: ${data?.length || 0} requests`)
        if (data?.length > 0) {
          data.forEach((row) => {
            console.log(`    - ${row.id.slice(0, 8)}... (${row.status}) - ${new Date(row.created_at).toLocaleDateString()}`)
          })
        }
        totalRequests += data?.length || 0
      }
    } catch (err) {
      console.log(`  ${table}: ❌ ${err.message}`)
    }
  }

  console.log(`\n✓ Total requests in last 30 days: ${totalRequests}`)

  // Check recent notifications
  console.log('\n📬 Recent notifications (last 30 days):')
  const notifTables = [
    'travel_request_notifications',
    'publication_request_notifications',
    'equipment_request_notifications',
    'supply_request_notifications',
    'leave_request_notifications',
    'leave_credit_notifications',
  ]

  let totalNotifs = 0
  for (const table of notifTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.log(`  ${table}: ⚠️  Error - ${error.message}`)
      } else {
        console.log(`  ${table}: ${data?.length || 0} notifications`)
        if (data?.length > 0) {
          data.forEach((row) => {
            console.log(`    - ${new Date(row.created_at).toLocaleDateString()}`)
          })
        }
        totalNotifs += data?.length || 0
      }
    } catch (err) {
      console.log(`  ${table}: ❌ ${err.message}`)
    }
  }

  console.log(`\n✓ Total notifications in last 30 days: ${totalNotifs}`)

  // Check if requests match notifications
  console.log('\n🔗 Analysis:')
  if (totalRequests === 0) {
    console.log('  ⚠️  No new requests in the last 30 days')
    console.log('     → No requests means no notifications to send')
  } else if (totalNotifs === 0) {
    console.log('  ⚠️  Requests found but NO notifications created!')
    console.log('     → This indicates notifications are not being triggered')
  } else if (totalNotifs < totalRequests) {
    console.log(`  ⚠️  Requests (${totalRequests}) > Notifications (${totalNotifs})`)
    console.log('     → Some requests may not have triggered notifications')
  } else {
    console.log(`  ✅ Notifications created (${totalNotifs} notifs for ${totalRequests} requests)`)
  }

  // Check RESEND_API_KEY configuration
  console.log('\n📧 Email configuration:')
  if (!process.env.RESEND_API_KEY) {
    console.log('  ❌ RESEND_API_KEY is not set')
    console.log('     → Emails will not be sent')
  } else {
    console.log('  ✅ RESEND_API_KEY is configured')
  }
}

checkNotifications().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
