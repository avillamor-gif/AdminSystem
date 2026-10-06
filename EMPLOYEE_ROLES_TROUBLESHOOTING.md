# Employee Roles Troubleshooting Checklist

## Issue: Cannot Save Role Assignment

### ✓ Step 1: Check Employee Status
- [ ] Open Employee Roles page (Admin → User Access & Security → Employee Roles)
- [ ] Find the employee in the list
- [ ] Check the Status column:
  - **⚠️ Not Onboarded** → Employee needs auth account first (go to Step 2)
  - **✓ Assigned** → Role is already assigned
  - **○ No Role** → Employee is ready, select a role

### ✓ Step 2: Onboard Employee (if needed)
- [ ] Go to Admin → Employee Data → Employees
- [ ] Find the employee
- [ ] Click "Create User" or "Setup Auth" button
- [ ] Set temporary password
- [ ] Employee receives email with login credentials
- [ ] Return to Employee Roles page (wait ~30 seconds for refresh)
- [ ] Status should now show ○ No Role

### ✓ Step 3: Assign Role
- [ ] Employee status shows ○ No Role (not ⚠️ Not Onboarded)
- [ ] Click the role dropdown
- [ ] Select desired role (Admin, Manager, HR Manager, Employee, etc.)
- [ ] Dropdown should show the role highlighted in amber
- [ ] Click "Save Changes" button
- [ ] Wait for "Updated roles for X employee(s)" success message

### ✓ Step 4: Verify Role Applied
- [ ] Employee logs out of the system
- [ ] Employee logs back in
- [ ] New permissions should be active

---

## Issue: "No existing auth user found for X. Please create user first via employee setup."

**Meaning:** The employee doesn't have an auth account yet.

### Solution:
1. Go to Employee Data → Employees
2. Find the employee
3. Click the button to create their auth account
4. Wait for confirmation
5. Return to Employee Roles page
6. Employee should now show ○ No Role (no longer ⚠️ Not Onboarded)
7. Assign the role and save

---

## Issue: "Role X not found"

**Meaning:** The role doesn't exist in the RBAC system.

### Solution:
1. Go to Admin → User Access & Security → RBAC
2. Verify the role exists in the list
3. If not, create it:
   - Click "Add New Role"
   - Enter role name (e.g., "Manager", "HR Manager", "Supervisor")
   - Configure permissions
   - Click "Create Role"
4. Return to Employee Roles page
5. Try the role assignment again

---

## Issue: Role Dropdown is Disabled (Grayed Out)

**Meaning:** The employee is not onboarded yet (no auth account).

### Solution:
1. See "⚠️ Not Onboarded" badge
2. Follow "Onboard Employee" steps (Step 2 above)
3. Wait ~30 seconds
4. Refresh the page
5. Dropdown should now be enabled

---

## Issue: Employee Can't See New Permissions After Role Change

**Meaning:** Employee needs to log out and log back in for permissions to refresh.

### Solution:
1. Ask the employee to log out
2. Employee closes browser tab or clicks "Sign Out"
3. Employee logs back in with same credentials
4. Permissions should now be updated

---

## Issue: Bulk Actions Not Working

**Meaning:** Selected employees may not all be onboarded.

### Solution:
1. Only use bulk actions on employees with ✓ Assigned or ○ No Role status
2. For ⚠️ Not Onboarded employees, onboard them first
3. Then use bulk actions

---

## Issue: Search Not Finding Employee

### Troubleshooting:
1. Check spelling of name/email/ID
2. Try searching by different field:
   - Full name: "John Smith"
   - First name: "John"
   - Email: "john@company.com"
   - Employee ID: "EMP-123"
3. Try department filter:
   - Select specific department instead of "All Departments"
4. Clear search box and try again

---

## Issue: Employee Appears Twice in List

**Meaning:** Usually indicates data integrity issue (duplicate records).

### Solution:
1. Note the employee ID
2. Go to Admin → Employee Data → Employees
3. Check if there are indeed duplicate records
4. Delete the duplicate if confirmed
5. Return to Employee Roles page

---

## Issue: "Failed to update roles" (Generic Error)

### Debugging Steps:
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Click "Save Changes"
4. Find the POST request: `/api/admin/employee-roles`
5. Click on it and view Response tab
6. Look for error details in the JSON:
   ```json
   {
     "success": false,
     "errors": ["Error message here"]
   }
   ```
7. Take a screenshot and report the error message

### Common Error Messages:
| Error | Cause | Solution |
|-------|-------|----------|
| "No existing auth user found" | Employee not onboarded | Follow onboarding steps |
| "Role X not found" | Role doesn't exist | Create role in RBAC |
| "Employee X not found" | Employee record missing | Check Employee Data |
| "Missing employeeId or roleId" | Form incomplete | Select both employee and role |
| "Failed to fetch roles" | Database error | Contact support |

---

## Issue: Page Shows "Loading..." Forever

### Troubleshooting:
1. Refresh the page (F5 or Cmd+R)
2. Check browser console (F12 → Console tab) for errors
3. Check network tab (F12 → Network tab) for failed requests
4. Verify you have permission: Admin → User Access & Security → RBAC
5. If still stuck, try in incognito mode (Cmd+Shift+P or Ctrl+Shift+P)
6. Clear browser cache if issue persists

---

## Issue: Some Employees Show Empty Department

**Meaning:** Employee record doesn't have department assigned.

### Solution:
1. Not an error - just means department not filled in
2. Can still assign role to employee
3. To fix, go to Employee Data → find employee → assign department

---

## Issue: Permissions Not Taking Effect After Role Change

### Troubleshooting Checklist:
- [ ] Employee logged out and back in?
- [ ] Role assignment shows as saved (no "Unsaved" badge)?
- [ ] Did you verify in RBAC that the role has the needed permissions?
- [ ] Is the role link in user_roles table correct? (Check database)

### How to Check Database:
1. Go to Supabase Dashboard
2. SQL Editor
3. Run:
   ```sql
   SELECT ur.*, r.name as role_name
   FROM user_roles ur
   LEFT JOIN roles r ON ur.role_id = r.id
   WHERE ur.employee_id = 'EMPLOYEE_UUID_HERE'
   ```
4. Verify `role_id` is set and `role_name` shows correctly

---

## Issue: Can't Access Employee Roles Page

### Troubleshooting:
- [ ] Are you logged in as admin?
- [ ] Do you have permission `admin.user_access.rbac.manage`?
- [ ] Navigate to: Admin → User Access & Security → Employee Roles
- [ ] If still no access, check your role permissions in RBAC page

### How to Grant Permission:
1. Go to Admin → User Access & Security → RBAC
2. Find your role
3. Click "Edit Role"
4. Check permissions for "User Access & Security" section
5. Enable permission for "Employee Roles" management
6. Click "Save"
7. Log out and back in

---

## Frequently Asked Questions

**Q: How many employees can I manage at once?**
A: The page loads all employees. For large databases (1000+ employees), page may be slow. Use search/filter to narrow down.

**Q: Can I change an employee's role later?**
A: Yes, just select a different role and save. The change takes effect after they log back in.

**Q: What's the default role when an employee is onboarded?**
A: "Employee" - all employees start with the basic employee role.

**Q: Can one employee have multiple roles?**
A: Not currently - each employee can have exactly one role. This is a database constraint.

**Q: What happens if I delete a role?**
A: Employees with that role will have `role_id = NULL`. They'll retain basic employee permissions. Reassign them to a different role.

**Q: How do I see what permissions a role has?**
A: Go to RBAC page → Click "Edit Role" → View the permissions list.

**Q: Can I customize permissions for a single employee?**
A: No - permissions are role-based. Customize the role instead, or create a new role for that employee.

---

## When to Contact Support

Contact your system administrator if:
- [ ] You see red error messages that match none of the above
- [ ] Database query returns no results
- [ ] Auth system is unresponsive
- [ ] Multiple employees are affected simultaneously
- [ ] You suspect data corruption (duplicate records, missing links)

---

## Success Checklist

After fixing the issue, verify:
- [ ] Employee shows correct status badge (not ⚠️ Not Onboarded)
- [ ] Role dropdown is enabled (not grayed out)
- [ ] Can select a role and click "Save Changes"
- [ ] See success message "Updated roles for X employee(s)"
- [ ] Employee logs out and back in
- [ ] New permissions are active

---

## Related Pages

- 📖 [EMPLOYEE_ROLES_SETUP_GUIDE.md](./EMPLOYEE_ROLES_SETUP_GUIDE.md) - Setup workflow
- 🔗 Admin → Employee Data → Employees - Onboard employees here
- 🔗 Admin → User Access & Security → RBAC - Define role permissions
- 🔗 Admin → User Access & Security → Employee Roles - Assign roles to employees
