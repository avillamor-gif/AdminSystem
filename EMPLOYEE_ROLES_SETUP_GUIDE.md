# Employee Roles Setup Guide

## Overview

The **Employee Roles** page allows admins to assign RBAC roles to employees. However, there's a prerequisite: each employee must have been onboarded through the auth setup process first.

## The Flow

### Step 1: Onboard Employee (Create Auth User)
Before you can assign a role to an employee, they need an auth account.

**Where:** Admin → Employee Data → Employees (or a dedicated onboarding page)
**What to do:**
1. Find the employee in the system
2. Click "Create User" / "Setup Auth" (or similar button)
3. Enter temporary password
4. Employee gets email with login credentials

**Behind the scenes:**
- Creates auth user in Supabase Auth
- Creates entry in `user_roles` table with `role: 'employee'` (default)
- Links `user_id` to `employee_id`

### Step 2: Assign Role (Define Permissions)
Once the employee has been onboarded, you can assign them a specific role.

**Where:** Admin → User Access & Security → Employee Roles
**What to do:**
1. Select employee from list
2. Choose their role (Admin, Manager, HR Manager, etc.)
3. Click "Save Roles"

**Behind the scenes:**
- Updates `user_roles` table to set `role_id` (which defines which permissions they have)
- The actual permission sets are defined in RBAC page
- Next time they log in, they'll have the new permissions

### Step 3: (Optional) Define Role Permissions
If you need to customize what a role can do, use the RBAC page.

**Where:** Admin → User Access & Security → RBAC
**What to do:**
1. Click "Edit Role" on the role you want to modify
2. Toggle permissions on/off
3. Click "Save"

**Behind the scenes:**
- Updates `role_permissions` table
- Affects all employees with that role
- Can also navigate directly from Employee-Roles page via "[Edit Role Permissions]" link

## Troubleshooting

### Error: "No existing auth user found for X. Please create user first via employee setup."

**Cause:** The employee doesn't have an auth account yet.

**Solution:** 
1. Go to Employee Data → Employees
2. Find the employee
3. Click the button to create their auth account
4. Retry the role assignment

### Error: "Role X not found"

**Cause:** The role doesn't exist in the database.

**Solution:**
1. Go to RBAC page
2. Verify the role exists
3. If not, create it
4. Retry the role assignment

### Employee can't see their permissions after role change

**Cause:** They need to log out and log back in for permissions to refresh.

**Solution:** Have the employee log out and log back in.

## Database Schema Reference

### user_roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- Auth user
  employee_id UUID REFERENCES employees(id),         -- Employee record
  role_id UUID REFERENCES roles(id),                 -- RBAC role (defines permissions)
  created_at, updated_at
)
```

**Key Fields:**
- `user_id`: Links to Supabase Auth user (required for login)
- `employee_id`: Links to employee record (who they are in HR system)
- `role_id`: Links to RBAC role (what they can do)

### roles Table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at, updated_at
)
```

### role_permissions Table
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  created_at
)
```

## API Endpoints

### POST /api/admin/employee-roles
Assign roles to employees.

**Request:**
```json
{
  "updates": [
    {
      "employeeId": "uuid-of-employee",
      "roleId": "uuid-of-role"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 1,
  "results": [
    {
      "employee_id": "uuid",
      "user_id": "uuid",
      "role_id": "uuid",
      "role_name": "Manager",
      "status": "updated"
    }
  ]
}
```

**Errors:**
- `"No existing auth user found for X"` - Employee needs to be onboarded first
- `"Role X not found"` - Role doesn't exist
- `"Employee X not found"` - Employee doesn't exist

## Process Diagram

```
┌──────────────────┐
│  Add Employee    │
│  to Database     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Create Employee Auth Account │
│ (POST /api/create-employee-auth)
│ - Creates auth.users entry  │
│ - Creates user_roles entry  │
│   (role: 'employee' default) │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Assign Employee Role         │
│ (Employee-Roles page)       │
│ - Select role from RBAC     │
│ - Updates user_roles.role_id│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Employee Can Use App        │
│ - With new permissions      │
│ - After they log back in    │
└──────────────────────────────┘
```

## Related Pages

- **Employee Data → Employees**: Manage employee records, trigger auth setup
- **User Access & Security → RBAC**: Define role permissions (system-wide)
- **User Access & Security → Employee Roles**: Assign roles to employees (individual)
- **System Configuration**: May contain onboarding workflows

## Key Concepts

**Auth User** = Supabase Auth entry (email + password, allows login)
**Employee** = HR system record (person's information)
**Role** = Job classification with permissions
**RBAC Role** = Fine-grained permission set that can be customized
**user_roles Table** = The junction that links all three

One employee = One auth user = One role (currently) = Many permissions
