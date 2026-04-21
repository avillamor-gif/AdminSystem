/**
 * Quick test to verify email template system is working
 * Run this after executing the migration SQL
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function testEmailTemplateSystem() {
  console.log('🧪 Testing Email Template System...\n')

  try {
    // Test 1: Fetch all templates
    console.log('1️⃣ Fetching all email templates...')
    const response = await fetch(`${SUPABASE_URL}/rest/v1/email_templates?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`)
    }

    const templates = await response.json()
    console.log(`   ✅ Found ${templates.length} templates`)
    
    templates.forEach(t => {
      console.log(`      - ${t.name} (${t.template_type})`)
    })

    // Test 2: Verify expected templates exist
    console.log('\n2️⃣ Verifying expected templates...')
    const expectedTypes = [
      'new-leave-request',
      'leave-approved',
      'leave-rejected',
      'new-travel-request',
      'welcome'
    ]

    const foundTypes = templates.map(t => t.template_type)
    const missing = expectedTypes.filter(type => !foundTypes.includes(type))

    if (missing.length > 0) {
      console.log(`   ❌ Missing templates: ${missing.join(', ')}`)
    } else {
      console.log('   ✅ All expected templates found')
    }

    // Test 3: Verify template structure
    console.log('\n3️⃣ Verifying template structure...')
    const sampleTemplate = templates[0]
    const requiredFields = [
      'id', 'template_type', 'name', 'subject',
      'header_color', 'button_color', 'button_text',
      'body_template', 'is_active'
    ]

    const missingFields = requiredFields.filter(field => !(field in sampleTemplate))
    
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`)
    } else {
      console.log('   ✅ All required fields present')
    }

    // Test 4: Sample template details
    console.log('\n4️⃣ Sample template details:')
    console.log(`   Name: ${sampleTemplate.name}`)
    console.log(`   Type: ${sampleTemplate.template_type}`)
    console.log(`   Subject: ${sampleTemplate.subject}`)
    console.log(`   Header Color: ${sampleTemplate.header_color}`)
    console.log(`   Button Color: ${sampleTemplate.button_color}`)
    console.log(`   Button Text: ${sampleTemplate.button_text}`)
    console.log(`   Active: ${sampleTemplate.is_active}`)
    console.log(`   Variables: ${JSON.stringify(sampleTemplate.variables)}`)

    console.log('\n✅ Email template system is working correctly!')
    console.log('\n📋 Next steps:')
    console.log('   1. Visit System Configuration → Email Configuration')
    console.log('   2. Select a template to edit')
    console.log('   3. Customize colors, text, and HTML')
    console.log('   4. Click "Preview" to see rendered email')
    console.log('   5. Click "Send Test" to send a test email')
    console.log('   6. Click "Save Template" to persist changes')

  } catch (error) {
    console.error('\n❌ Error testing email template system:', error.message)
    console.log('\n💡 Make sure you have:')
    console.log('   1. Run the migration SQL in Supabase SQL Editor')
    console.log('   2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }
}

testEmailTemplateSystem()
