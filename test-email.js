// Test email notification script - showcases all email templates
const { Resend } = require('resend')

const resend = new Resend('re_65JYYg8p_DTutVdNb5yPh3ZF8Q5QHSjq5')
const BASE_URL = 'https://adminsystem.iboninternational.org'

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>II Admin System</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#f97316;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from II Admin System.
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(label, href) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`
}

async function sendTestEmail() {
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Leave Request</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      <strong>Juan dela Cruz</strong> has submitted a leave request and is awaiting your approval.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">Vacation Leave</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">2026-05-01</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">To</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">2026-05-05</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">5 days</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Reason</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">Family vacation to Boracay</td>
      </tr>
    </table>
    ${button('Review Request →', `${BASE_URL}/admin/leave-management`)}
  `)
  
  try {
    const result = await resend.emails.send({
      from: 'II Admin System <noreply@iboninternational.org>',
      to: 'avillamor@iboninternational.org',
      subject: 'New Leave Request from Juan dela Cruz',
      html,
    })
    
    console.log('✅ Sample leave request email sent!')
    console.log('Email ID:', result.data?.id)
    console.log('Recipient:', 'avillamor@iboninternational.org')
    console.log('\n📧 This email showcases:')
    console.log('  • Professional II Admin System branding')
    console.log('  • Clean, structured leave request details')
    console.log('  • Orange action button that redirects to /admin/leave-management')
    console.log('  • Mobile-responsive design')
  } catch (error) {
    console.error('❌ Failed to send email:', error.message)
    if (error.message.includes('domain')) {
      console.error('\n⚠️  Domain verification required:')
      console.error('   Go to https://resend.com/domains and verify iboninternational.org')
    }
  }
}

sendTestEmail()
