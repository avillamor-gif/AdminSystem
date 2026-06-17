# RBAC Audit Report & Implementation Plan

## Executive Summary
The system has a solid RBAC foundation with permission checks on navigation, admin cards, and secondary nav menus. However, there are gaps in:
1. **Granular permission codes** for submenu-level features (e.g., "Can edit members" vs "Can view members")
2. **Per-employee RBAC assignment** - No UI exists to manage employee-level roles/permissions
3. **Button-level permission checks** - Edit, Delete, Create buttons often lack granular controls
4. **Permission coverage** - Not all admin sub-pages have requiresPermission codes

---

## Current RBAC Implementation Status

### ✅ Working Well
- **Sidebar Navigation**: All items have `requiresPermission` checks (e.g., `nav.leave`, `nav.governance`)
- **Admin Cards**: All 21 modules have `requiresPermission` codes (e.g., `admin.user_access`, `admin.employee_data`)
- **Secondary Nav Menus**: All submenu items properly filtered by permission (e.g., `admin.organization`, `admin.assets`)
- **Permission Categories**: Properly consolidated (7 categories: Equipment, Governance, Internship, Membership, Navigation, Supplies, User Management)
- **Permission Hooks**: `useHasPermission()`, `useHasAnyPermission()`, `useCurrentUserPermissions()` all functional

### 🟡 Partially Complete
- **Admin Card Items**: Items in cards (e.g., "User Management", "Employee Records") navigate without per-item permission checks
- **Submenu Feature-Level Permissions**: Secondary nav has page-level permissions but not feature-level (no "edit" vs "view" distinction on same page)
- **CRUD Operations**: Buttons in forms lack granular permission checks

### 🔴 Missing/Needed
1. **Employee-level RBAC Editor** - No interface to assign roles/permissions to individual employees
2. **Granular Feature Permissions** - Missing codes for:
   - `*.view` (read-only access)
   - `*.edit` (modify existing records)
   - `*.create` (add new records)
   - `*.delete` (remove records)
   - `*.export` (download/export data)
   - `*.approve` (approval workflows)
3. **Per-Page Permission Checks** - Many admin sub-pages don't have permission guards
4. **Button-Level Granularity** - Edit/Delete/Create buttons don't check `*.edit`, `*.delete`, `*.create` separately

---

## Current Permission Structure

### Existing Permission Codes (52 total across 7 categories)

```
Equipment (5):
  assets.manage, equipment.approve, equipment.create, equipment.manage, equipment.view

Governance (5):
  governance.assemblies.manage, governance.board.manage, governance.export, governance.manage, governance.view

Internship (4):
  admin.internship.analytics, admin.internship.assessments, internship.manage, internship.view

Membership (6):
  membership.applications.review, membership.campaigns.manage, membership.dues.manage, membership.export, membership.manage, membership.view

Navigation (12):
  nav.attendance, nav.directory, nav.employees, nav.equipment, nav.governance, nav.leave, nav.membership, nav.my_info, nav.performance, nav.publications, nav.supplies, nav.travel

Supplies (4):
  supplies.approve, supplies.create, supplies.manage, supplies.view

User Management (16):
  employee.create, employee.delete, employee.edit, employee.view, employees.view, jobs.manage, jobs.view, my_info.edit, my_info.view, role.manage, terminations.manage, terminations.view, user.create, user.delete, user.edit, user.view
```

---

## Recommended Permission Code Expansion

### Phase 1: Add Granular CRUD Permissions for All Admin Modules
```sql
-- User Access & Security
admin.user_access.view
admin.user_access.manage
admin.user_access.user_management.create
admin.user_access.user_management.edit
admin.user_access.user_management.delete
admin.user_access.rbac.view
admin.user_access.rbac.manage
admin.user_access.security_policies.view
admin.user_access.security_policies.manage

-- Organization Structure
admin.organization.view
admin.organization.manage
admin.organization.company_structure.view
admin.organization.company_structure.edit
admin.organization.locations_management.view
admin.organization.locations_management.manage
admin.organization.department_hierarchy.view
admin.organization.department_hierarchy.edit

-- Job Management
admin.job_management.view
admin.job_management.manage
admin.job_management.job_titles.create
admin.job_management.job_titles.edit
admin.job_management.job_titles.delete
admin.job_management.job_descriptions.view
admin.job_management.job_descriptions.create
admin.job_management.job_descriptions.edit
admin.job_management.job_descriptions.delete

-- Employee Data Management
admin.employee_data.view
admin.employee_data.manage
admin.employee_data.employee_profiles.view
admin.employee_data.employee_profiles.edit
admin.employee_data.employee_records.view
admin.employee_data.employee_records.manage
admin.employee_data.termination_activation.manage

-- Time & Attendance
admin.time_attendance.view
admin.time_attendance.manage
admin.time_attendance.work_schedules.view
admin.time_attendance.work_schedules.edit
admin.time_attendance.attendance_policies.view
admin.time_attendance.attendance_policies.manage

-- Leave & Absence
admin.leave_management.view
admin.leave_management.manage
admin.leave_management.leave_types.view
admin.leave_management.leave_types.create
admin.leave_management.leave_types.edit
admin.leave_management.leave_types.delete
admin.leave_management.leave_policies.view
admin.leave_management.leave_policies.manage

-- Payroll & Benefits
admin.payroll_benefits.view
admin.payroll_benefits.manage
admin.payroll_benefits.pay_components.create
admin.payroll_benefits.pay_components.edit
admin.payroll_benefits.benefits_plans.view
admin.payroll_benefits.benefits_plans.manage

-- Performance
admin.performance.view
admin.performance.manage
admin.performance.review_cycles.create
admin.performance.review_cycles.edit
admin.performance.goal_templates.view
admin.performance.goal_templates.manage

-- Learning & Development
admin.learning_development.view
admin.learning_development.manage
admin.learning_development.training_programs.view
admin.learning_development.training_programs.create
admin.learning_development.training_programs.edit
admin.learning_development.certifications.view
admin.learning_development.certifications.manage

-- Recruitment
admin.recruitment.view
admin.recruitment.manage
admin.recruitment.job_postings.create
admin.recruitment.job_postings.edit
admin.recruitment.candidates.view
admin.recruitment.candidates.manage

-- Compliance & Audit
admin.compliance_audit.view
admin.compliance_audit.manage
admin.compliance_audit.audit_trails.view
admin.compliance_audit.policies.view
admin.compliance_audit.policies.manage

-- Analytics & Reporting
admin.analytics_reports.view
admin.analytics_reports.manage
admin.analytics_reports.reports.view
admin.analytics_reports.reports.create
admin.analytics_reports.dashboards.manage

-- System Configuration
admin.system_config.view
admin.system_config.manage
admin.system_config.general_settings.view
admin.system_config.general_settings.edit
admin.system_config.email_configuration.manage
admin.system_config.workflow_settings.manage

-- Travel
admin.travel.view
admin.travel.manage
admin.travel.travel_requests.view
admin.travel.travel_requests.manage
admin.travel.policies.view
admin.travel.policies.manage

-- Asset Management
admin.assets.view
admin.assets.manage
admin.assets.assets.create
admin.assets.assets.edit
admin.assets.assets.delete
admin.assets.assignments.view
admin.assets.assignments.manage
admin.assets.maintenance.view
admin.assets.maintenance.manage

-- Office Equipment
admin.equipment.view
admin.equipment.manage
admin.equipment.requests.view
admin.equipment.requests.approve

-- Office Supplies
admin.supplies.view
admin.supplies.manage
admin.supplies.inventory.view
admin.supplies.inventory.manage
admin.supplies.requests.view
admin.supplies.requests.approve

-- Governance (already has good coverage)
governance.view
governance.manage
governance.board.manage
governance.assemblies.manage
governance.applications.review
governance.export

-- Membership (already has good coverage)
membership.view
membership.manage
membership.applications.review
membership.dues.manage
membership.campaigns.manage
membership.export

-- Publications
admin.publications.view
admin.publications.manage
admin.publications.create
admin.publications.edit
admin.publications.delete
admin.publications.approve

-- Internship & Volunteer
admin.internship.view
admin.internship.manage
admin.internship.partner_institutions.create
admin.internship.partner_institutions.edit
admin.internship.enrollments.view
admin.internship.enrollments.manage

-- Monitoring & Evaluation
admin.monitoring_evaluation.view
admin.monitoring_evaluation.manage
admin.monitoring_evaluation.programs.create
admin.monitoring_evaluation.programs.edit
admin.monitoring_evaluation.data_entry.submit
```

---

## Feature Audit Gaps

### Admin Pages Needing Permission Checks

| Page | Current Check | Needed Granularity |
|------|---|---|
| User Management | `admin.user_access.user_management` | ✅ Good |
| RBAC | `admin.user_access.rbac` | Add `rbac.manage` |
| Company Structure | `admin.organization.company_structure` | Need *.edit *.view |
| Leave Types | `admin.leave_management.leave_types` | Add `.create`, `.edit`, `.delete` |
| Job Descriptions | `admin.job_management.job_descriptions` | Add `.create`, `.edit`, `.delete` |
| Members | `admin.manage` + `membership.manage` | Has `.manage` but needs `.edit`, `.delete` |
| Member Dues | `membership.dues.manage` | ✅ Good |
| Campaigns | `membership.campaigns.manage` | ✅ Good |

---

## Required Changes

### 1. Create Employee RBAC Assignment Interface

**File**: `src/app/(dashboard)/admin/user-access-security/employee-roles/page.tsx` (NEW)

**Features**:
- List all employees with current role
- Search/filter by name, employee ID, department
- Inline role assignment (dropdown)
- Bulk role assignment
- Permission verification before save

**Permissions Required**:
- `admin.user_access.rbac.manage` (or `role.manage`)

**Database Tables Used**:
- `employees` (read)
- `user_roles` (read/write)
- `roles` (read)

---

### 2. Update Secondary Nav Layouts with Permission Codes

Add `requiresPermission` to all submenu items:

```typescript
// Example: src/app/(dashboard)/admin/leave-management/layout.tsx
const navItems = [
  { label: 'All Leave Requests', href: '/admin/leave-management', requiresPermission: 'admin.leave_management.view' },
  { label: 'Leave Types', href: '/admin/leave-management/leave-types', requiresPermission: 'admin.leave_management.leave_types.view' },
  { label: 'Leave Policies', href: '/admin/leave-management/leave-policies', requiresPermission: 'admin.leave_management.leave_policies.view' },
  { label: 'Accrual Rules', href: '/admin/leave-management/accrual-rules', requiresPermission: 'admin.leave_management.accrual_rules.view' },
]
```

---

### 3. Add Button-Level Permission Checks

**Pattern**:
```typescript
const canEdit = useHasPermission('admin.members.edit')
const canDelete = useHasPermission('admin.members.delete')
const canExport = useHasPermission('admin.members.export')

// In JSX:
{canEdit && <Button onClick={...}>Edit</Button>}
{canDelete && <Button variant="danger" onClick={...}>Delete</Button>}
{canExport && <Button onClick={...}>Export</Button>}
```

---

### 4. Create SQL Migration for New Permissions

**File**: `supabase/add-granular-admin-permissions.sql`

```sql
-- Add all granular admin permissions (~150-200 new codes)
-- Update role_permissions table to assign permissions to roles
-- Run verification queries
```

---

## Implementation Priority

### Phase 1 (High Priority) - Next Steps
1. ✅ Create SQL migration for granular permissions (already have template above)
2. Create Employee RBAC Editor UI component
3. Add permission codes to secondary nav items
4. Create permission assignment helper functions

### Phase 2 (Medium Priority)
1. Add button-level permission checks to all CRUD pages
2. Update form components to check `*.create` and `*.edit` permissions
3. Add delete confirmation modal with permission check

### Phase 3 (Lower Priority)
1. Add export functionality with `*.export` permission checks
2. Create audit logging for RBAC changes
3. Add permission usage analytics

---

## Testing Checklist

- [ ] Employee RBAC page loads with permission check
- [ ] Can assign roles to employees
- [ ] Permission changes reflected in real-time
- [ ] RBAC buttons only show when user has permission
- [ ] Secondary nav items filtered by permission
- [ ] Admin cards respect granular permissions
- [ ] Edit/Delete buttons respect granular permissions
- [ ] Export buttons restricted to users with `*.export` permission

---

## Questions for Implementation

1. Should we allow role inheritance (e.g., "admin" inherits all permissions)?
2. Should we allow custom per-employee permissions, or only role-based?
3. Should we track who assigned each permission (audit log)?
4. Should permission changes take effect immediately, or require session refresh?

