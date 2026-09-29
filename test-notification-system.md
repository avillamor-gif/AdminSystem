# Notification System Fix Verification

## Changes Made

### 1. Service Worker (public/sw.js)
- **Before:** 2000+ lines with 165 duplicate push handlers
- **After:** 75 lines with clean handlers
- **Impact:** Fixes potential service worker parsing errors and memory issues

### 2. Append Script (scripts/append-sw-push.js)
- **Before:** Checked for comment only; would append duplicates on each build
- **After:** Checks for actual handler code; detects and warns about duplicates
- **Impact:** Prevents future duplicate handlers

### 3. Email Sending Logging
**Added to `/api/notifications/send/route.ts`:**
```
- Recipient count logging
- Auth user list retrieval logging
- Email address resolution logging
- Batch send progress logging
- Detailed error logging for failed auth lookups
```

**Added to `/api/notifications/decision/route.ts`:**
```
- Email preparation logging
- Auth user lookup logging (obfuscated email)
- Resend send result logging
- Detailed error logging
```

## Testing Steps

### Step 1: Rebuild the Application
```bash
npm run build
```
Expected output:
- Service worker rebuilt
- Append script runs with new duplicate detection logic
- No warnings about duplicate handlers (if script runs correctly)

### Step 2: Test Email Sending
Create a new leave request in the application. Check browser console and server logs for:

**In Browser Console:**
- Network request to `/api/notifications/send` should return `{ inserted: X }` where X > 0

**In Server Logs** (look for these lines):
```
[notifications/send] Preparing to send emails to X recipient(s)
[notifications/send] Retrieved Y auth users
[notifications/send] Resolved Z email address(es) from X recipient(s)
[notifications/send] Prepared leave request email for [Leave Type]
[notifications/send] Batch 1: N sent, M failed
[notifications/send] Email sending complete: N succeeded, M failed
```

### Step 3: Check for Errors
If emails still aren't sending, look for error messages like:
```
[notifications/send] Failed to list auth users: [ERROR MESSAGE]
[notifications/send] No email addresses found for X recipient(s)
[notifications/send] Email send failed: [ERROR MESSAGE]
[notifications/send] RESEND_API_KEY not configured
```

## Diagnostics

If emails still don't arrive after rebuild:

### Check 1: RESEND_API_KEY Configuration
```bash
grep RESEND_API_KEY .env.local
```
Should output a key like: `RESEND_API_KEY=re_...`

### Check 2: Email Address Mismatch
The logging will show:
- How many recipient user IDs were found: `Preparing to send emails to X recipient(s)`
- How many email addresses were resolved: `Resolved Z email address(es) from X recipient(s)`

If Z < X, there's a mismatch between user_roles and auth users.

### Check 3: Auth User Lookup Failure
If you see:
```
[notifications/send] Failed to list auth users: [ERROR]
[notifications/send] Email sending skipped due to auth user lookup failure
```
This means the `admin.auth.admin.listUsers()` call is failing. This could be:
- Rate limiting
- Permission issues
- Temporary Supabase outage

## Manual Email Test

To manually test email sending:
```bash
node -e "
const { Resend } = require('resend');
const resend = new Resend('$RESEND_API_KEY');
resend.emails.send({
  from: 'IBON International <admin@adminsystem.iboninternational.org>',
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test email</p>'
}).then(r => console.log('Success:', r)).catch(e => console.error('Failed:', e));
"
```

## Rollback Plan

If something breaks after rebuild, these are the critical files changed:
1. `public/sw.js` - can be reverted by running `git checkout public/sw.js`
2. `scripts/append-sw-push.js` - safer to keep, improves behavior
3. `src/app/api/notifications/send/route.ts` - only logging added, no logic changes
4. `src/app/api/notifications/decision/route.ts` - only logging added, no logic changes

All changes are non-breaking and only improve observability.
