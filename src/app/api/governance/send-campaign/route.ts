import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_ADDRESS } from '@/lib/resend'

const ALLOWED_ROLES = ['admin', 'hr', 'ed', 'manager', 'super admin']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roleRows ?? []).some((r: any) => ALLOWED_ROLES.includes(r.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { campaign_id, title, subject, preview_text, body_html, recipient_filter } = body

  if (!subject || !body_html) {
    return NextResponse.json({ error: 'subject and body_html are required' }, { status: 400 })
  }

  // ── Upsert campaign record ─────────────────────────────────────────────────
  let campaignId: string = campaign_id

  if (campaignId) {
    await admin
      .from('member_campaigns')
      .update({
        title, subject, preview_text, body_html, recipient_filter,
        status: 'sending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
  } else {
    const { data: newCampaign, error: createErr } = await admin
      .from('member_campaigns')
      .insert({
        title: title || 'Untitled Campaign',
        subject,
        preview_text: preview_text || null,
        body_html,
        recipient_filter: recipient_filter || { all: true },
        status: 'sending',
        created_by: user.id,
      })
      .select('*')
      .single()
    if (createErr || !newCampaign) {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to create campaign' }, { status: 500 })
    }
    campaignId = newCampaign.id
  }

  // ── Fetch eligible members ─────────────────────────────────────────────────
  const filter = recipient_filter || { all: true }
  let membersQuery = admin
    .from('members')
    .select('id, first_name, last_name, email, member_number, membership_type, status, opt_out_email')
    .eq('opt_out_email', false)

  if (!filter.all) {
    if (filter.membership_types?.length) {
      membersQuery = membersQuery.in('membership_type', filter.membership_types)
    }
    if (filter.statuses?.length) {
      membersQuery = membersQuery.in('status', filter.statuses)
    }
  }

  const { data: members, error: membersErr } = await membersQuery
  if (membersErr) {
    return NextResponse.json({ error: membersErr.message }, { status: 500 })
  }

  const eligible = (members ?? []).filter((m: any) => m.email)

  if (eligible.length === 0) {
    await admin
      .from('member_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: 0, sent_count: 0, failed_count: 0, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
    return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 })
  }

  // ── Insert recipient records ───────────────────────────────────────────────
  const recipientRows = eligible.map((m: any) => ({
    campaign_id: campaignId,
    member_id: m.id,
    email: m.email,
    status: 'pending',
  }))
  await admin
    .from('member_campaign_recipients')
    .upsert(recipientRows, { onConflict: 'campaign_id,member_id' })

  // ── Unsubscribe footer ─────────────────────────────────────────────────────
  const footer = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-family: Arial, sans-serif;">
  <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px;">You are receiving this email as a member of IBON International.</p>
  <p style="color: #9ca3af; font-size: 12px; margin: 0;">To unsubscribe, reply to this email with the subject "Unsubscribe".</p>
</div>`

  // ── Send in batches of 50 (Resend limit) ──────────────────────────────────
  let sentCount  = 0
  let failedCount = 0
  const BATCH = 50

  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH)

    await Promise.all(
      batch.map(async (member: any) => {
        const personalHtml = (body_html + footer)
          .replace(/\{\{first_name\}\}/g, member.first_name)
          .replace(/\{\{name\}\}/g, `${member.first_name} ${member.last_name}`)
          .replace(/\{\{member_number\}\}/g, member.member_number ?? '')

        try {
          const { error: sendErr } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: member.email,
            subject,
            html: personalHtml,
          })

          if (sendErr) {
            await admin
              .from('member_campaign_recipients')
              .update({ status: 'failed', error_message: sendErr.message, sent_at: new Date().toISOString() })
              .eq('campaign_id', campaignId)
              .eq('member_id', member.id)
            failedCount++
          } else {
            await admin
              .from('member_campaign_recipients')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('campaign_id', campaignId)
              .eq('member_id', member.id)
            sentCount++
          }
        } catch (err: any) {
          await admin
            .from('member_campaign_recipients')
            .update({ status: 'failed', error_message: err.message, sent_at: new Date().toISOString() })
            .eq('campaign_id', campaignId)
            .eq('member_id', member.id)
          failedCount++
        }
      })
    )
  }

  // ── Finalise campaign ──────────────────────────────────────────────────────
  await admin
    .from('member_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: eligible.length,
      sent_count: sentCount,
      failed_count: failedCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: eligible.length,
  })
}
