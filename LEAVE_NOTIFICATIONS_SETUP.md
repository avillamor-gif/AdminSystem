# Setup Leave Request Notifications - Step by Step

## Quick Summary
Mr. Ralf Dugan's leave request notification issue is fixed by ensuring the **Workflow Settings** (Admin UI) is properly configured to notify BOTH supervisors AND admins.

## The Fix in 3 Steps

### Step 1: Access Workflow Settings
1. Log in as Admin
2. Navigate to: **Admin → System Configuration → Workflow Settings**
3. Find the **"Leave Request"** card (should say "Standard employee leave requests...")

### Step 2: Verify Configuration
Look for the "Leave Request" card and check:

**Section: "Notify on Request Submit"**
- ✅ Should be checked: **"Direct Manager"**
- ✅ Should be checked: **"All Admin-role Users"**
- ⚠️ If "All Admin-role Users" is NOT checked, click it to enable

**Section: "Notify on Decision"**
- ✅ Should be checked: **"All Admin-role Users"**
- This ensures admins who made the decision are confirmed

### Step 3: Save & Test
1. If you made changes, click **"Save"** button
2. You should see: ✅ "Workflow configuration saved successfully"
3. Test by having an employee submit a new leave request
4. Verify both supervisor and admins receive:
   - 🔔 System notification bell (top-right corner)
   - 📧 Email notification

---

## Detailed Setup Instructions

### Via Admin UI (Recommended)

**Access:**
```
Home → Admin → System Configuration → Workflow Settings
```

**For Leave Request Card:**

1. **Find "Leave Request" card**
   - Look for: "Standard employee leave requests (vacation, sick, etc.)"
   - Click the card to expand it

2. **Configure "Notify on Request Submit"**
   - Check ✅ "Direct Manager" (supervisor of the employee)
   - Check ✅ "All Admin-role Users" (HR/Admin team)
   - Uncheck other roles that should NOT be notified

3. **Configure "Notify on Decision"** (Optional but recommended)
   - Check ✅ "All Admin-role Users"
   - This CC's admins on the approval/rejection decision

4. **Configure Approval Steps** (Usually already set)
   - Level 1: "Direct Manager" (timeout: 3 days)
   - Step should escalate to "HR" if manager doesn't approve

5. **Click "Save"**
   - Should show green toast: "Workflow configuration saved successfully"

---

### Via Database (If UI is not accessible)

**Open Supabase SQL Editor** and run:

```sql
UPDATE workflow_configs
SET 
  notify_on_submit = '["direct_manager", "admin"]'::jsonb,
  notify_on_decision = '["admin"]'::jsonb,
  description = 'Standard employee leave requests (vacation, sick, etc.). Notifies direct manager and admin users.',
  is_active = true
WHERE request_type = 'leave';

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

Expected output:
```
request_type | display_name   | notify_on_submit           | notify_on_decision | is_active
─────────────┼────────────────┼────────────────────────────┼────────────────────┼──────────
leave        | Leave Request  | ["direct_manager", "admin"]| ["admin"]          | true
```

---

## Verification Checklist

### ✅ Pre-Flight Checks

- [ ] Navigate to `/admin/system-config/workflow-settings`
- [ ] "Leave Request" card is visible
- [ ] Card shows "Notify on submit: Direct Manager, All Admin-role Users"
- [ ] Card shows "Active" badge (not "Inactive")

### ✅ Test Leave Request Submission

1. **Log in as regular employee** (not admin)
2. Go to: **My Info → Leave Requests → Submit New Request**
3. Fill out:
   - Leave Type: Vacation
   - Dates: 2-3 days from today
   - Reason: "Test notification"
4. Click **"Submit"**

### ✅ Verify Notifications

**For Manager/Supervisor:**
1. Log in as the employee's direct manager
2. Check top-right corner for 🔔 notification bell
3. Should show: "New Leave Request from [Employee Name]"
4. Check email inbox for: "New Leave Request from [Employee Name]"

**For Admin:**
1. Log in as an admin user
2. Check top-right corner for 🔔 notification bell
3. Should show: "New Leave Request from [Employee Name]"
4. Check email inbox for: "New Leave Request from [Employee Name]"

**Expected Email Subject:**
```
New Leave Request from [Employee Name]
```

**Expected Email Contains:**
- Leave Type (Vacation, Sick, etc.)
- Start Date
- End Date
- Duration (number of days)
- Reason (if provided)
- "Review Request" button linking to `/admin/leave-management`

---

## Troubleshooting

### Problem: Notifications not appearing

**Check 1: Is the employee's manager configured?**
```sql
SELECT id, first_name, last_name, manager_id
FROM employees
WHERE id = '[employee_id]';
-- manager_id should NOT be NULL
```

**Check 2: Does the manager have a user account?**
```sql
SELECT ur.user_id, ur.role, e.first_name, e.last_name
FROM user_roles ur
JOIN employees e ON ur.employee_id = e.id
WHERE e.id = '[manager_id]';
-- Should return one row with user_id and role='manager' or similar
```

**Check 3: Are there any admin users?**
```sql
SELECT COUNT(*) as admin_count
FROM user_roles
WHERE role = 'admin';
-- Should be >= 1
```

**Check 4: Is email service configured?**
- In `.env.local`: Check `RESEND_API_KEY` is set
- Run: `grep RESEND_API_KEY .env.local`
- Should show: `RESEND_API_KEY=re_...`

**Check 5: Are admin email addresses populated?**
```sql
SELECT e.id, e.first_name, e.last_name, e.email
FROM employees e
JOIN user_roles ur ON e.id = ur.employee_id
WHERE ur.role = 'admin'
LIMIT 5;
-- All admins should have email addresses
```

### Problem: Only manager is notified, not admins

**Cause:** `notify_on_submit` doesn't include `"admin"`

**Fix:**
1. Go to `/admin/system-config/workflow-settings`
2. Open "Leave Request" card
3. Under "Notify on Request Submit", check ✅ "All Admin-role Users"
4. Click "Save"

### Problem: Manager is notified but has no manager_id

**This means:** You might have a multi-level approval setup. Check:
1. The employee should have a `manager_id` pointing to their direct supervisor
2. That manager should be in the `user_roles` table

**Fix:**
```sql
-- Assign manager to employee
UPDATE employees
SET manager_id = '[manager_employee_id]'
WHERE id = '[employee_id]';
```

### Problem: No admin users in the system

**Cause:** No users have been assigned the "admin" role

**Fix:**
1. Go to: **Admin → User Access & Security → User Management**
2. Select a user (e.g., HR manager)
3. Assign role: "Admin"
4. Save
5. That user will now receive all admin notifications

---

## How It Works

### The Notification Flow

```
Employee submits leave request
         ↓
[leaveRequest.service.create()]
         ↓
POST /api/notifications/send
         ↓
Query workflow_configs WHERE request_type='leave'
         ↓
Read notify_on_submit = ["direct_manager", "admin"]
         ↓
Resolve recipients:
  • "direct_manager" → employee.manager_id → user_id
  • "admin" → SELECT user_id FROM user_roles WHERE role='admin'
         ↓
Insert rows in leave_request_notifications (one per recipient)
         ↓
Send 🔔 push notification (Web Push API)
         ↓
Send 📧 email notification (Resend API)
         ↓
Manager receives both 🔔 and 📧
Admin   receives both 🔔 and 📧
```

### Configuration is Database-Driven

- **No hardcoding** — all notification logic reads from `workflow_configs` table
- **UI-editable** — admins can change who gets notified without code/deploy
- **Per-request-type** — each type (leave, travel, equipment, etc.) has its own config
- **Extensible** — add new role slugs or notification conditions anytime

---

## For All Request Types

The same system works for other request types:

| Request Type | Typical Recipients | Config Location |
|---|---|---|
| **Leave** | Manager + Admin | Workflow Settings → Leave Request |
| **Travel** | ED + Admin + Finance | Workflow Settings → Travel Request |
| **Equipment** | Admin Dept Manager | Workflow Settings → Office Equipment Request |
| **Supply** | Admin Dept Manager | Workflow Settings → Office Supply Request |
| **Publication** | Admin Dept Manager | Workflow Settings → Publication Request |
| **Leave Credit** | ED + Admin | Workflow Settings → Leave Credit Request |

All follow the same pattern: user submits → configured recipients get notified → can approve/reject.

---

## Next Steps

1. ✅ Access Workflow Settings: `/admin/system-config/workflow-settings`
2. ✅ Check "Leave Request" is configured with manager + admin
3. ✅ Test with a new leave submission
4. ✅ Verify both manager and admin receive notifications
5. ✅ Bookmark `/admin/system-config/workflow-settings` for future adjustments

---

## Questions?

- **How to change who gets notified?** → Workflow Settings UI, no code change needed
- **Why isn't my email coming through?** → Check RESEND_API_KEY in `.env.local`
- **Can I add more notification recipients?** → Yes! The system supports any role slug
- **Does this affect other request types?** → No, each type has its own config
