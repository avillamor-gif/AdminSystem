# II Admin System - AI Coding Instructions

## Architecture Overview

**Next.js 14 App Router + Supabase** HRM system (PWA-enabled). All code lives in `src/` in the workspace root.

```
src/
├── app/(dashboard)/            # Protected routes — all HR pages live here
│   ├── employees/[id]/components/EmployeeDetailContent.tsx  # ~2100-line tabbed detail view (reused for My Info)
│   ├── admin/                  # Admin sub-sections: job-management, leave-management, payroll-benefits, etc.
│   │   └── <section>/layout.tsx  # Each multi-page admin section uses SecondaryNav in a layout
│   ├── api/                    # API routes (use service-role key for RLS bypass)
│   ├── my-info/                # Self-service wrapper — renders EmployeeDetailContent with selfService prop
│   └── layout.tsx              # Dashboard shell: resolves user→employee via user_roles, then email fallback
├── components/ui/              # Button, Input, Card, Modal, Badge, Avatar, Select, ConfirmModal
├── components/layout/          # Sidebar, Header, SecondaryNav
├── components/admin/           # Domain-specific admin sub-components (e.g. payroll/PayComponentForm)
├── contexts/SidebarContext.tsx  # Sidebar collapse state (useSidebar hook)
├── hooks/                      # React Query hooks (one file per domain, re-exported via index.ts)
├── services/                   # Supabase query layer (one file per domain, re-exported via index.ts)
└── lib/supabase/
    ├── client.ts               # Browser client (createBrowserClient)
    ├── server.ts               # Server component client (createServerClient + cookies)
    ├── admin.ts                # Service-role client — server/API routes ONLY
    ├── middleware.ts           # updateSession used by src/middleware.ts
    ├── storage.ts              # Storage helpers: uploadEmployeePhoto, BUCKETS constant
    └── database.types.ts       # Auto-generated — DO NOT hand-edit
```

**Data flow:** `Component → Hook (React Query) → Service → Supabase → PostgreSQL`

## Development Commands

```bash
npm install          # from workspace root
npm run dev          # http://localhost:3000
npm run build
npm run db:types     # regenerate src/lib/supabase/database.types.ts from Supabase
```

**Required env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

PWA is disabled in development (`next-pwa` config: `disable: process.env.NODE_ENV === 'development'`).

## Critical Supabase Patterns

### Always use `select('*')` after mutations
Supabase PostgREST throws `PGRST200` on aliased joins when the FK isn't in the schema cache. **Never use aliased joins in `.select()` on `insert`/`update` or unverified tables.** Resolve relations manually with separate queries.

```typescript
// ✅ Safe
await supabase.from('job_descriptions').insert(payload).select('*').single()

// ❌ Unsafe — PGRST200 risk
await supabase.from('job_descriptions').insert(payload).select('*, job_title:job_titles(id, title)').single()

// ✅ Verified FK joins only (org.service.ts, leave.service.ts)
.select('*, department:departments(id, name), job_title:job_titles(id, title)')
```

### Related-record fetching pattern
All `*WithRelations` types (e.g. `EmployeeWithRelations`, `LeaveRequestWithRelations`) are assembled in JS, not SQL joins. Fetch the primary table with `select('*')`, then fetch related tables separately and map in JS. See `employee.service.ts` `getAll()` and `leave.service.ts` for the canonical pattern.

### Supabase Client Selection
- **Client components / services:** `import { createClient } from '@/lib/supabase/client'`
- **Server components / API routes:** `import { createClient } from '@/lib/supabase/server'`
- **API routes needing RLS bypass:** `import { createAdminClient } from '@/lib/supabase/admin'` (service-role, never in browser)

### Types
```typescript
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase'
type Employee = Tables<'employees'>
```

## Service Layer Conventions

- **`employee.service.ts` `update()`** has an explicit `allowedFields` allowlist — **add new `employees` columns here or they'll be silently stripped:**
  ```typescript
  const allowedFields = [
    'employee_id', 'first_name', 'last_name', 'email', 'phone',
    'date_of_birth', 'hire_date', 'department_id', 'job_title_id',
    'manager_id', 'location_id', 'work_location_type', 'remote_location',
    'status', 'avatar_url', 'address', 'city', 'country',
    'employment_type_id', 'job_specification_id'
  ]
  ```
- Services re-export via `src/services/index.ts` — import services from `@/services`, not individual files.
- Services fixed to use `select('*')`: `jobDescription.service.ts`, `contractDocument.service.ts`, `employeeAttachment.service.ts`.

## React Query Hook Pattern

Every domain has a hook in `src/hooks/`, re-exported via `src/hooks/index.ts`. Follow this structure:

```typescript
// src/hooks/useJobDescriptions.ts
export const jobDescriptionKeys = {
  all: ['job_descriptions'] as const,
  lists: () => [...jobDescriptionKeys.all, 'list'] as const,
  list: (filters: object) => [...jobDescriptionKeys.lists(), filters] as const,
}
export function useCreateJobDescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JobDescriptionInsert) => jobDescriptionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.lists() })
      toast.success('Job description created')
    },
  })
}
```

## Admin Page Pattern

Admin CRUD pages under `src/app/(dashboard)/admin/` must use DB hooks — **never `useState` with hardcoded mock arrays**. Reference: `job-management/employment-types/page.tsx`.

```typescript
const { data: items = [], isLoading } = useFeature({})
const createMutation = useCreateFeature()
const updateMutation = useUpdateFeature()
// handleSubmit:
await selectedItem
  ? updateMutation.mutateAsync({ id: selectedItem.id, data: formData })
  : createMutation.mutateAsync(formData)
// Loading state on submit button:
disabled={createMutation.isPending || updateMutation.isPending}
```

Multi-page admin sections (e.g. `leave-management/`, `payroll-benefits/`, `system-config/`, `organization-structure/`, `time-attendance/`) use a `layout.tsx` with `<SecondaryNav items={...} />` for the sub-nav, and a root `page.tsx` that `router.replace`s to the first sub-page.

JSONB array fields (`responsibilities`, `qualifications`, `skills` on `job_descriptions`) must be guarded: `Array.isArray(desc.responsibilities) ? desc.responsibilities : []`

## EmployeeDetailContent Reuse

`EmployeeDetailContent` is a multi-prop component used in three contexts:
- **Employee detail:** rendered by `employees/[id]/page.tsx` — uses `params.id`
- **My Info (self-service):** `overrideEmployeeId={currentEmployee.employee_id}` + `hideBackButton` + `selfService` props
- **Read-only:** `readOnly` prop hides all edit controls

## Notifications & API Routes

Notifications use a two-step pattern to bypass RLS on `user_roles`:
1. Service/hook calls `notifySupervisorsAndAdmins()` / `notifyRequesterOfDecision()` from `src/services/requestNotification.helper.ts`
2. These POST to `/api/notifications/send` or `/api/notifications/decision`, which use `createAdminClient()` to resolve supervisor/admin user IDs and insert rows

**Never query `user_roles` for supervisor lookups in browser services** — RLS blocks it. Use the API route pattern above.

API routes that need to create auth users (e.g., `/api/create-employee-auth`) use `SUPABASE_SERVICE_ROLE_KEY` directly — always guard for missing env vars.

### Write-via-API-route pattern for privileged writes
Some services that need service-role for writes split into a read-only browser service + a standalone write function that POSTs to an API route. Example: `src/services/workflowConfig.service.ts`:
```typescript
// Read: browser client (RLS ok)
export const workflowConfigService = { async getAll() {...}, async getByType() {...} }
// Write: fetches /api/admin/workflow-configs which uses createAdminClient()
export async function updateWorkflowConfig(id, updates) { return fetch('/api/admin/workflow-configs', { method: 'PATCH', ... }) }
```
Use this pattern when a table's RLS blocks writes from the browser but reads are fine.

## Audit Logging

`logAction()` from `src/services/auditLog.service.ts` is a fire-and-forget helper — call it from hooks in `onSuccess` callbacks. It swallows errors so it never breaks the main action. Used across `useTravel`, `useLeaveRequests`, `useAttendance`, etc.

## Auth & Permissions

- `src/middleware.ts` → `lib/supabase/middleware.ts` `updateSession` protects all dashboard routes; users not in `user_roles` are redirected to `/setup`
- `user_roles` table links Supabase auth users → employees → roles
- Dashboard `layout.tsx` resolves the logged-in user to an employee record first via `user_roles.employee_id`, then falls back to email match on `employees`
- Permission hooks: `useCurrentUserPermissions()`, `useHasPermission(code)`, `useHasAnyPermission(codes[])`, `useIsAdmin()`, `useHasRole(name)` — all from `@/hooks/usePermissions`
- `useCurrentEmployee()` returns the logged-in employee record
- Permission codes follow `resource.action` format (e.g., `employees.edit`, `leave.approve`)
- `permissionService.getDefaultPermissionsByRole()` defines fallback RBAC defaults synced to DB `role_permissions` table

## Database Notes

- Schema source of truth: `supabase/schema.sql`; migration SQLs in `supabase/` — run in Supabase SQL Editor
- RLS enabled on all tables; add policies when creating new tables
- `employees` table has `employment_type_id` (FK → `employment_types`) and `job_specification_id` (FK → `job_descriptions`) added via migration (not in original schema.sql)
- `employment_types.category` CHECK constraint: `'permanent'` | `'contract'` | `'temporary'` | `'intern'` | `'consultant'`

## UI Components & Utilities

All in `src/components/ui/` — import via `@/components/ui`:
`Button` (variants: `primary`, `secondary`, `danger`, `ghost`) · `Input` · `Select` · `Card` / `CardHeader` / `CardTitle` / `CardContent` · `Modal` / `ModalHeader` / `ModalBody` / `ModalFooter` · `Badge` · `Avatar` · `ConfirmModal`

- Toast: `import toast from 'react-hot-toast'` in hooks/mutations. (`sonner` used in `EmployeeDetailContent.tsx` only — do not mix)
- Date formatting: use `formatDate()` / `localDateStr()` from `@/lib/utils` — avoid `new Date().toISOString().split('T')[0]` (UTC timezone bug)
- Styling: `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Forms with validation: `react-hook-form` + `zod` + `zodResolver` (see `EmployeeFormModal.tsx`, `DepartmentFormModal.tsx`)
- Storage uploads: use helpers from `@/lib/supabase/storage` (`uploadEmployeePhoto`, `BUCKETS` constants)
