# Leave Request Notification Fix

## Issue
Mr. Ralf Dugan filed a vacation leave request, but:
- ❌ Admin users did NOT receive notification via system notification bell
- ❌ Admin users did NOT receive email notification
- ✅ Only the direct supervisor would have been notified (if configured)

## Root Cause
The `workflow_configs` table had the "leave" request type configured to only notify `["direct_manager"]`, not including `["admin"]`.

This meant:
1. Supervisors are notified ✓
2. **Admins are NOT notified** ✗
3. No admin can easily approve/reject leave requests

## Solution Overview
The fix has three parts:

### 1. Database Configuration Update
The workflow configuration for "leave" requests now includes BOTH notification recipients:

**Before:**
```json
{
  "request_type": "leave",
  "notify_on_submit": ["direct_manager"],      // Only manager
  "notify_on_decision": []                     // No decision notification
}
```

**After:**
```json
{
  "request_type": "leave",
  "notify_on_submit": ["direct_manager", "admin"],  // Manager AND Admin
  "notify_on_decision": ["admin"]                    // Admin gets decision info
}
```

### 2. Files Modified
- **`supabase/workflow-configs-table.sql`** - Updated seed data for future deployments
- **`supabase/fix-leave-notification-config.sql`** - Migration to fix existing database

### 3. Notification Flow
When an employee submits a leave request:

```
Employee submits leave request
         ↓
leaveRequest.service.create() → /api/notifications/send
         ↓
         ├─→ Looks up workflow_configs for request_type='leave'
         ├─→ Reads notify_on_submit = ["direct_manager", "admin"]
         ├─→ Resolves each recipient group:
         │   ├─ "direct_manager" → Employee's manager_id → user_id
         │   └─ "admin" → All users with role='admin'
         ├─→ Creates notifications in leave_request_notifications table
         ├─→ Sends system bell notifications via sendPushToUsers()
         └─→ Sends emails via Resend API

Manager receives:
  • System notification bell 🔔
  • Email notification 📧

Admin receives:
  • System notification bell 🔔
  • Email notification 📧
```

## Implementation Steps

### Step 1: Apply the Migration (Current Database)
```sql
-- Run this in Supabase SQL Editor to fix the existing database

UPDATE workflow_configs
SET 
  notify_on_submit = '["direct_manager", "admin"]'::jsonb,
  notify_on_decision = '["admin"]'::jsonb,
  description = 'Standard employee leave requests (vacation, sick, etc.). Notifies direct manager and admin users.'
WHERE request_type = 'leave'
  AND is_active = true;

-- Verify
SELECT 
  request_type,
  display_name,
  notify_on_submit,
  notify_on_decision,
  is_active
FROM workflow_configs
WHERE request_type = 'leave';
```

### Step 2: Verify Configuration via Admin UI
1. Go to: **Admin → System Configuration → Workflow Settings**
2. Find the **"Leave Request"** card
3. Verify:
   - ✅ Status is "Active"
   - ✅ "Notify on submit" includes both:
     - ✅ "Direct Manager"
     - ✅ "All Admin-role Users"

### Step 3: Test with New Leave Request
1. Have an employee submit a new leave request
2. Verify notifications are sent to:
   - ✅ Their direct supervisor (via bell + email)
   - ✅ All admin users (via bell + email)

### Step 4: Verify Existing Configuration
Run the verification script:
```bash
node scripts/verify-leave-notifications.js
```

This checks:
- ✅ workflow_configs is properly set up
- ✅ Admin users exist in the system
- ✅ Email service is configured
- ✅ Recent leave requests have notifications

## Code Architecture

### Notification Flow (Detailed)
1. **Employee submits request** → `leaveRequest.service.create()`
2. **Browser calls** → `POST /api/notifications/send`
3. **Server API route** (`src/app/api/notifications/send/route.ts`):
   - Validates request
   - Queries `workflow_configs` for `request_type='leave'`
   - Parses `notify_on_submit` array
   - Resolves each recipient slug to user IDs:
     - `"direct_manager"` → Query `employees.manager_id` → lookup `user_roles`
     - `"admin"` → Query all `user_roles WHERE role='admin'`
   - Inserts notification rows into `leave_request_notifications`
   - Sends push notifications via Web Push API
   - Sends emails via Resend API

### Related Files
- **Config Storage:** `workflow_configs` table
- **Config UI:** `src/app/(dashboard)/admin/system-config/workflow-settings/page.tsx`
- **Config Service:** `src/services/workflowConfig.service.ts`
- **Config API:** `src/app/api/admin/workflow-configs/route.ts`
- **Notification API:** `src/app/api/notifications/send/route.ts`
- **Notification Helper:** `src/services/requestNotification.helper.ts`
- **Leave Service:** `src/services/leaveRequest.service.ts`

## Configurable via UI

This configuration is **NOT hardcoded**. It's managed entirely via the Admin UI:

1. **Workflow Settings Page:** `/admin/system-config/workflow-settings`
2. Users with `admin`, `hr`, or `ed` roles can modify:
   - Who gets notified on submit
   - Who gets notified on decision
   - Approval workflow steps
   - Timeouts and escalations
3. Changes are saved to `workflow_configs` table
4. Changes take effect immediately for new requests

## Ensuring This Works for All Request Types

The same pattern applies to ALL request types:

| Request Type | Table | Recipients |
|---|---|---|
| **Leave** | `leave_request_notifications` | `["direct_manager", "admin"]` |
| **Leave Credit** | `leave_credit_notifications` | `["admin_dept", "ed"]` |
| **Travel** | `travel_request_notifications` | `["ed", "admin", "finance_dept"]` |
| **Publication** | `publication_request_notifications` | `["admin_dept_manager"]` |
| **Equipment** | `equipment_request_notifications` | `["admin_dept_manager"]` |
| **Supply** | `supply_request_notifications` | `["admin_dept_manager"]` |

Each can be customized via Workflow Settings UI without code changes.

## Troubleshooting

### No notifications appear
1. Check workflow_configs is active: `SELECT * FROM workflow_configs WHERE request_type='leave' AND is_active=true`
2. Verify admin users exist: `SELECT COUNT(*) FROM user_roles WHERE role='admin'`
3. Check RESEND_API_KEY in `.env.local`
4. Look for errors in server logs: `[notifications/send]`

### Only manager is notified, not admins
- Check `notify_on_submit` array includes `"admin"`
- Verify admin users have email addresses configured
- Check `RESEND_API_KEY` is valid

### Admins have no email
- Check `employees` table: admin employee records must have `email` field populated
- Check `user_roles` links admin auth users to employee records

## Future Enhancements

The notification system is extensible:
- Add more role slugs: `finance_manager`, `hr_dept`, etc.
- Add conditional logic: "Notify admin only if amount > $5000"
- Add notification preferences: Let users opt-out of certain notifications
- Add scheduling: "Delay notification by 1 hour"

All without code changes — just database config via the UI!

## References

- Workflow Configs Schema: `supabase/workflow-configs-table.sql`
- Notification Send Logic: `src/app/api/notifications/send/route.ts`
- Workflow Settings UI: `src/app/(dashboard)/admin/system-config/workflow-settings/page.tsx`
- Leave Request Service: `src/services/leaveRequest.service.ts`
