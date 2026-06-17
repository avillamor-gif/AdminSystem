/**
 * Fix member number sequence after migration
 * Run this after applying the add-member-number-column.sql migration
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fixMemberNumberSequence() {
  try {
    console.log('🔍 Checking member numbers...')

    // Get all members with their numbers
    const { data: members, error: queryError } = await supabase
      .from('members')
      .select('id, member_number, first_name, last_name')
      .order('member_number', { ascending: true })

    if (queryError) {
      console.error('❌ Error fetching members:', queryError)
      process.exit(1)
    }

    console.log(`📊 Found ${members.length} members`)

    // Find highest member number
    let maxNumber = 98 // Start from 98 so next is 99
    let membersWithNumbers = 0

    members.forEach((m) => {
      if (m.member_number) {
        membersWithNumbers++
        const match = m.member_number.match(/MEM-2026-(\d+)/)
        if (match) {
          const num = parseInt(match[1])
          maxNumber = Math.max(maxNumber, num)
        }
      }
    })

    console.log(`✅ Members with numbers: ${membersWithNumbers}`)
    console.log(`📌 Highest member number: MEM-2026-${String(maxNumber).padStart(5, '0')}`)
    console.log(`📌 Next member number will be: MEM-2026-${String(maxNumber + 1).padStart(5, '0')}`)

    // Now update the sequence position
    if (maxNumber > 98) {
      console.log(`\n⚠️  Sequence needs adjustment to start at ${maxNumber + 1}`)
      console.log('Run this SQL command in Supabase SQL Editor to fix it:')
      console.log(`\nSELECT setval('member_number_seq', ${maxNumber + 1}, false);\n`)
    } else {
      console.log('\n✅ Sequence is already at correct position')
    }

    // Show sample members
    if (members.length > 0) {
      console.log('\n📋 Sample members:')
      members.slice(0, 5).forEach((m) => {
        console.log(`  - ${m.member_number || 'NO NUMBER'}: ${m.first_name} ${m.last_name}`)
      })
      if (members.length > 5) {
        console.log(`  ... and ${members.length - 5} more`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixMemberNumberSequence()
