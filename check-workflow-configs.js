// Check if workflow_configs are set up
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkWorkflowConfigs() {
  console.log('🔍 Checking workflow_configs setup...\n')

  try {
    const { data, error } = await supabase
      .from('workflow_configs')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('❌ Error querying workflow_configs:', error.message)
      return
    }

    console.log(`Found ${data?.length || 0} active workflow configs:\n`)

    if (data && data.length > 0) {
      data.forEach(config => {
        console.log(`✅ ${config.request_type}`)
        console.log(`   Notify on submit: ${JSON.stringify(config.notify_on_submit)}`)
        console.log(`   Auto-approve: ${config.auto_approve}`)
        console.log()
      })
    } else {
      console.log('❌ NO ACTIVE WORKFLOW CONFIGS FOUND!')
      console.log()
      console.log('This explains why you\'re not receiving notifications!')
      console.log('The notification system requires workflow_configs to be set up.')
      console.log()
      console.log('To fix this, set up workflow configs in Admin → System Configuration → Workflow Configuration')
      console.log()
      console.log('Required request types to configure:')
      console.log('  - leave')
      console.log('  - travel')
      console.log('  - leave_credit')
      console.log('  - equipment')
      console.log('  - supply')
      console.log('  - publication')
      console.log('  - internship')
      console.log()
      console.log('For each type, set "Notify on submit" to at least: ["direct_manager", "admin"]')
    }
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
  }
}

checkWorkflowConfigs()
