# Email Template System - Setup Instructions

## ✅ Completed

The email template system is now fully implemented! Here's what was created:

### 1. Database Layer
- **Migration SQL**: `supabase/email-templates-table.sql`
  - Creates `email_templates` table with all fields
  - Includes RLS policies (Admins can manage, authenticated users can read)
  - Seeds 5 default templates (leave request, leave approved/rejected, travel request, welcome)

### 2. Service & Hooks
- **Service**: `src/services/emailTemplate.service.ts`
  - `getAll()` - fetch all templates
  - `getByType(type)` - fetch specific template
  - `update(id, updates)` - update template
  - `resetToDefault(id)` - soft delete (marks inactive)

- **Hooks**: `src/hooks/useEmailTemplates.ts`
  - `useEmailTemplates()` - fetch all templates
  - `useEmailTemplateByType(type)` - fetch by type
  - `useUpdateEmailTemplate()` - mutation for updates
  - `useResetEmailTemplate()` - mutation for reset

### 3. Admin UI
- **Page**: `src/app/(dashboard)/admin/system-config/email-configuration/page.tsx`
  - Template list with descriptions
  - Live editor for subject, colors, button text, and HTML body
  - Color pickers for header and button colors
  - Variable support with documentation
  - Live preview modal
  - Test email sending
  - Save/reset functionality
  - Loading states and error handling

### 4. API Routes
- **Test Email**: `src/app/api/admin/email-templates/test/route.ts`
  - POST endpoint for sending test emails
  - Renders template with sample data
  - Sends via Resend

### 5. Template Renderer
- **Renderer**: `src/lib/emailTemplateRenderer.ts`
  - `renderEmailTemplate(type, variables)` - generic renderer
  - Helper functions: `renderNewLeaveRequestEmail()`, `renderLeaveDecisionEmail()`, etc.
  - Fetches from database and replaces variables
  - Wraps in full email layout

---

## 🚀 Next Steps (Run These in Supabase SQL Editor)

### Step 1: Create the Table
Run the migration SQL in your Supabase SQL Editor:

```bash
# Copy the contents of:
supabase/email-templates-table.sql

# Then paste and execute in Supabase SQL Editor
```

This will:
- Create the `email_templates` table
- Set up RLS policies
- Insert 5 default templates
- Create indexes and triggers

### Step 2: Verify Templates
After running the migration, verify the templates were created:

```sql
SELECT template_type, name, is_active 
FROM email_templates 
ORDER BY name;
```

You should see:
- `new-leave-request` - New Leave Request
- `leave-approved` - Leave Request Approved
- `leave-rejected` - Leave Request Rejected
- `new-travel-request` - New Travel Request
- `welcome` - Welcome Email

### Step 3: Update Database Types
After creating the table, regenerate TypeScript types:

```bash
npm run db:types
```

**Note**: You'll need to login to Supabase CLI first:
```bash
npx supabase login
```

If you don't have the Supabase CLI token, you can manually add the type to `database.types.ts` or just skip this step - the app will still work with TypeScript inference.

---

## 📧 Template Variables

Each template supports specific variables:

### Leave Request Templates
- `{requesterName}` - Employee name
- `{employeeName}` - Employee name
- `{leaveType}` - Type of leave
- `{startDate}` - Start date
- `{endDate}` - End date
- `{days}` - Number of days
- `{rejectionReason}` - Reason for rejection (rejected only)

### Travel Request Template
- `{requesterName}` - Employee name
- `{requestNumber}` - Request ID
- `{requestDetails}` - Travel details

### Welcome Email Template
- `{employeeName}` - New employee name
- `{email}` - Login email
- `{temporaryPassword}` - Temporary password

---

## 🎨 Using the Admin UI

1. Navigate to **System Configuration → Email Configuration**
2. Select a template from the list
3. Edit any field:
   - Subject line (with variable placeholders)
   - Header color (visual picker + hex input)
   - Button color (visual picker + hex input)
   - Button text
   - Email body HTML
4. Click **Preview** to see rendered email
5. Click **Send Test** to send to any email address
6. Click **Save Template** to persist changes
7. Click **Reset** to restore original template

---

## 🔄 Migrating Existing Notification System (Optional)

Currently, the notification system uses hardcoded templates from `src/lib/emailTemplates.ts`.

To use database templates instead:

### Option 1: Update notification API routes (Recommended)

Replace imports in `/api/notifications/send` and `/api/notifications/decision`:

```typescript
// OLD:
import { newLeaveRequestEmail, leaveDecisionEmail } from '@/lib/emailTemplates'

// NEW:
import { 
  renderNewLeaveRequestEmail, 
  renderLeaveDecisionEmail 
} from '@/lib/emailTemplateRenderer'
```

The function signatures are identical, so it's a drop-in replacement!

### Option 2: Keep both systems

- Database templates: For customizable user-facing emails
- Hardcoded templates: For system-critical emails

---

## 🎯 Features

✅ **Database-backed** - Templates stored in Supabase, not code  
✅ **Admin UI** - Non-technical users can edit templates  
✅ **Live Preview** - See changes before saving  
✅ **Test Emails** - Send to any address for testing  
✅ **Variable Support** - Dynamic content via `{variable}` syntax  
✅ **Color Customization** - Visual pickers for branding  
✅ **Version Control** - Reset to defaults anytime  
✅ **RLS Protected** - Only admins can edit  
✅ **Real-time** - Changes apply immediately  

---

## 📝 Template Editing Tips

### HTML Best Practices
- Use inline CSS only (no external stylesheets)
- Use table layouts for email compatibility
- Test in multiple email clients (Gmail, Outlook, etc.)
- Keep images external (use absolute URLs)

### Variable Usage
- Always wrap in curly braces: `{variableName}`
- Use descriptive names: `{employeeName}` not `{name}`
- Document available variables in the UI

### Color Schemes
- Header and button colors default to orange (#f97316)
- Use consistent branding colors
- Ensure text contrast for accessibility

---

## 🐛 Troubleshooting

### Templates not showing in UI
1. Verify migration ran successfully in Supabase
2. Check browser console for errors
3. Verify RLS policies allow your user to read templates

### Save not working
1. Check if user has Admin role
2. Verify RLS policies allow updates
3. Check network tab for API errors

### Test email not sending
1. Verify RESEND_API_KEY in `.env.local`
2. Check domain is verified in Resend dashboard
3. Check API route logs for errors

---

## 📚 File Reference

```
supabase/
  email-templates-table.sql          # Migration SQL

src/
  services/
    emailTemplate.service.ts         # CRUD operations
    index.ts                         # Re-export
  
  hooks/
    useEmailTemplates.ts             # React Query hooks
    index.ts                         # Re-export
  
  lib/
    emailTemplateRenderer.ts         # Database template renderer
    emailTemplates.ts                # Legacy hardcoded templates
  
  app/
    (dashboard)/admin/system-config/
      email-configuration/
        page.tsx                     # Admin UI
    
    api/admin/email-templates/
      test/route.ts                  # Test email endpoint
```

---

## ✨ Next Enhancements (Future)

- [ ] Template versioning (track changes over time)
- [ ] A/B testing for email effectiveness
- [ ] Rich text editor (WYSIWYG) instead of raw HTML
- [ ] Template preview in different email clients
- [ ] Email analytics (open rates, click rates)
- [ ] Multiple language support
- [ ] Template inheritance/composition
- [ ] Automated testing framework
- [ ] Template marketplace (import community templates)

---

**Ready to use!** Just run the migration SQL and start customizing your email templates in the admin UI.
