import { NextRequest, NextResponse } from 'next/server'
import { FROM_ADDRESS, resend } from '@/lib/resend'

/**
 * POST /api/admin/send-equipment-form
 *
 * Admin-only endpoint to send equipment form link to partners via email
 * Sends a branded email with a button link to the public form
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check to ensure only admins can call this
    // For now, we'll implement basic validation

    const body = await request.json()

    const { recipientEmail, partnerName, partnerOrg, formLink } = body

    // Validate required fields
    if (!recipientEmail || !partnerName || !formLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Verify Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[send-equipment-form] RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const subject = `Equipment Checkout Form - ${partnerOrg || partnerName}`

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Equipment Checkout Form</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">IBON International</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 30px 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">
            Hello <strong>${escapeHtml(partnerName)}</strong>,
          </p>

          <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
            IBON International would like to share a secure equipment checkout form with you. Please use the button below to request the equipment you need.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formLink}" style="display: inline-block; padding: 14px 32px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.2s;">
              Fill Out Equipment Form
            </a>
          </div>

          <p style="margin: 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong>How it works:</strong>
          </p>
          <ul style="margin: 10px 0 20px 20px; padding: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
            <li>Select the equipment you need</li>
            <li>Choose your desired borrow dates</li>
            <li>Provide any additional details</li>
            <li>Submit the form</li>
            <li>Our team will review and contact you within 2 business days</li>
          </ul>

          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              <strong>No login required.</strong> This form is secure and designed for your convenience.
            </p>
          </div>

          <p style="margin: 20px 0 0 0; font-size: 14px; color: #4b5563;">
            If you have any questions or need assistance, please contact us at <a href="mailto:admin@iboninternational.org" style="color: #16a34a; text-decoration: none;">admin@iboninternational.org</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; text-align: center;">
          <p style="margin: 0;">
            IBON International • Equipment Management System
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `

    // Send the email using the verified FROM_ADDRESS
    const sendResult = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
    })

    if (sendResult.error) {
      console.error('[send-equipment-form] Resend error:', sendResult.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the action (audit trail)
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      await supabase.from('audit_logs').insert([
        {
          action: 'Equipment form link sent',
          details: `Sent to ${recipientEmail} for ${partnerOrg || partnerName}`,
          entity_type: 'equipment_checkout_link',
          entity_id: null,
        },
      ]).catch(() => null) // Best effort
    } catch (e) {
      console.warn('[send-equipment-form] Audit logging failed (non-critical):', e)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Form link sent to ${recipientEmail}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[send-equipment-form] Fatal error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
