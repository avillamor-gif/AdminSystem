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

    // Import Resend email service
    const { renderMembershipInvitationEmail } = await import('@/lib/emailTemplateRenderer')

    // Render email
    const emailContent = await renderMembershipInvitationEmail({
      targetName,
      invitationType,
      referrerName,
      invitationLink: `${process.env.NEXT_PUBLIC_PRODUCTION_URL || 'http://localhost:3000'}/membership/apply?invited=true&email=${encodeURIComponent(email)}`,
    })

    // Send via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = (await import('resend')).default

      const response = await resend.emails.send({
        from: 'IBON International <noreply@iboninternational.org>',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      })

      if (!response.id) {
        throw new Error('Failed to send email via Resend')
      }
    }

    // Mark invitation as sent in database
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('membership_invitations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation status:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
