/**
 * Plain-HTML email templates for II Admin System notifications.
 *
 * All functions return { subject, html } ready to pass to resend.emails.send().
 * Keep templates simple — inline CSS only, no external assets.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://adminsystem.iboninternational.org'

// ─── Shared chrome ────────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>II Admin System</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#f97316;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from II Admin System.
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`
}

function statusBadge(status: 'approved' | 'rejected'): string {
  const bg = status === 'approved' ? '#dcfce7' : '#fee2e2'
  const color = status === 'approved' ? '#16a34a' : '#dc2626'
  const label = status === 'approved' ? '✔ Approved' : '✘ Rejected'
  return `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${bg};color:${color};font-size:13px;font-weight:600;">${label}</span>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * Sent to supervisors / admins when a new leave request is submitted.
 */
export function newLeaveRequestEmail(opts: {
  requesterName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason?: string
}): { subject: string; html: string } {
  const subject = `New Leave Request from ${opts.requesterName}`
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Leave Request</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      <strong>${opts.requesterName}</strong> has submitted a leave request and is awaiting your approval.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.leaveType}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.startDate}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">To</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.endDate}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.days} day${opts.days !== 1 ? 's' : ''}</td>
      </tr>
      ${opts.reason ? `
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Reason</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.reason}</td>
      </tr>` : ''}
    </table>
    ${button('Review Request', `${BASE_URL}/admin/leave-management`)}
  `)
  return { subject, html }
}

/**
 * Sent to the employee when their leave request is approved or rejected.
 */
export function leaveDecisionEmail(opts: {
  employeeName: string
  decision: 'approved' | 'rejected'
  leaveType: string
  startDate: string
  endDate: string
  days: number
  approverNote?: string
}): { subject: string; html: string } {
  const verb = opts.decision === 'approved' ? 'Approved' : 'Rejected'
  const subject = `Your Leave Request Has Been ${verb}`
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Leave Request ${verb}</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${opts.employeeName}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">
      Your leave request has been reviewed. ${statusBadge(opts.decision)}
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.leaveType}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.startDate}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">To</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.endDate}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.days} day${opts.days !== 1 ? 's' : ''}</td>
      </tr>
      ${opts.approverNote ? `
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Note</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.approverNote}</td>
      </tr>` : ''}
    </table>
    ${button('View My Leave', `${BASE_URL}/leave`)}
  `)
  return { subject, html }
}

/**
 * Sent to supervisors / admins when a new general request (travel, supply, etc.) is submitted.
 */
export function newGenericRequestEmail(opts: {
  requesterName: string
  requestType: string
  requestNumber?: string
  details: string
}): { subject: string; html: string } {
  const subject = `New ${opts.requestType} Request${opts.requestNumber ? ` #${opts.requestNumber}` : ''} from ${opts.requesterName}`
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New ${opts.requestType} Request</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      <strong>${opts.requesterName}</strong> has submitted a new ${opts.requestType.toLowerCase()} request${opts.requestNumber ? ` (<strong>#${opts.requestNumber}</strong>)` : ''}.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
      ${opts.details}
    </div>
    ${button('Review in Admin', `${BASE_URL}/admin`)}
  `)
  return { subject, html }
}

/**
 * Sent to the requester when their general request is approved, rejected, or fulfilled.
 */
export function genericDecisionEmail(opts: {
  employeeName: string
  decision: 'approved' | 'rejected' | 'fulfilled'
  requestType: string
  requestNumber?: string
  details: string
}): { subject: string; html: string } {
  const verbMap = { approved: 'Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }
  const verb = verbMap[opts.decision]
  const subject = `Your ${opts.requestType} Request Has Been ${verb}${opts.requestNumber ? ` (#${opts.requestNumber})` : ''}`
  const bgMap = { approved: '#dcfce7', rejected: '#fee2e2', fulfilled: '#dbeafe' }
  const colorMap = { approved: '#16a34a', rejected: '#dc2626', fulfilled: '#2563eb' }
  const iconMap = { approved: '✔', rejected: '✘', fulfilled: '📦' }
  const badge = `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${bgMap[opts.decision]};color:${colorMap[opts.decision]};font-size:13px;font-weight:600;">${iconMap[opts.decision]} ${verb}</span>`

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${opts.requestType} Request ${verb}</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${opts.employeeName}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">
      Your ${opts.requestType.toLowerCase()} request${opts.requestNumber ? ` <strong>#${opts.requestNumber}</strong>` : ''} has been ${verb.toLowerCase()}. ${badge}
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
      ${opts.details}
    </div>
    ${button('View My Requests', BASE_URL)}
  `)
  return { subject, html }
}

/**
 * Welcome email sent to a newly created employee account.
 */
export function welcomeEmail(opts: {
  employeeName: string
  email: string
  temporaryPassword?: string
}): { subject: string; html: string } {
  const subject = `Welcome to II Admin System, ${opts.employeeName}!`
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome aboard, ${opts.employeeName}! 👋</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Your account has been created on the <strong>II Admin System</strong>.
      You can now log in to manage your leave, view payslips, and more.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Login Email</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;">${opts.email}</td>
      </tr>
      ${opts.temporaryPassword ? `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Temporary Password</td>
        <td style="padding:10px 16px;font-size:14px;color:#111827;font-family:monospace;">${opts.temporaryPassword}</td>
      </tr>` : ''}
    </table>
    ${opts.temporaryPassword ? '<p style="margin:8px 0 20px;font-size:13px;color:#6b7280;">Please change your password after your first login.</p>' : ''}
    ${button('Log In Now', BASE_URL)}
  `)
  return { subject, html }
}
