# Difference: Edit Role Modal vs Employee-Roles Page

## Quick Comparison

| Aspect | Edit Role Modal (RBAC) | Employee-Roles Page |
|--------|------------------------|-------------------|
| **Location** | /admin/user-access-security/rbac | /admin/user-access-security/employee-roles |
| **What it manages** | Role Definitions | Employee Assignments |
| **Scope** | SYSTEM-WIDE (affects all users with role) | INDIVIDUAL (specific employees) |
| **What you edit** | Permissions in a role | Which employees get which roles |
| **Example** | "Add leave.approve to Consultant role" | "Assign John Doe to Consultant role" |

---

## In-Depth Explanation

### 1️⃣ EDIT ROLE MODAL (In RBAC Page)

**URL:** https://adminsystem.iboninternational.org/admin/user-access-security/rbac

**Purpose:** Define what a ROLE IS and what it can DO

**What You Configure:**
- ✅ Role Name (e.g., "Consultant")
- ✅ Role Description (e.g., "External consultant with limited access")
- ✅ Permissions assigned to the role (e.g., leave.apply, leave.view, leave.approve)
- ✅ Role Status (active/inactive)

**Impact:**
- When you modify a role's permissions, ALL users with that role are affected immediately
- Changes are system-wide, no deployment needed
- Example: Add "equipment.request" to Consultant role → ALL consultants can now request equipment

**Code Section:**
```typescript
// From src/app/(dashboard)/admin/user-access-security/rbac/page.tsx
<Modal open={!!editingRole} onClose={() => setEditingRole(null)}>
  <ModalHeader>Edit Role: {editingRole?.name}</ModalHeader>
  <ModalBody>
    <Input value={editName} /> {/* Edit role name */}
    <Input value={editDescription} /> {/* Edit description */}
    <PermissionPanel /> {/* Select/deselect permissions */}
  </ModalBody>
</Modal>
```

**Key Features:**
- System roles (Admin, HR Manager, Employee) have locked names (cannot be edited)
- Comprehensive permission selection panel
- Can toggle permissions on/off by category
- Changes persist to `roles` and `role_permissions` tables

---

### 2️⃣ EMPLOYEE-ROLES PAGE

**URL:** https://adminsystem.iboninternational.org/admin/user-access-security/employee-roles

**Purpose:** Assign roles TO SPECIFIC EMPLOYEES

**What You Configure:**
- ✅ Which employees get which roles
- ✅ Filter employees by department
- ✅ Search employees by name/email
- ✅ Batch update multiple employees at once
- ✅ Track unsaved changes

**Impact:**
- When you assign a role to an employee, that employee gets ALL permissions in that role
- Changes affect ONLY that specific employee
- Example: Assign "Consultant" role to John Doe → John gets all Consultant permissions

**Code Section:**
```typescript
// From src/app/(dashboard)/admin/user-access-security/employee-roles/page.tsx
<div>
  <Input 
    placeholder="Search employees..."
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
  />
  <Select
    value={selectedDept}
    onChange={e => setSelectedDept(e.target.value)}
  >
    {/* Filter by department */}
  </Select>
  
  {filteredEmployees.map(emp => (
    <Select
      value={assignments[emp.id]}
      onChange={role => handleRoleChange(emp.id, role)}
    >
      {/* Dropdown to select role for this employee */}
    </Select>
  ))}
  
  <Button onClick={handleSaveAll}>
    Save Changes ({unsavedChanges.size})
  </Button>
</div>
```

**Key Features:**
- Filter by department
- Search by name, email, employee ID
- Batch save (multiple employees at once)
- Shows stats: Total Employees, Assigned, Unassigned
- Tracks which employees have unsaved changes
- Calls `/api/admin/employee-roles` to persist changes

---

## Real-World Example

### Scenario: Give John Doe the ability to approve travel requests

**Step 1: RBAC Page - Define what Manager role can do**
```
Go to: /admin/user-access-security/rbac
1. Find "Manager" role
2. Click "Edit Role: Manager"
3. Check "travel.approve" permission
4. Click "Save Changes"
✅ Now ALL managers can approve travel requests
```

**Step 2: Employee-Roles Page - Assign John to Manager role**
```
Go to: /admin/user-access-security/employee-roles
1. Search for "John Doe"
2. Change his role to "Manager"
3. Click "Save Changes"
✅ John Doe now has Manager role and can approve travel requests
```

**Result:**
- All Managers can approve travel requests (role-level permission)
- John Doe is a Manager (employee assignment)
- John can approve travel requests (permission + assignment = access)

---

## Analogy: Restaurant Example

**RBAC Page (Edit Role Modal)** = Define Job Descriptions
```
Job: Chef
Responsibilities:
  ✅ Prepare meals
  ✅ Manage kitchen staff
  ✅ Approve menu items (NEW!)
  
When you add "Approve menu items":
→ ALL Chefs immediately get this responsibility
```

**Employee-Roles Page** = Hire People Into Jobs
```
Employee: Alice
Role: Chef

Employee: Bob
Role: Chef

Employee: Carol
Role: Dishwasher

When you hire Alice and Bob as Chefs:
→ Both get all Chef responsibilities
→ Carol doesn't (she's a Dishwasher)
```

---

## Data Flow

When an employee tries to perform an action:

```
1. Employee makes request (e.g., approve travel)
   ↓
2. System checks: What role does this employee have?
   → Look in Employee-Roles Page / user_roles table
   ↓
3. System checks: What permissions does that role have?
   → Look in RBAC Page / role_permissions table
   ↓
4. Permission found? YES → Allow ✅
   Permission not found? NO → Deny ❌
```

**Both pages are essential!**
- RBAC Page = Define what each role CAN do
- Employee-Roles Page = Assign employees to roles

---

## Key Differences

| Aspect | RBAC Page | Employee-Roles Page |
|--------|-----------|-------------------|
| **Affects** | System-wide | Individual employees |
| **Edit frequency** | Less often (when role capabilities change) | More often (when hiring/reassigning people) |
| **Number of items** | Limited (10-20 roles) | Large (hundreds of employees) |
| **Complexity** | Medium (permission selection) | High (bulk operations, search, filter) |
| **Impact radius** | Wide (all users with role) | Narrow (one employee) |
| **Changes need deploy?** | No (immediate effect) | No (immediate effect) |

---

## Permissions Required

Both pages require **role.manage** permission:
- `role.manage` - Can manage roles and assign permissions
- `admin.user_access.rbac.manage` - Can manage RBAC system
- `admin.manage` - Full admin access (includes role management)

---

## Common Tasks

**Use RBAC Page (Edit Role) when:**
- ✅ Adding a new permission type to a role
- ✅ Removing an expired permission from a role
- ✅ Creating a new custom role
- ✅ Updating what a role is allowed to do
- ✅ Changing role descriptions

**Use Employee-Roles Page when:**
- ✅ Assigning a role to a new employee
- ✅ Changing an employee's role
- ✅ Bulk assigning roles to multiple employees
- ✅ Finding which employees have a specific role
- ✅ Removing a role from an employee

---

## Summary

**Edit Role Modal:**
- ❌ NOT for assigning roles to people
- ✅ FOR defining role permissions and capabilities
- Affects all users with that role
- System-wide scope

**Employee-Roles Page:**
- ✅ FOR assigning roles to specific employees
- ❌ NOT for defining what a role can do
- Affects individual employees
- Individual scope

**They work together:** Define roles (RBAC) → Assign roles to employees (Employee-Roles) → Employees get access
