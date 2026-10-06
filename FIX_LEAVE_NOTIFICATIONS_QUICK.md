# IMMEDIATE ACTION: Fix Leave Request Notifications

## 🚨 The Issue
Mr. Ralf Dugan filed a leave request but **admin users did NOT receive notifications** (neither bell nor email).

## ✅ Quick Fix (5 minutes)

### Option A: Via Admin UI (Recommended)

1. **Log in to adminsystem.iboninternational.org**

2. **Go to:**
   ```
   Admin → System Configuration → Workflow Settings
   ```

3. **Find the "Leave Request" card** (showing "Standard employee leave requests...")

4. **Click to expand the card**

5. **Under "Notify on Request Submit", ensure BOTH are checked:**
   - ✅ Direct Manager
   - ✅ All Admin-role Users
   
   If "All Admin-role Users" is NOT checked → Click it to enable

6. **Under "Notify on Decision", ensure this is checked:**
   - ✅ All Admin-role Users

7. **Click "Save" button**
   - Should show: ✅ "Workflow configuration saved successfully"

8. **Done!** Next leave requests will notify both manager and admin

---

### Option B: Via Database (If UI doesn't work)

Open **Supabase Dashboard** → **SQL Editor** and run:

```sql
UPDATE workflow_configs
SET 
  notify_on_submit = '["direct_manager", "admin"]'::jsonb,
  notify_on_decision = '["admin"]'::jsonb
WHERE request_type = 'leave';

-- Verify the fix
SELECT request_type, notify_on_submit, notify_on_decision, is_active
FROM workflow_configs
WHERE request_type = 'leave';
```

Should output:
```
leave | ["direct_manager", "admin"] | ["admin"] | true
```

---

## 🧪 Verify the Fix

### Test 1: Check Configuration
```sql
SELECT notify_on_submit FROM workflow_configs WHERE request_type = 'leave';
-- Should show: ["direct_manager", "admin"]
```

### Test 2: Submit a Test Leave Request
1. Log in as a regular employee (not admin)
2. Go to: **My Info → Leave Requests → Submit New Request**
3. Fill in details and submit
4. Expected results:
   - ✅ Employee's manager receives notification (bell 🔔 + email 📧)
   - ✅ All admin users receive notification (bell 🔔 + email 📧)

### Test 3: Check Notifications Sent
```sql
-- Count notifications sent for your test request
SELECT COUNT(*) as notification_count
FROM leave_request_notifications
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Should show: 2 or more (1+ per recipient)
```

---

## ✨ What Changes

### Before
Leave requests only notified: **Direct Manager** ❌ Admin not notified

### After
Leave requests notify: **Direct Manager** ✅ **Admin Users** ✅

---

## 📋 Who Gets Notified Now

When an employee submits a leave request:

1. **Their Direct Supervisor/Manager**
   - Gets 🔔 notification bell
   - Gets 📧 email with details
   - Can approve or reject

2. **All Admin Users** (NEW!)
   - Get 🔔 notification bell
   - Get 📧 email with details
   - Can also approve or reject

---

## 🐛 If It Still Doesn't Work

### Check 1: Is employee's manager set?
```sql
SELECT manager_id FROM employees WHERE id = '[employee_id]';
-- Should NOT be NULL
```

### Check 2: Does manager have email?
```sql
SELECT e.email FROM employees e
WHERE e.id = '[manager_id]';
-- Should have an email address
```

### Check 3: Are there admin users?
```sql
SELECT COUNT(*) FROM user_roles WHERE role = 'admin';
-- Should be >= 1
```

### Check 4: Do admins have email?
```sql
SELECT e.email FROM employees e
JOIN user_roles ur ON e.id = ur.employee_id
WHERE ur.role = 'admin';
-- All should have email addresses
```

### Check 5: Is email service working?
In `.env.local`, check:
```
RESEND_API_KEY=re_...
```
Must be set and valid

---

## 📧 Email Subject to Expect

```
New Leave Request from [Employee Name]
```

Email should include:
- Leave Type
- Start Date
- End Date
- Duration (days)
- Reason (if provided)
- Link to review request

---

## 🔄 This Works for ALL Request Types

The same system manages notifications for:

| Request Type | Table | Notifies |
|---|---|---|
| Leave | leave_request_notifications | Manager + Admin ✅ |
| Travel | travel_request_notifications | ED + Admin + Finance |
| Equipment | equipment_request_notifications | Admin Department |
| Supply | supply_request_notifications | Admin Department |
| Publication | publication_request_notifications | Admin Department |
| Leave Credit | leave_credit_notifications | ED + Admin |

All can be configured via the same **Workflow Settings** UI.

---

## 📞 Need Help?

- **Config not updating?** Clear browser cache and reload
- **No email arriving?** Check RESEND_API_KEY in .env.local
- **Still not working?** Check server logs for `[notifications/send]` errors

---

## ✅ Summary

**The Fix:** Update `workflow_configs` to include "admin" in `notify_on_submit`

**Time to Apply:** 2-5 minutes

**Where:** `/admin/system-config/workflow-settings` → Leave Request card

**Result:** Admins now get notifications for ALL leave requests via bell + email
