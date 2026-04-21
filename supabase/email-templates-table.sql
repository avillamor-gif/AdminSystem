-- =============================================
-- Email Templates Table
-- =============================================
-- Stores customizable email notification templates
-- Used by the Email Configuration admin page

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL UNIQUE, -- 'new-leave-request', 'leave-approved', 'leave-rejected', etc.
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  header_color text NOT NULL DEFAULT '#f97316',
  button_color text NOT NULL DEFAULT '#f97316',
  button_text text NOT NULL DEFAULT 'View Details →',
  body_template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb, -- Array of available variable names
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON email_templates;

-- Admin users can do everything
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- All authenticated users can view active templates (for email sending)
CREATE POLICY "Authenticated users can view active templates"
  ON email_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- =============================================
-- Insert Default Email Templates
-- =============================================

INSERT INTO email_templates (template_type, name, description, subject, header_color, button_color, button_text, body_template, variables) VALUES
(
  'new-leave-request',
  'New Leave Request',
  'Sent to supervisors when an employee submits a leave request',
  'New Leave Request from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Leave Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted a leave request and is awaiting your approval.
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{leaveType}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{startDate}</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">To</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{endDate}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{days} day(s)</td>
  </tr>
</table>',
  '["requesterName", "leaveType", "startDate", "endDate", "days"]'::jsonb
),
(
  'leave-approved',
  'Leave Request Approved',
  'Sent to employee when their leave request is approved',
  'Your Leave Request Has Been Approved',
  '#f97316',
  '#f97316',
  'View My Leave →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Leave Request Approved</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your leave request has been reviewed and approved. ✔
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{leaveType}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">From - To</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{startDate} to {endDate}</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Duration</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{days} day(s)</td>
  </tr>
</table>',
  '["employeeName", "leaveType", "startDate", "endDate", "days"]'::jsonb
),
(
  'leave-rejected',
  'Leave Request Rejected',
  'Sent to employee when their leave request is rejected',
  'Your Leave Request Has Been Rejected',
  '#f97316',
  '#f97316',
  'View My Leave →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Leave Request Rejected</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your leave request has been reviewed and rejected. ✘
</p>
<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-size:14px;color:#991b1b;margin-bottom:8px;">
  {rejectionReason}
</div>',
  '["employeeName", "rejectionReason"]'::jsonb
),
(
  'new-travel-request',
  'New Travel Request',
  'Sent to approvers when an employee submits a travel request',
  'New Travel Request #{requestNumber} from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Travel Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted a new travel request (<strong>#{requestNumber}</strong>).
</p>
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
  {requestDetails}
</div>',
  '["requesterName", "requestNumber", "requestDetails"]'::jsonb
),
(
  'welcome',
  'Welcome Email',
  'Sent to new employees when their account is created',
  'Welcome to II Admin System, {employeeName}!',
  '#f97316',
  '#f97316',
  'Log In Now →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome aboard, {employeeName}! 👋</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  Your account has been created on the <strong>II Admin System</strong>.
  You can now log in to manage your leave, view payslips, and more.
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Login Email</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{email}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Temporary Password</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;font-family:monospace;">{temporaryPassword}</td>
  </tr>
</table>
<p style="margin:8px 0 20px;font-size:13px;color:#6b7280;">Please change your password after your first login.</p>',
  '["employeeName", "email", "temporaryPassword"]'::jsonb
),
(
  'new-equipment-request',
  'New Equipment Request',
  'Sent to approvers when an employee requests equipment',
  'New Equipment Request #{requestNumber} from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Equipment Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted an equipment request (<strong>#{requestNumber}</strong>).
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Equipment</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{equipmentName}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Quantity</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{quantity}</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Purpose</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{purpose}</td>
  </tr>
</table>',
  '["requesterName", "requestNumber", "equipmentName", "quantity", "purpose"]'::jsonb
),
(
  'equipment-approved',
  'Equipment Request Approved',
  'Sent to employee when their equipment request is approved',
  'Your Equipment Request Has Been Approved',
  '#f97316',
  '#f97316',
  'View Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Equipment Request Approved</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your equipment request (<strong>#{requestNumber}</strong>) has been approved. ✔
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Equipment</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{equipmentName}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Quantity</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{quantity}</td>
  </tr>
</table>',
  '["employeeName", "requestNumber", "equipmentName", "quantity"]'::jsonb
),
(
  'new-supply-request',
  'New Supply Request',
  'Sent to approvers when an employee requests supplies',
  'New Supply Request #{requestNumber} from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Supply Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted a supply request (<strong>#{requestNumber}</strong>).
</p>
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;margin-bottom:8px;">
  {itemDetails}
</div>',
  '["requesterName", "requestNumber", "itemDetails"]'::jsonb
),
(
  'supply-fulfilled',
  'Supply Request Fulfilled',
  'Sent to employee when their supply request is fulfilled',
  'Your Supply Request Has Been Fulfilled',
  '#f97316',
  '#f97316',
  'View Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Supply Request Fulfilled</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your supply request (<strong>#{requestNumber}</strong>) has been fulfilled. ✔
</p>
<p style="margin:0;font-size:14px;color:#374151;">
  Please collect your items from the supply office.
</p>',
  '["employeeName", "requestNumber"]'::jsonb
),
(
  'new-publication-request',
  'New Publication Request',
  'Sent to approvers when an employee requests publication',
  'New Publication Request #{requestNumber} from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Publication Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted a publication request (<strong>#{requestNumber}</strong>).
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Title</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{publicationTitle}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Type</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{publicationType}</td>
  </tr>
</table>',
  '["requesterName", "requestNumber", "publicationTitle", "publicationType"]'::jsonb
),
(
  'new-leave-credit-request',
  'New Leave Credit Request',
  'Sent to approvers when an employee requests leave credit',
  'New Leave Credit Request from {requesterName}',
  '#f97316',
  '#f97316',
  'Review Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">New Leave Credit Request</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">
  <strong>{requesterName}</strong> has submitted a leave credit request.
</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;width:40%;">Leave Type</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{leaveType}</td>
  </tr>
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Credits Requested</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{credits} day(s)</td>
  </tr>
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Reason</td>
    <td style="padding:10px 16px;font-size:14px;color:#111827;">{reason}</td>
  </tr>
</table>',
  '["requesterName", "leaveType", "credits", "reason"]'::jsonb
),
(
  'request-approved',
  'Request Approved',
  'Generic approval notification for any request type',
  'Your Request Has Been Approved',
  '#f97316',
  '#f97316',
  'View Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Request Approved</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your {requestType} request has been approved. ✔
</p>',
  '["employeeName", "requestType"]'::jsonb
),
(
  'request-rejected',
  'Request Rejected',
  'Generic rejection notification for any request type',
  'Your Request Has Been Rejected',
  '#f97316',
  '#f97316',
  'View Request →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Request Rejected</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>{employeeName}</strong>,</p>
<p style="margin:0 0 20px;color:#374151;font-size:15px;">
  Your {requestType} request has been rejected. ✘
</p>
<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-size:14px;color:#991b1b;margin-bottom:8px;">
  {rejectionReason}
</div>',
  '["employeeName", "requestType", "rejectionReason"]'::jsonb
)
ON CONFLICT (template_type) DO NOTHING;
