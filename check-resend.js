// Check Resend API status and configuration
const { Resend } = require('resend')

const resend = new Resend('re_65JYYg8p_DTutVdNb5yPh3ZF8Q5QHSjq5')

async function checkResend() {
  console.log('🔍 Checking Resend configuration...\n')
  
  try {
    // Try to send a simple test email
    console.log('Sending test email to: avillamor@iboninternational.org')
    console.log('From: II Admin System <noreply@iboninternational.org>\n')
    
    const result = await resend.emails.send({
      from: 'II Admin System <noreply@iboninternational.org>',
      to: 'avillamor@iboninternational.org',
      subject: 'Test Email - ' + new Date().toISOString(),
      html: '<h1>Test Email</h1><p>If you receive this, email is working!</p>',
    })
    
    console.log('✅ Email sent successfully!')
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (result.data?.id) {
      console.log('\n📧 Email ID:', result.data.id)
      console.log('Check delivery status at: https://resend.com/emails/' + result.data.id)
    }
    
  } catch (error) {
    console.error('❌ Error sending email:')
    console.error('Status:', error.statusCode)
    console.error('Message:', error.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
    
    if (error.message?.includes('not verified') || error.message?.includes('domain')) {
      console.error('\n⚠️  DOMAIN NOT VERIFIED!')
      console.error('Action required:')
      console.error('1. Go to https://resend.com/domains')
      console.error('2. Add and verify: iboninternational.org')
      console.error('3. Or use a verified test domain like: onboarding@resend.dev')
    }
  }
}

checkResend()
