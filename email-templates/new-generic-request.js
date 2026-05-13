/**
 * NEW GENERIC REQUEST EMAIL TEMPLATE
 * 
 * Sent to supervisors/admins when a new request is submitted.
 * Used for: Travel, Equipment, Supply, Publication, Leave Credit requests.
 * 
 * Usage:
 * import { newGenericRequestEmail } from '@/lib/emailTemplates'
 * const { subject, html } = newGenericRequestEmail({
 *   requesterName: 'Juan dela Cruz',
 *   requestType: 'Travel', // or 'Equipment', 'Supply', 'Publication', 'Leave Credit'
 *   requestNumber: 'TRV-2026-001', // optional
 *   details: 'Business trip to Manila for 3 days'
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

function newGenericRequestEmail(opts) {
  const subject = `New ${opts.requestType} Request${opts.requestNumber ? ` #${opts.requestNumber}` : ''} from ${opts.requesterName}`
  
  // Map request type to specific admin URLs
  const urlMap = {
    'Travel': '/admin/travel',
    'Publication': '/admin/publications/publication-management',
    'Equipment': '/admin/office-equipment/equipment-requests',
    'Supply': '/admin/office-supplies/supply-requests',
    'Leave Credit': '/admin/leave-management/leave-credits',
  }
  const reviewUrl = urlMap[opts.requestType] || '/admin'
  
  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New ${opts.requestType} Request</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      <strong>${opts.requesterName}</strong> has submitted a new ${opts.requestType.toLowerCase()} request${opts.requestNumber ? ` (<strong>#${opts.requestNumber}</strong>)` : ''}.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
      ${opts.details}
    </div>
    ${button('Review Request →', `${BASE_URL}${reviewUrl}`)}
  `)
  return { subject, html }
}

// Export for use in the app
if (typeof module !== 'undefined') {
  module.exports = { newGenericRequestEmail }
}
