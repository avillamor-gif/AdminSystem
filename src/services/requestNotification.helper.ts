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
  | 'leave_credit_notifications'
  | 'internship_request_notifications'

export type RequestNotifType =
  | 'new_request'
  | 'approved'
  | 'rejected'
  | 'fulfilled'
  | 'cancelled'

/**
 * Look up the supervisor and all admins/managers server-side,
 * then insert a 'new_request' notification for each.
 *
 * Pass targetGroup: 'admin_dept_and_ed' to instead notify all employees in the
 * Administration Department AND all users with the Executive Director (ed) role.
 * Used by Leave Credit requests.
 */
export async function notifySupervisorsAndAdmins(
  table: RequestNotifTable,
  employeeId: string,
  requestId: string,
  title: string,
  message: string,
  requesterName: string,
  requestNumber?: string,
  targetGroup?: 'admin_dept_and_ed' | 'travel_approval' | 'leave_request' | 'admin_resources' | 'equipment' | 'supply'
): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, employeeId, requestId, title, message, requesterName, requestNumber, targetGroup }),
    })
  } catch (err) {
    console.warn(`[notification] notifySupervisorsAndAdmins failed:`, err)
  }
}

/**
 * Notify the requesting employee of an approval decision.
 * Pass notifyManagers: 'travel_managers' to also CC admin + finance managers.
 */
export async function notifyRequesterOfDecision(
  table: RequestNotifTable,
  requestTableName: string,
  requestId: string,
  decision: 'approved' | 'rejected' | 'fulfilled',
  title: string,
  message: string,
  requestNumber?: string,
  notifyManagers?: 'travel_managers'
): Promise<void> {
  try {
    await fetch('/api/notifications/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, requestTable: requestTableName, requestId, decision, title, message, requestNumber, notifyManagers }),
    })
  } catch (err) {
    console.warn(`[notification] notifyRequesterOfDecision failed:`, err)
  }
}

/**
 * Notify supervisors and admins that a leave request has been withdrawn/cancelled.
 * Pass withdrawnBy: 'admin' for admin deletions, 'employee' for employee withdrawals.
 */
export async function notifyLeaveWithdrawal(
  employeeId: string,
  requestId: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number,
  withdrawnBy: 'admin' | 'employee',
  adminName?: string
): Promise<void> {
  try {
    const title = withdrawnBy === 'admin' 
      ? `Leave Request Deleted: ${employeeName}`
      : `Leave Request Withdrawn: ${employeeName}`
    
    const message = withdrawnBy === 'admin'
      ? `${employeeName}'s ${leaveType} leave request (${startDate} to ${endDate}, ${days} days) has been deleted by HR.`
      : `${employeeName} has withdrawn their ${leaveType} leave request (${startDate} to ${endDate}, ${days} days).`

    await fetch('/api/notifications/leave-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId,
        requestId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        days,
        withdrawnBy,
        adminName,
        title,
        message,
      }),
    })
  } catch (err) {
    console.warn(`[notification] notifyLeaveWithdrawal failed:`, err)
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
