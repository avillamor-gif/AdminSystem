import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/leave/pending-notifs
 *
 * Returns leave_request_notifications of type `new_request` where:
 *   - the notification belongs to the calling user
 *   - the linked leave_request is still `pending`
 *
 * Also auto-resets is_read=false on any that were accidentally marked read
 * while the request was still pending (so the bell stays lit).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: [] })

    const admin = createAdminClient()

    // Fetch all new_request leave notifs for this user (read or unread)
    const { data: notifs, error: notifErr } = await admin
      .from('leave_request_notifications')
      .select('*')
      .eq('recipient_user_id', user.id)
      .eq('type', 'new_request')
      .order('created_at', { ascending: false })

    if (notifErr || !notifs?.length) return NextResponse.json({ data: [] })

    // Fetch the leave request statuses for those notifications
    const leaveRequestIds = notifs.map((n: any) => n.leave_request_id).filter(Boolean)
    const { data: leaveRequests } = await admin
      .from('leave_requests')
      .select('id, status')
      .in('id', leaveRequestIds)

    const pendingIds = new Set((leaveRequests ?? []).filter((r: any) => r.status === 'pending').map((r: any) => r.id))

    // Auto-reset is_read=false for any notif whose leave request is still pending
    const accidentallyRead = notifs.filter((n: any) => n.is_read && pendingIds.has(n.leave_request_id))
    if (accidentallyRead.length > 0) {
      await admin
        .from('leave_request_notifications')
        .update({ is_read: false })
        .in('id', accidentallyRead.map((n: any) => n.id))
    }

    // Return only notifs whose leave request is still pending
    const activeNotifs = notifs
      .filter((n: any) => pendingIds.has(n.leave_request_id))
      .map((n: any) => ({ ...n, is_read: false })) // always treat as unread in the UI

    return NextResponse.json({ data: activeNotifs })
  } catch (err: any) {
    console.error('[pending-notifs] Error:', err)
    return NextResponse.json({ data: [] })
  }
}
