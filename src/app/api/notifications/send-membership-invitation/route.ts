import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_ADDRESS } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invitationId, email, invitationType, referrerName, targetName, isResend } = body

    if (!invitationId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId, email' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Get the invitation record to fetch invitation_code
    const { data: invitation, error: invitationError } = await admin
      .from('membership_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Build the invitation URL with the code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/membership/apply?code=${invitation.invitation_code}`

    // Build email content
    const subject = isResend 
      ? `We'd still love to see you join IBON International` 
      : `Join IBON International`

    let referrerText = ''
    if (invitationType === 'referred' && referrerName) {
      referrerText = `<p style="margin-bottom: 16px; line-height: 1.6;">
        <strong>${referrerName}</strong> has referred you to join <strong>IBON International</strong>. 
        We'd love to have you as a member!
      </p>`
    } else {
      referrerText = `<p style="margin-bottom: 16px; line-height: 1.6;">
        You've been invited to join <strong>IBON International</strong>. 
        We'd love to have you as a member!
      </p>`
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .content {
              background: #f9fafb;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #f97316;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
              transition: background 0.3s;
            }
            .button:hover {
              background: #ea580c;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .highlight {
              background: white;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              <p style="margin-bottom: 16px; line-height: 1.6;">
                Dear ${targetName || 'Friend'},
              </p>

              ${referrerText}

              <div class="highlight">
                <p style="margin: 0 0 16px 0; font-weight: bold;">
                  What is IBON International?
                </p>
                <p style="margin: 0;">
                  IBON International is a network of research and advocacy organizations dedicated to building a just and democratic global order. 
                  We work on issues of development, human rights, and social justice across the globe.
                </p>
              </div>

              <p style="margin-bottom: 16px; line-height: 1.6;">
                <strong>Ready to join us?</strong> Click the button below to start your membership application:
              </p>

              <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">
                  Apply for Membership
                </a>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #666; line-height: 1.6;">
                This invitation is unique to you and will expire in 7 days. 
                <br />
                If the button doesn't work, you can also paste this link in your browser:
                <br />
                <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; word-break: break-all;">
                  ${invitationUrl}
                </code>
              </p>

              <p style="margin-top: 30px; margin-bottom: 10px; line-height: 1.6;">
                Questions? We're here to help! Reply to this email or visit our website.
              </p>

              <p style="margin: 0; line-height: 1.6;">
                Best regards,
                <br />
                <strong>The IBON International Team</strong>
              </p>

              <div class="footer">
                <p>© IBON International. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping email send')
      return NextResponse.json({ success: true, message: 'Invitation created but email not sent (no RESEND_API_KEY)' })
    }

    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject,
        html,
      })
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr)
      // Don't fail the entire request if email fails
      return NextResponse.json(
        { success: true, message: 'Invitation created but email delivery failed' },
        { status: 202 }
      )
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' })
  } catch (err: any) {
    console.error('[send-membership-invitation] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
