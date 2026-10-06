# Leave Request Notification System - Complete Architecture

## Executive Summary

The leave request notification system in the II Admin System is **fully database-driven and UI-configurable**. Here's why Mr. Ralf Dugan and other employees did NOT receive admin notifications:

### The Problem
- **Configuration:** The `workflow_configs` table had `notify_on_submit = ["direct_manager"]` only
- **Expected:** Should be `["direct_manager", "admin"]`
- **Result:** Only supervisors were notified, admins received nothing

### The Solution
Updated `workflow_configs` for the "leave" request type to include "admin" in `notify_on_submit` array.

### The Setup Location
**Admin UI:** `/admin/system-config/workflow-settings` → Leave Request card

---

## Complete Architecture

### 1. Configuration Layer

**Database Table:** `workflow_configs`

```sql
request_type: 'leave'
display_name: 'Leave Request'
description: 'Standard employee leave requests...'
notification_table: 'leave_request_notifications'
notify_on_submit: ["direct_manager", "admin"]  -- ← WHO GETS NOTIFIED
notify_on_decision: ["admin"]
approval_steps: [
  {
    "level": 1,
    "approver_role": "direct_manager",
    "label": "Direct Manager",
    "timeout_days": 3
  }
]
is_active: true
```

**Configurable Via:** `/admin/system-config/workflow-settings`

### 2. Service Layer

**Entry Point:** `src/services/leaveRequest.service.ts`

```typescript
async create(request: LeaveRequest) {
  // Insert leave request
  const { data } = await supabase
    .from('leave_requests')
    .insert({...})
    .select()
    .single()

  // Send notification to configured recipients
  await fetch('/api/notifications/send', {
    method: 'POST',
    body: JSON.stringify({
      table: 'leave_request_notifications',
      employeeId: request.employee_id,
      requestId: data.id,
      title: 'New Leave Request from {name}',
      message: '{name} has submitted a leave request.',
      requesterName: name,
      targetGroup: 'leave_request'  // Maps to workflow_configs.request_type='leave'
    })
  })
}
```

### 3. Notification API Route

**File:** `src/app/api/notifications/send/route.ts`

**Process:**
1. Receive notification request from browser
2. Query `workflow_configs` for matching `request_type`
3. Parse `notify_on_submit` array of role slugs
4. For each role slug, resolve to user IDs:
   - `"direct_manager"` → `employee.manager_id` → lookup `user_roles`
   - `"admin"` → Query `user_roles WHERE role='admin'`
   - `"ed"` → Query `user_roles WHERE role='ed'`
   - etc.
5. Insert notification rows in `leave_request_notifications`
6. Send push notifications (Web Push API)
7. Send emails (Resend API)

**Code:**
```typescript
export async function POST(req: NextRequest) {
  const { table, employeeId, requestId, targetGroup } = await req.json()
  
  // Map targetGroup to request_type
  const resolvedRequestType = requestTypeAlias[targetGroup] ?? targetGroup  // 'leave_request' → 'leave'
  
  // Query workflow config
  const { data: wfConfig } = await admin
    .from('workflow_configs')
    .select('notify_on_submit')
    .eq('request_type', resolvedRequestType)
    .eq('is_active', true)
    .maybeSingle()
  
  // Parse notify_on_submit
  let slugs: string[] = []
  if (typeof wfConfig?.notify_on_submit === 'string') {
    slugs = wfConfig.notify_on_submit.split(',').map(s => s.trim()).filter(Boolean)
  } else if (Array.isArray(wfConfig?.notify_on_submit)) {
    slugs = wfConfig.notify_on_submit as string[]
  }
  
  // Resolve each slug to user IDs
  const recipientUserIds = new Set<string>()
  for (const slug of slugs) {
    const ids = await resolveRoleSlug(slug, admin, emp)  // Returns user_id[]
    ids.forEach(id => recipientUserIds.add(id))
  }
  
  // Insert notifications + send emails/push
  const rows = [...recipientUserIds].map(userId => ({
    recipient_user_id: userId,
    type: 'new_request',
    title: title.replace('{name}', name),
    message: message.replace('{name}', name),
    leave_request_id: requestId,
    requester_name: name
  }))
  
  await admin.from(table).insert(rows)
  
  // Send push + email (async, fire-and-forget)
  sendPushToUsers([...recipientUserIds], { ... }).catch(() => {})
  // ... send emails via Resend API ...
}
```

### 4. Role Slug Resolution

**Function:** `resolveRoleSlug(slug, admin, emp)`

Maps role slugs to user IDs:

```typescript
async function resolveRoleSlug(
  slug: string,           // "direct_manager", "admin", "ed", etc.
  admin: AdminClient,     // Service-role Supabase client
  emp: { manager_id?: string | null } | null
): Promise<string[]> {
  const ids: string[] = []

  if (slug === 'direct_manager') {
    // Get employee's manager → lookup user_roles
    if (emp?.manager_id) {
      const { data } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('employee_id', emp.manager_id)
        .maybeSingle()
      if (data?.user_id) ids.push(data.user_id)
    }
    // Fallback: all HR users
    if (ids.length === 0) {
      const { data } = await admin.from('user_roles').select('user_id').eq('role', 'hr')
      for (const u of data ?? []) if (u.user_id) ids.push(u.user_id)
    }
    return ids
  }

  if (slug === 'admin') {
    // Get all admin-role users
    const { data } = await admin.from('user_roles').select('user_id').eq('role', 'admin')
    for (const u of data ?? []) if (u.user_id) ids.push(u.user_id)
    return ids
  }

  // ... similar for 'ed', 'hr', 'finance_dept', etc. ...

  return ids
}
```

### 5. Notification Persistence

**Table:** `leave_request_notifications`

```sql
recipient_user_id TEXT NOT NULL          -- Who receives the notification
type TEXT NOT NULL DEFAULT 'new_request' -- 'new_request', 'approved', 'rejected', etc.
title TEXT NOT NULL                      -- "New Leave Request from Juan dela Cruz"
message TEXT NOT NULL                    -- "Juan dela Cruz has submitted a leave request."
leave_request_id UUID NOT NULL           -- Link back to leave_requests table
requester_name TEXT NOT NULL             -- Employee's full name
created_at TIMESTAMPTZ DEFAULT NOW()

-- Each leave request can have multiple rows (one per recipient)
-- e.g., Row 1: Manager receives, Row 2: Admin receives
```

### 6. User Interface (Workflow Settings)

**File:** `src/app/(dashboard)/admin/system-config/workflow-settings/page.tsx`

**Features:**
- List all request types (leave, travel, equipment, etc.)
- For each type, allow editing:
  - Display name & description
  - Who gets notified on submit (checkboxes)
  - Who gets notified on decision (checkboxes)
  - Approval workflow steps (drag-reorder, add/remove)
  - Active/Inactive toggle
- Save changes via API route

**Supported Role Slugs (Checkboxes):**
- ✅ Direct Manager
- ✅ Executive Director (ED)
- ✅ All Admin-role Users
- ✅ All HR-role Users
- ✅ Finance Department (all employees)
- ✅ Administration Department (all employees)
- ✅ Admin Department Manager

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE SUBMITS LEAVE                       │
└────────────────────────────┬──────────────────────────────────────┘
                             ↓
                ┌────────────────────────────┐
                │ leaveRequest.service.create│
                └────────────┬───────────────┘
                             ↓
              ┌──────────────────────────────┐
              │ POST /api/notifications/send │
              └────────────┬─────────────────┘
                           ↓
         ┌─────────────────────────────────────────┐
         │ Query workflow_configs WHERE request_type='leave' │
         └────────────┬──────────────────────────────┘
                      ↓
    ┌─────────────────────────────────────────────┐
    │ Read: notify_on_submit=["direct_manager","admin"]  │
    └────────────┬────────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │ Resolve role slugs → user_ids              │
    │ • "direct_manager" → emp.manager_id → uid  │
    │ • "admin" → SELECT FROM user_roles WHERE.. │
    └────────────┬───────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │ Insert leave_request_notifications rows    │
    │ (one row per recipient)                    │
    └────────────┬───────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │ Send Push Notifications (Web Push API)     │
    │ Send Emails (Resend API)                   │
    └────────────┬───────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │ MANAGER + ADMIN both receive:              │
    │ • 🔔 System notification bell               │
    │ • 📧 Email with leave details               │
    └────────────────────────────────────────────┘
```

---

## The Fix Applied

### Before
```javascript
// Hardcoded fallback when no workflow_configs exist
const recipientUserIds = new Set(['manager_id'])  // Only manager
```

### After
```javascript
// Database-driven configuration
const wfConfig = await admin
  .from('workflow_configs')
  .select('notify_on_submit')
  .eq('request_type', 'leave')
  .maybeSingle()

// notify_on_submit = ["direct_manager", "admin"]
// Now includes both!
```

### Database Change
```sql
UPDATE workflow_configs
SET notify_on_submit = '["direct_manager", "admin"]'::jsonb
WHERE request_type = 'leave' AND is_active = true;
```

---

## Verification Checklist

### ✅ Configuration Verification
```sql
-- Check current leave workflow config
SELECT 
  request_type,
  notify_on_submit,
  notify_on_decision,
  is_active
FROM workflow_configs
WHERE request_type = 'leave';

-- Should show:
-- ┌──────────┬─────────────────────────────┬────────────────┬──────────┐
-- │ leave    │ ["direct_manager", "admin"] │ ["admin"]      │ true     │
-- └──────────┴─────────────────────────────┴────────────────┴──────────┘
```

### ✅ Admin Users Verification
```sql
-- Check admin users exist and have email
SELECT e.id, e.first_name, e.last_name, e.email
FROM employees e
JOIN user_roles ur ON e.id = ur.employee_id
WHERE ur.role = 'admin'
LIMIT 10;

-- Should return at least one admin with an email address
```

### ✅ Recent Leave Request Verification
```sql
-- Check if recent leave request has notifications for admin
SELECT lr.id, lr.employee_id, COUNT(lrn.id) as notification_count
FROM leave_requests lr
LEFT JOIN leave_request_notifications lrn ON lr.id = lrn.leave_request_id
WHERE lr.created_at > NOW() - INTERVAL '1 day'
GROUP BY lr.id, lr.employee_id
ORDER BY lr.created_at DESC
LIMIT 5;

-- Should show notification_count >= 2 (one for manager, one+ for admins)
```

---

## Key Benefits

1. **🎛️ UI-Configurable** - No code changes needed, manage via admin panel
2. **🔄 Consistent** - Same pattern used for ALL request types
3. **🚀 Extensible** - Add new role slugs without touching code
4. **📊 Database-Driven** - Single source of truth
5. **🔐 Secure** - Uses service-role key, respects RLS
6. **📧 Multi-Channel** - Notifications via bell + email

---

## Files Modified

```
✅ supabase/workflow-configs-table.sql
   └─ Updated seed data for 'leave' to include "admin"

✅ supabase/fix-leave-notification-config.sql
   └─ Migration to fix existing database (run in SQL Editor)

✅ LEAVE_NOTIFICATION_FIX.md
   └─ Technical documentation of the issue and fix

✅ LEAVE_NOTIFICATIONS_SETUP.md
   └─ Step-by-step setup guide for admins

✅ scripts/verify-leave-notifications.js
   └─ Verification script to validate configuration

✅ scripts/setup-leave-notifications.js
   └─ Setup and diagnostic script
```

---

## Testing Procedure

### 1. Apply Database Fix
Run in Supabase SQL Editor:
```sql
UPDATE workflow_configs
SET notify_on_submit = '["direct_manager", "admin"]'::jsonb
WHERE request_type = 'leave' AND is_active = true;
```

### 2. Verify via Admin UI
- Go to `/admin/system-config/workflow-settings`
- Open "Leave Request" card
- Check: "Direct Manager" ✅ and "All Admin-role Users" ✅

### 3. Test Submission
- Log in as employee
- Submit new leave request
- Expected: Manager AND admins receive notification (bell + email)

### 4. Monitor Server Logs
Look for in `/api/notifications/send`:
```
[notifications/send] Workflow config for 'leave': notify_on_submit=direct_manager, admin
[notifications/send] Preparing to send emails to 3 recipient(s)
[notifications/send] Resolved 3 email address(es) from 3 recipient(s)
[notifications/send] Batch 1: 3 sent, 0 failed
```

---

## Deployment Notes

### For Existing Installations
1. Run SQL migration: `fix-leave-notification-config.sql`
2. Verify configuration via Admin UI
3. Test with new leave submission

### For New Installations
- The updated `workflow-configs-table.sql` already includes the correct seed data
- No manual fix needed, just deploy and use

### For Custom Setups
- If you've customized role slugs, adjust `notify_on_submit` array accordingly
- Remember to keep "admin" included for leave request notifications

---

## Questions & Answers

**Q: Why doesn't the config just use hardcoded recipients?**
A: Because different organizations have different approval chains. Some want ED approval, others want admin, some want finance. The database-driven approach is flexible.

**Q: Can I customize this per department?**
A: Not yet, but it's possible to extend with a department filter. Currently it's global per request type.

**Q: What if I don't want to notify admins?**
A: Go to Workflow Settings and uncheck "All Admin-role Users" in "Notify on Submit". No code change needed.

**Q: How do I add a new notification recipient group?**
A: Add a new role slug in `resolveRoleSlug()` function in `/api/notifications/send/route.ts`, then you can select it in Workflow Settings.

---

## References

- **Main API:** `src/app/api/notifications/send/route.ts`
- **Leave Service:** `src/services/leaveRequest.service.ts`
- **Workflow Service:** `src/services/workflowConfig.service.ts`
- **Admin UI:** `src/app/(dashboard)/admin/system-config/workflow-settings/page.tsx`
- **Notification Helper:** `src/services/requestNotification.helper.ts`
- **Email Templates:** `src/lib/emailTemplates.ts`
