const { Resend } = require('resend')
const resend = new Resend('re_65JYYg8p_DTutVdNb5yPh3ZF8Q5QHSjq5')
const BASE_URL = 'https://adminsystem.iboninternational.org'
const TO_EMAIL = 'avillamor@iboninternational.org'

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

function statusBadge(status) {
  const bg = status === 'approved' ? '#dcfce7' : '#fee2e2'
  const color = status === 'approved' ? '#16a34a' : '#dc2626'
  const label = status === 'approved' ? '✔ Approved' : '✘ Rejected'
  return `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${bg};color:${color};font-size:13px;font-weight:600;">${label}</span>`
}

async function sendAllSamples() {
  const samples = [
    // 1. New Leave Request
    {
      subject: 'Sample 1: New Leave Request from Juan dela Cruz',
      html: layout(`
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
    },
    
    // 2. Leave Approved
    {
      subject: 'Sample 2: Your Leave Request Has Been Approved',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Leave Request Approved</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>Juan dela Cruz</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;">
          Your leave request has been reviewed. ${statusBadge('approved')}
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
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Note</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">Approved. Enjoy your vacation!</td>
          </tr>
        </table>
        ${button('View My Leave →', `${BASE_URL}/leave/my-requests`)}
      `)
    },
    
    // 3. Leave Rejected
    {
      subject: 'Sample 3: Your Leave Request Has Been Rejected',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Leave Request Rejected</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>Juan dela Cruz</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;">
          Your leave request has been reviewed. ${statusBadge('rejected')}
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">Sick Leave</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">2026-04-25</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">To</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">2026-04-26</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">2 days</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Note</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">Insufficient leave balance. Please check your balance before requesting.</td>
          </tr>
        </table>
        ${button('View My Leave →', `${BASE_URL}/leave/my-requests`)}
      `)
    },
    
    // 4. New Travel Request
    {
      subject: 'Sample 4: New Travel Request #TRV-2026-001 from Maria Santos',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Travel Request</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">
          <strong>Maria Santos</strong> has submitted a new travel request (<strong>#TRV-2026-001</strong>).
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
          Business trip to Manila for client meeting. Duration: 3 days (May 10-12, 2026). Estimated budget: ₱15,000.
        </div>
        ${button('Review Request →', `${BASE_URL}/admin/travel`)}
      `)
    },
    
    // 5. Travel Request Approved
    {
      subject: 'Sample 5: Your Travel Request Has Been Approved (#TRV-2026-001)',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Travel Request Approved</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>Maria Santos</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;">
          Your travel request <strong>#TRV-2026-001</strong> has been approved. <span style="display:inline-block;padding:4px 12px;border-radius:99px;background:#dcfce7;color:#16a34a;font-size:13px;font-weight:600;">✔ Approved</span>
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
          Your business trip to Manila has been approved. Budget allocated: ₱15,000. Safe travels!
        </div>
        ${button('View Request →', `${BASE_URL}/travel/my-requests`)}
      `)
    },
    
    // 6. Equipment Request
    {
      subject: 'Sample 6: New Equipment Request #EQP-2026-042 from Pedro Reyes',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Equipment Request</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">
          <strong>Pedro Reyes</strong> has submitted a new equipment request (<strong>#EQP-2026-042</strong>).
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
          Requesting: Dell Laptop (16GB RAM, 512GB SSD). Purpose: Software development work requires better performance.
        </div>
        ${button('Review Request →', `${BASE_URL}/admin/asset-management/equipment-requests`)}
      `)
    },
    
    // 7. Supply Request Fulfilled
    {
      subject: 'Sample 7: Your Supply Request Has Been Fulfilled (#SUP-2026-088)',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Supply Request Fulfilled</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>Ana Garcia</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;">
          Your supply request <strong>#SUP-2026-088</strong> has been fulfilled. <span style="display:inline-block;padding:4px 12px;border-radius:99px;background:#dbeafe;color:#2563eb;font-size:13px;font-weight:600;">📦 Fulfilled</span>
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
          Your office supplies (ballpens, notebooks, folders) are ready for pickup at the Admin Office.
        </div>
        ${button('View Request →', `${BASE_URL}/office-supplies/my-requests`)}
      `)
    },
    
    // 8. Welcome Email
    {
      subject: 'Sample 8: Welcome to II Admin System, Carlos Mendoza!',
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome aboard, Carlos Mendoza! 👋</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">
          Your account has been created on the <strong>II Admin System</strong>.
          You can now log in to manage your leave, view payslips, and more.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Login Email</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;">carlos.mendoza@iboninternational.org</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Temporary Password</td>
            <td style="padding:10px 16px;font-size:14px;color:#111827;font-family:monospace;">Welcome2026!</td>
          </tr>
        </table>
        <p style="margin:8px 0 20px;font-size:13px;color:#6b7280;">Please change your password after your first login.</p>
        ${button('Log In Now →', BASE_URL)}
      `)
    }
  ]

  console.log(`📧 Sending ${samples.length} sample emails to ${TO_EMAIL}...\n`)

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    try {
      const result = await resend.emails.send({
        from: 'II Admin System <noreply@adminsystem.iboninternational.org>',
        to: TO_EMAIL,
        subject: sample.subject,
        html: sample.html,
      })
      
      if (result.error) {
        console.log(`❌ ${i + 1}. ${sample.subject.replace(/Sample \d+: /, '')}`)
        console.log(`   Error: ${result.error.message}\n`)
      } else {
        console.log(`✅ ${i + 1}. ${sample.subject.replace(/Sample \d+: /, '')}`)
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.log(`❌ ${i + 1}. ${sample.subject.replace(/Sample \d+: /, '')}`)
      console.log(`   Error: ${error.message}\n`)
    }
  }

  console.log(`\n🎉 Done! Check your inbox at: ${TO_EMAIL}`)
  console.log('\n📬 You should receive 8 sample emails:')
  console.log('   1. New Leave Request')
  console.log('   2. Leave Request Approved')
  console.log('   3. Leave Request Rejected')
  console.log('   4. New Travel Request')
  console.log('   5. Travel Request Approved')
  console.log('   6. New Equipment Request')
  console.log('   7. Supply Request Fulfilled')
  console.log('   8. Welcome Email')
}

sendAllSamples()
