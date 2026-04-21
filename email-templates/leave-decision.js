/**
 * LEAVE DECISION EMAIL TEMPLATE
 * 
 * Sent to the employee when their leave request is approved or rejected.
 * 
 * Usage:
 * import { leaveDecisionEmail } from '@/lib/emailTemplates'
 * const { subject, html } = leaveDecisionEmail({
 *   employeeName: 'Juan dela Cruz',
 *   decision: 'approved', // or 'rejected'
 *   leaveType: 'Vacation Leave',
 *   startDate: '2026-05-01',
 *   endDate: '2026-05-05',
 *   days: 5,
 *   approverNote: 'Approved. Enjoy your vacation!' // optional
 * })
 */

const BASE_URL = 'https://adminsystem.iboninternational.org'

function layout(body) {
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
          <tr>
            <td style="background:#f97316;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
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

function button(label, href) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`
}

function statusBadge(status) {
  const bg = status === 'approved' ? '#dcfce7' : '#fee2e2'
  const color = status === 'approved' ? '#16a34a' : '#dc2626'
  const label = status === 'approved' ? '✔ Approved' : '✘ Rejected'
  return `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${bg};color:${color};font-size:13px;font-weight:600;">${label}</span>`
}

function leaveDecisionEmail(opts) {
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
    ${button('View My Leave →', `${BASE_URL}/leave/my-requests`)}
  `)
  return { subject, html }
}

// Export for use in the app
if (typeof module !== 'undefined') {
  module.exports = { leaveDecisionEmail }
}
