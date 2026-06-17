import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { invitationId, email, invitationType, referrerName, targetName } = await req.json()

    // Validate inputs
    if (!email || !targetName || !invitationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Clean email
    const cleanEmail = String(email).toLowerCase().trim()

    // Send email via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subject =
      invitationType === 'referred'
        ? `You've been referred to join IBON International`
        : `You're invited to join IBON International`

    const invitationLink = `${process.env.NEXT_PUBLIC_PRODUCTION_URL || 'http://localhost:3000'}/membership/apply?invited=true&email=${encodeURIComponent(cleanEmail)}`

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>IBON Membership Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#1e40af;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">IBON International</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">Dear ${targetName},</p>
              
              ${
                invitationType === 'referred'
                  ? `<p style="margin:0 0 16px;font-size:14px;color:#4b5563;">
                      <strong>${referrerName || 'A member'}</strong> believes you would be a great addition to IBON International and has referred you to become a member.
                    </p>
                    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;">
                      We're a network of people and organizations working on poverty, inequality, and social movements in the Global South and beyond.
                    </p>`
                  : `<p style="margin:0 0 16px;font-size:14px;color:#4b5563;">
                      You've been invited to apply for membership at IBON International. We're a network of people and organizations working on poverty, inequality, and social movements in the Global South and beyond.
                    </p>`
              }

              <p style="margin:0 0 24px;font-size:14px;color:#4b5563;">
                Click the button below to start your membership application:
              </p>

              <a href="${invitationLink}" style="display:inline-block;padding:12px 24px;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Start Application</a>

              <p style="margin:24px 0 16px;font-size:14px;color:#4b5563;">
                If you have any questions, feel free to contact us.
              </p>

              <p style="margin:0;font-size:14px;color:#4b5563;">
                Best regards,<br/>
                The IBON International Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from IBON International. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const response = await resend.emails.send({
      from: 'IBON International <noreply@iboninternational.org>',
      to: cleanEmail,
      subject,
      html: emailHtml,
    })

    if (response.error) {
      console.error('Resend error:', response.error)
      return NextResponse.json({ error: response.error.message }, { status: 500 })
    }

    // Update invitation status in database
    const supabase = await createClient()
    await supabase.from('membership_invitations').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', invitationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
