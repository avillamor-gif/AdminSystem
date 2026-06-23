import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/resend
 *
 * Receives Resend email event webhooks and records open/click data.
 *
 * Setup in Resend dashboard:
 *   1. Go to Resend → Webhooks → Add endpoint
 *   2. URL: https://your-domain.com/api/webhooks/resend
 *   3. Events to subscribe: email.opened, email.clicked, email.bounced
 *   4. Copy the signing secret → set RESEND_WEBHOOK_SECRET env var
 *
 * Resend will send events like:
 *   { type: "email.opened", data: { email_id: "re_xxx", to: ["user@x.com"], ... } }
 *   { type: "email.clicked", data: { email_id: "re_xxx", click: { link: "https://..." }, ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (!type || !data?.email_id) {
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()
    const emailId: string = data.email_id
    const now = new Date().toISOString()

    if (type === 'email.opened') {
      // Find the recipient row by resend_email_id
      const { data: recipient } = await admin
        .from('member_campaign_recipients')
        .select('id, campaign_id, opened_at')
        .eq('resend_email_id', emailId)
        .single()

      if (recipient && !recipient.opened_at) {
        // Mark recipient as opened (first open only)
        await admin
          .from('member_campaign_recipients')
          .update({ opened_at: now })
          .eq('id', recipient.id)

        // Increment campaign open_count
        await admin.rpc('increment_campaign_open_count', { campaign_id: recipient.campaign_id })
      }
    }

    if (type === 'email.clicked') {
      const clickedUrl: string = data.click?.link ?? ''

      const { data: recipient } = await admin
        .from('member_campaign_recipients')
        .select('id, campaign_id, clicked_at')
        .eq('resend_email_id', emailId)
        .single()

      if (recipient) {
        const updatePayload: Record<string, any> = { clicked_at: now, clicked_url: clickedUrl }
        await admin
          .from('member_campaign_recipients')
          .update(updatePayload)
          .eq('id', recipient.id)

        // Only increment click_count on first click per recipient
        if (!recipient.clicked_at) {
          await admin.rpc('increment_campaign_click_count', { campaign_id: recipient.campaign_id })
        }
      }
    }

    if (type === 'email.bounced') {
      await admin
        .from('member_campaign_recipients')
        .update({ status: 'bounced' })
        .eq('resend_email_id', emailId)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook/resend]', err)
    // Always return 200 so Resend doesn't retry unnecessarily
    return NextResponse.json({ received: true })
  }
}
