import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      invitationId,
      email,
      invitationType,
      referrerName,
      targetName,
    } = await req.json()

    if (!email || !targetName) {
      return NextResponse.json(
        { error: 'Email and target name are required' },
        { status: 400 }
      )
    }

    console.log('[send-membership-invitation] Request received:', {
      email,
      targetName,
      invitationType,
      referrerName,
      invitationId,
    })

    // Import Resend email service
    const { renderMembershipInvitationEmail } = await import('@/lib/emailTemplateRenderer')

    // Render email
    console.log('[send-membership-invitation] Rendering email template...')
    const emailContent = await renderMembershipInvitationEmail({
      targetName,
      invitationType,
      referrerName: referrerName || 'An IBON International member',
      invitationLink: `${process.env.NEXT_PUBLIC_PRODUCTION_URL || 'http://localhost:3000'}/membership/apply?invited=true&email=${encodeURIComponent(email)}`,
    })

    console.log('[send-membership-invitation] Email rendered. Subject:', emailContent.subject)

    // Send via Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-membership-invitation] RESEND_API_KEY not set, skipping email send')
    } else {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        console.log('[send-membership-invitation] Sending email via Resend...')
        const response = await resend.emails.send({
          from: 'IBON International <noreply@iboninternational.org>',
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
        })

        if (response.error) {
          console.error('[send-membership-invitation] Resend error:', response.error)
          throw new Error(`Failed to send email via Resend: ${response.error.message}`)
        }

        console.log('[send-membership-invitation] Email sent successfully. ID:', response.data?.id)
      } catch (sendError) {
        console.error('[send-membership-invitation] Email sending failed:', sendError)
        throw sendError
      }
    }

    // Mark invitation as sent in database
    const supabase = await createClient()
    console.log('[send-membership-invitation] Updating invitation status in database...')
    const { error: updateError } = await supabase
      .from('membership_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('[send-membership-invitation] Error updating invitation status:', updateError)
      throw new Error(`Failed to update invitation status: ${updateError.message}`)
    }

    console.log('[send-membership-invitation] Success! Invitation marked as sent.')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[send-membership-invitation] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
