const { Resend } = require('resend')
const r = new Resend('re_65JYYg8p_DTutVdNb5yPh3ZF8Q5QHSjq5')

r.emails.send({
  from: 'onboarding@resend.dev',
  to: 'avillamor@iboninternational.org',
  subject: 'Test from II Admin System',
  html: '<h1>Test Successful!</h1><p>This confirms Resend API is working. Next step: verify your iboninternational.org domain at https://resend.com/domains</p>'
}).then(result => {
  console.log('✅ Test email sent successfully!')
  console.log('Email ID:', result.data?.id)
  console.log('Check your inbox at: avillamor@iboninternational.org')
}).catch(e => {
  console.error('❌ Error:', e.message)
})
