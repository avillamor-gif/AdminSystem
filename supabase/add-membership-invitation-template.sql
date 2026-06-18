-- =============================================
-- Add Membership Invitation Email Template
-- =============================================

INSERT INTO email_templates (template_type, name, description, subject, header_color, button_color, button_text, body_template, variables)
VALUES (
  'membership-invitation',
  'Membership Invitation',
  'Sent to invited users to join IBON International as a member',
  'You''re invited to join IBON International',
  '#f97316',
  '#f97316',
  'Start Application →',
  '<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Join IBON International</h2>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">Dear <strong>{targetName}</strong>,</p>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">{invitationMessage}</p>
<p style="margin:0 0 16px;color:#374151;font-size:15px;">We''re a network of people and organizations working on poverty, inequality, and social movements in the Global South and beyond.</p>
<p style="margin:0 0 24px;color:#374151;font-size:15px;">Click the button below to start your membership application:</p>
<p style="margin:0 0 24px;font-size:14px;color:#4b5563;">If you have any questions, feel free to contact us.</p>
<p style="margin:0;font-size:14px;color:#4b5563;">Best regards,<br/>The IBON International Team</p>',
  '["targetName", "invitationMessage"]'::jsonb
)
ON CONFLICT (template_type) DO NOTHING;
