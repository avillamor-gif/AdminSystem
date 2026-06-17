# IBON International Membership System - Integration Guide

## Quick Start (5 steps)

### Step 1: Deploy Database Schema
```bash
# 1. Open Supabase SQL Editor
# 2. Copy entire contents of:
#    /supabase/add-membership-applications.sql
# 3. Paste & run in Supabase SQL Editor
# 4. You'll see success messages for table creation & trigger
```

**What it creates:**
- `member_applications` table with auto-incrementing reference numbers
- Supporting tables for education, affiliations, engagement history
- RLS policies for data security
- Trigger to generate APP-YYYY-XXXXXX reference numbers

### Step 2: Test the Public Form
```bash
# 1. Run dev server: npm run dev
# 2. Visit: http://localhost:3000/membership/apply
# 3. Fill out the form and submit
# 4. Should see confirmation with reference number
```

### Step 3: Test Admin Dashboard
```bash
# 1. Login as admin
# 2. Navigate to: /admin/governance/membership-applications
# 3. You should see the application from Step 2
# 4. Click on it to see detail panel
# 5. Try: Approve, Reject, or Request More Info buttons
```

### Step 4: Add Navigation Links
Update the governance layout sidebar to include:
```typescript
// In src/app/(dashboard)/admin/governance/layout.tsx
const subnav = [
  // ... existing items ...
  { label: 'Membership Applications', href: '/admin/governance/membership-applications' },
]
```

And add to public header/nav:
```typescript
// In src/components/layout/Header.tsx or public nav
<a href="/membership/apply" className="...">Become a Member</a>
```

### Step 5: Set Up Email Notifications (Optional but Recommended)

Add these email templates to your `email_templates` table:

#### Template 1: Application Received
```
Subject: Your IBON International Membership Application (Ref: {reference_number})
Body:
Thank you for submitting your membership application to IBON International.

Your Reference Number: {reference_number}
Name: {applicant_name}
Email: {applicant_email}

We will review your application and get back to you within 7 days. 
You can track your application status at: [link]

If you have any questions, please contact us at: [contact]

Best regards,
IBON International Team
```

#### Template 2: Application Approved
```
Subject: Congratulations! Your IBON International Membership is Approved
Body:
Dear {applicant_name},

Your membership application has been approved!

Welcome to IBON International. You are now a registered member.

Your Member Reference: {member_reference}
Login Link: [magic link or credentials]

Next Steps:
1. Complete your member profile
2. View upcoming events and campaigns
3. Connect with other members
4. Explore our publications and resources

If you have any questions, please contact us at: [contact]

Best regards,
IBON International Team
```

#### Template 3: Application Rejected
```
Subject: IBON International Membership Application Update
Body:
Dear {applicant_name},

Thank you for your interest in IBON International.

Unfortunately, we are unable to approve your application at this time.

Reason: {rejection_reason}

You may reapply after 6 months. If you have questions about this decision,
please contact us at: [contact]

Best regards,
IBON International Team
```

## Data Flow Diagram

```
┌─────────────────────┐
│  Public Applicant   │
└──────────┬──────────┘
           │
           ▼
   ┌───────────────────┐
   │ /membership/apply │ (Public form)
   └───────────┬───────┘
               │ Submit
               ▼
    ┌──────────────────────┐
    │ member_applications  │ (Draft → Submitted)
    └──────────┬───────────┘
               │
    ┌──────────▼────────────┐
    │   Email Notification  │
    │  (App Received)       │
    └───────────────────────┘
               │
        ┌──────▼──────┐
        │ Admin Review │
        └──────┬───────┘
               │ /admin/governance/membership-applications
               │
    ┌──────────▼──────────┐
    │  Admin Actions:     │
    │  - Approve          │
    │  - Reject           │
    │  - Request Info     │
    └──────┬─────────┬────┘
           │         │
    ┌──────▼─┐  ┌────▼──────┐
    │ Approve │  │ Reject    │
    └──────┬──┘  └────┬──────┘
           │          │
    ┌──────▼──────┐   │
    │Create Member│   │
    │in members   │   │
    │table        │   │
    └──────┬──────┘   │
           │          │
    ┌──────▼──────┐  ┌▼───────────┐
    │Send Welcome │  │Send Reject │
    │Email        │  │Email       │
    └─────────────┘  └────────────┘
```

## Features Breakdown

### Public Form (/membership/apply)
- **Step 1:** Personal Information (name, age, citizenship, contact, address)
- **Step 2:** Education Background (institution, degree, years)
- **Step 3:** Current Organization (name, position, type, address)
- **Step 4:** IBON Engagement (motivation, publications, past events)
- **Step 5:** Endorsement (endorser name, relationship, email)
- **Step 6:** Review & Submit

### Admin Dashboard (/admin/governance/membership-applications)
- List all applications with status
- Filter by status (New, Under Review, Approved, Rejected)
- Search by name, email, reference
- View full details in side panel with tabs
- Actions: Approve, Reject (with reason), Request More Info
- KPI cards showing counts

### Database
- Reference numbers auto-generated: APP-2026-000001, APP-2026-000002, etc.
- RLS policies restrict access to own records + admin/governance roles
- Foreign keys link education/affiliations/engagements to applications
- Timestamps track submission, review, approval dates

## Troubleshooting

### Issue: Form submission fails
**Solution:** Check browser console for errors. Ensure Supabase client is configured and user is authenticated (or allow anonymous access if public).

### Issue: Reference number not generating
**Solution:** Check that the trigger `trigger_generate_app_reference` was created successfully in Supabase.

### Issue: Admin can't see applications
**Solution:** Verify user has `governance` or `admin` role in `user_roles` table.

### Issue: Email notifications not working
**Solution:** Not yet implemented - you'll need to:
1. Create email templates in `email_templates` table
2. Set up Resend or similar email service
3. Call email API from mutation hooks' `onSuccess` callbacks

## Security Notes

- ✅ RLS policies enforce row-level access control
- ✅ Reference numbers are sequential but not predictable (UUID-based)
- ✅ Sensitive data (endorser emails) protected by RLS
- ⚠️ Email notifications require additional authentication
- ⚠️ Member creation from approved apps should validate endorser

## Performance

- Query keys cache applications by status filter
- Mutations automatically invalidate relevant cache keys
- Detail panel only fetches 1 application at a time
- No N+1 queries - relations fetched in parallel

## What's Next?

1. ✅ Database schema → Run SQL migration
2. ✅ Public form → Available at /membership/apply
3. ✅ Admin dashboard → Available at /admin/governance/membership-applications
4. ⏳ Email notifications → Implement templates + API integration
5. ⏳ Member creation automation → Create members from approved apps
6. ⏳ Endorser verification workflow → Send verification links to endorsers
7. ⏳ Analytics dashboard → Show application metrics over time
8. ⏳ Bulk actions → Approve/reject multiple at once

## Contact & Support

For questions about implementation, refer to:
- `/MEMBERSHIP_FLOW.md` - Workflow overview
- `/memories/repo/membership-system.md` - System architecture
- Database schema comments in `add-membership-applications.sql`
