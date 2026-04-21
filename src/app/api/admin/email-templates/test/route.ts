import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_ADDRESS } from '@/lib/resend'

/**
 * POST /api/admin/email-templates/test
 * Send a test email with a specific template
 */
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json()
    const { to, template } = requestBody

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template' },
        { status: 400 }
      )
    }

    // Replace template variables with sample data
    const sampleData: Record<string, string> = {
      requesterName: 'Juan dela Cruz',
      employeeName: 'Juan dela Cruz',
      leaveType: 'Vacation Leave',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: '5',
      requestNumber: 'TRV-2026-001',
      requestDetails: 'Business trip to Manila for 3 days',
      rejectionReason: 'Insufficient leave balance',
      email: to,
      temporaryPassword: 'Welcome2026!',
    }

    let subject = template.subject
    let bodyHtml = template.body_template

    Object.entries(sampleData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{${key}}`, 'g'), value)
      bodyHtml = bodyHtml.replace(new RegExp(`{${key}}`, 'g'), value)
    })

    // Build full HTML email
    const html = `
<!DOCTYPE html>
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
            <td style="background:${template.header_color};padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              <a href="https://adminsystem.iboninternational.org" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${template.button_color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${template.button_text}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from II Admin System. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `[TEST] ${subject}`,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: `Test email sent to ${to}`
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
