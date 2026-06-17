const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkMembers() {
  // Get count
  const { count, error: countErr } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total members in database: ${count}`)

  // Get samples with country and organization
  const { data, error } = await supabase
    .from('members')
    .select('member_number, first_name, last_name, country, organization, email')
    .order('member_number')
    .limit(15)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log('\n📋 Sample members (first 15):')
  data.forEach((m, i) => {
    const org = m.organization ? `${m.organization.substring(0, 35)}` : 'N/A'
    console.log(`  ${String(i+1).padStart(2)}. ${m.member_number} | ${m.first_name} ${m.last_name} | ${m.country} | ${org}`)
  })

  // Check for any missing countries or organizations
  const { data: missing } = await supabase
    .from('members')
    .select('member_number, first_name, last_name, country, organization')
    .or('country.is.null,organization.is.null')

  if (missing && missing.length > 0) {
    console.log(`\n⚠️  ${missing.length} members with missing Country or Organization:`)
    missing.forEach(m => {
      console.log(`  - ${m.member_number}: ${m.first_name} ${m.last_name} (Country: ${m.country || 'MISSING'}, Org: ${m.organization || 'MISSING'})`)
    })
  } else {
    console.log('\n✅ All members have Country and Organization data!')
  }
}

checkMembers()
