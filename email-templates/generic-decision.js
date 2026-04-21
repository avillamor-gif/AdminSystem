/**
 * GENERIC DECISION EMAIL TEMPLATE
 * 
 * Sent to the employee when their request is approved, rejected, or fulfilled.
 * Used for: Travel, Equipment, Supply, Publication, Leave Credit requests.
 * 
 * Usage:
 * import { genericDecisionEmail } from '@/lib/emailTemplates'
 * const { subject, html } = genericDecisionEmail({
 *   employeeName: 'Juan dela Cruz',
 *   decision: 'approved', // or 'rejected', 'fulfilled'
 *   requestType: 'Travel', // or 'Equipment', 'Supply', 'Publication', 'Leave Credit'
 *   requestNumber: 'TRV-2026-001', // optional
 *   details: 'Your business trip to Manila has been approved. Safe travels!'
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

function genericDecisionEmail(opts) {
  const verbMap = { approved: 'Approved', rejected: 'Rejected', fulfilled: 'Fulfilled' }
  const verb = verbMap[opts.decision]
  const subject = `Your ${opts.requestType} Request Has Been ${verb}${opts.requestNumber ? ` (#${opts.requestNumber})` : ''}`
  const bgMap = { approved: '#dcfce7', rejected: '#fee2e2', fulfilled: '#dbeafe' }
  const colorMap = { approved: '#16a34a', rejected: '#dc2626', fulfilled: '#2563eb' }
  const iconMap = { approved: '✔', rejected: '✘', fulfilled: '📦' }
  const badge = `<span style="display:inline-block;padding:4px 12px;border-radius:99px;background:${bgMap[opts.decision]};color:${colorMap[opts.decision]};font-size:13px;font-weight:600;">${iconMap[opts.decision]} ${verb}</span>`

  // Map request type to employee-facing URLs
  const urlMap = {
    'Travel': '/travel/my-requests',
    'Publication': '/publications/my-requests',
    'Equipment': '/office-equipment/my-requests',
    'Supply': '/office-supplies/my-requests',
    'Leave Credit': '/leave-credit/my-requests',
  }
  const viewUrl = urlMap[opts.requestType] || '/'

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${opts.requestType} Request ${verb}</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${opts.employeeName}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;">
      Your ${opts.requestType.toLowerCase()} request${opts.requestNumber ? ` <strong>#${opts.requestNumber}</strong>` : ''} has been ${verb.toLowerCase()}. ${badge}
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
      ${opts.details}
    </div>
    ${button('View Request →', `${BASE_URL}${viewUrl}`)}
  `)
  return { subject, html }
}

// Export for use in the app
if (typeof module !== 'undefined') {
  module.exports = { genericDecisionEmail }
}
