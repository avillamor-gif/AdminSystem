/**
 * Shared helper for inserting per-user request notifications.
 * Used by travel, publication, asset (equipment) and supply services.
 *
 * Notifications are sent via server-side API routes (using service role key)
 * so that RLS on user_roles does not block admin/manager lookups.
 */

export type RequestNotifTable =
  | 'travel_request_notifications'
  | 'publication_request_notifications'
  | 'equipment_request_notifications'
  | 'supply_request_notifications'
  | 'leave_request_notifications'

export type RequestNotifType =
  | 'new_request'
  | 'approved'
  | 'rejected'
  | 'fulfilled'
  | 'cancelled'

/**
 * Look up the supervisor and all admins/managers server-side,
 * then insert a 'new_request' notification for each.
 */
export async function notifySupervisorsAndAdmins(
  table: RequestNotifTable,
  employeeId: string,
  requestId: string,
  title: string,
  message: string,
  requesterName: string,
  requestNumber?: string
): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, employeeId, requestId, title, message, requesterName, requestNumber }),
    })
  } catch (err) {
    console.warn(`[notification] notifySupervisorsAndAdmins failed:`, err)
  }
}

/**
 * Notify the requesting employee of an approval decision.
 */
export async function notifyRequesterOfDecision(
  table: RequestNotifTable,
  requestTableName: string,
  requestId: string,
  decision: 'approved' | 'rejected' | 'fulfilled',
  title: string,
  message: string,
  requestNumber?: string
): Promise<void> {
  try {
    await fetch('/api/notifications/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, requestTable: requestTableName, requestId, decision, title, message, requestNumber }),
    })
  } catch (err) {
    console.warn(`[notification] notifyRequesterOfDecision failed:`, err)
  }
}

/** @deprecated Use notifySupervisorsAndAdmins or notifyRequesterOfDecision instead */
export async function sendRequestNotification(
  table: RequestNotifTable,
  recipientUserId: string,
  type: RequestNotifType,
  title: string,
  message: string,
  requestId: string,
  requesterName: string,
  requestNumber?: string
): Promise<void> {
  // no-op — kept for backward compatibility, real sends go through API routes
}
