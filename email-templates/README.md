# Email Templates for II Admin System

This folder contains standalone, editable email templates. Each template is a self-contained file that you can customize as needed.

## Available Templates

### 1. **new-leave-request.js**
Sent to supervisors/admins when an employee submits a leave request.
- Includes: leave type, dates, duration, reason
- Button: "Review Request →" → `/admin/leave-management`

### 2. **leave-decision.js**
Sent to employees when their leave request is approved/rejected.
- Includes: leave details, approval status badge, approver notes
- Button: "View My Leave →" → `/leave/my-requests`

### 3. **new-generic-request.js**
Sent to supervisors/admins for Travel, Equipment, Supply, Publication, Leave Credit requests.
- Includes: requester name, request number, details
- Button: "Review Request →" → specific admin page

### 4. **generic-decision.js**
Sent to employees when their request is approved/rejected/fulfilled.
- Includes: status badge (approved/rejected/fulfilled), details
- Button: "View Request →" → specific employee page

### 5. **welcome.js**
Sent to newly created employee accounts.
- Includes: login email, temporary password (if provided)
- Button: "Log In Now →" → homepage

## Customization Guide

### Changing Colors

**Brand Orange** (`#f97316`):
- Header background
- Button background
- Used in 3 places per template

**Status Colors**:
- Approved: `#dcfce7` (bg), `#16a34a` (text)
- Rejected: `#fee2e2` (bg), `#dc2626` (text)
- Fulfilled: `#dbeafe` (bg), `#2563eb` (text)

### Changing Text

All user-facing text is in plain English and can be edited directly in the template files. Look for:
- Email subject lines
- Headings (`<h2>`)
- Body paragraphs (`<p>`)
- Button labels
- Footer text

### Changing Button URLs

Update the `urlMap` objects or `button()` calls in each template to point to different pages.

### Changing Layout

The `layout()` function wraps all email content. Edit it to:
- Change header branding
- Modify footer text
- Adjust spacing/padding
- Change font families

## Testing Templates

Use the test scripts in the root directory:
```bash
node send-test-email.js
```

Or test individual templates:
```javascript
const { newLeaveRequestEmail } = require('./email-templates/new-leave-request.js')
const { subject, html } = newLeaveRequestEmail({
  requesterName: 'Test User',
  leaveType: 'Vacation',
  startDate: '2026-05-01',
  endDate: '2026-05-05',
  days: 5,
  reason: 'Testing'
})
console.log(subject)
console.log(html)
```

## Production Templates

The actual templates used in production are in:
`src/lib/emailTemplates.ts`

After editing templates here, copy changes to the production file.
