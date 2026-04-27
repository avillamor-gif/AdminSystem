/**
 * Email Template Renderer
 * Fetches templates from database and renders them with variables
 */

import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase'

type EmailTemplate = Tables<'email_templates'>

const BASE_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL ?? 'https://adminsystem.iboninternational.org'

/**
 * Render an email template with variables
 */
function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string | number>
): { subject: string; html: string } {
  let subject = template.subject
  let bodyHtml = template.body_template

  // Replace all variables in subject and body
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g')
    subject = subject.replace(regex, String(value))
    bodyHtml = bodyHtml.replace(regex, String(value))
  })

  // Wrap in full email layout
  const html = `<!DOCTYPE html>
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
            <td style="background:${template.header_color};padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              <a href="${BASE_URL}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${template.button_color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${template.button_text}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from II Admin System. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

/**
 * Get template from database and render with variables
 */
export async function renderEmailTemplate(
  templateType: string,
  variables: Record<string, string | number>
): Promise<{ subject: string; html: string } | null> {
  const supabase = createClient()

  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_active', true)
    .single()

  if (error || !template) {
    console.error(`Email template not found: ${templateType}`, error)
    return null
  }

  return renderTemplate(template, variables)
}

/**
 * Helper functions for common email types
 */

export async function renderNewLeaveRequestEmail(opts: {
  requesterName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
}): Promise<{ subject: string; html: string } | null> {
  return renderEmailTemplate('new-leave-request', opts)
}

export async function renderLeaveDecisionEmail(opts: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: 'approved' | 'rejected'
  rejectionReason?: string
}): Promise<{ subject: string; html: string } | null> {
  const templateType = opts.status === 'approved' ? 'leave-approved' : 'leave-rejected'
  return renderEmailTemplate(templateType, opts)
}

export async function renderNewTravelRequestEmail(opts: {
  requesterName: string
  requestNumber: string
  requestDetails: string
}): Promise<{ subject: string; html: string } | null> {
  return renderEmailTemplate('new-travel-request', opts)
}

export async function renderWelcomeEmail(opts: {
  employeeName: string
  email: string
  temporaryPassword: string
}): Promise<{ subject: string; html: string } | null> {
  return renderEmailTemplate('welcome', opts)
}
