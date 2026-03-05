# II Admin System - AI Coding Instructions

## Architecture Overview

**Next.js 14 App Router + Supabase** HRM system. All code lives in `src/` in the workspace root.

```
src/
├── app/(dashboard)/            # Protected routes — all HR pages live here
│   ├── employees/[id]/components/EmployeeDetailContent.tsx  # ~2000-line tabbed detail view
│   ├── admin/                  # Admin sub-sections: job-management, leave-management, etc.
│   ├── api/                    # API routes (use service-role key for RLS bypass)
│   └── layout.tsx              # Dashboard shell: resolves user→employee via user_roles
├── components/ui/              # Button, Input, Card, Modal, Badge, Avatar, Select, ConfirmModal
├── components/layout/          # Sidebar, Header, SecondaryNav
├── hooks/                      # React Query hooks (one file per domain, re-exported via index.ts)
├── services/                   # Supabase query layer (one file per domain)
└── lib/supabase/
    ├── client.ts               # Browser client (createBrowserClient)
    ├── server.ts               # Server component client (createServerClient + cookies)
    ├── admin.ts                # Service-role client — server/API routes ONLY
    └── database.types.ts       # Auto-generated — DO NOT hand-edit
```

**Data flow:** `Component → Hook (React Query) → Service → Supabase → PostgreSQL`

## Development Commands

```bash
npm install          # from workspace root (not hrm-react/)
npm run dev          # http://localhost:3000
npm run build
npm run db:types     # regenerate src/lib/supabase/database.types.ts from Supabase
```

**Required env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

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

### Supabase Client Selection
- **Client components / services:** `import { createClient } from '@/lib/supabase/client'`
- **Server components / API routes:** `import { createClient } from '@/lib/supabase/server'`
- **API routes needing RLS bypass:** `import { createAdminClient } from '@/lib/supabase/admin'` (service-role, server only)

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
- **`employee.service.ts` `getAll()`** fetches `departments` and `job_titles` in separate queries and maps in JS (intentional PGRST200 avoidance).
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

JSONB array fields (`responsibilities`, `qualifications`, `skills` on `job_descriptions`) must be guarded: `Array.isArray(desc.responsibilities) ? desc.responsibilities : []`

## Notifications & API Routes

Notifications use a two-step pattern to bypass RLS on `user_roles`:
1. Service calls `notifySupervisorsAndAdmins()` / `notifyRequesterOfDecision()` from `src/services/requestNotification.helper.ts`
2. These POST to `/api/notifications/send` or `/api/notifications/decision`, which use `createAdminClient()` to resolve supervisor/admin user IDs and insert rows

**Never query `user_roles` for supervisor lookups in browser services** — RLS blocks it. Use the API route pattern above.

API routes that need to create auth users (e.g., `/api/create-employee-auth`) use `SUPABASE_SERVICE_ROLE_KEY` directly — always guard for missing env vars.

## Auth & Permissions

- `src/middleware.ts` protects all dashboard routes via `updateSession`
- `user_roles` table links Supabase auth users → employees → roles
- Dashboard `layout.tsx` resolves the logged-in user to an employee record first via `user_roles.employee_id`, then falls back to email match on `employees`
- Use `useCurrentUserPermissions()` from `@/hooks/usePermissions` to gate UI by role; `useCurrentEmployee()` for the logged-in employee record
- Permission codes follow `resource.action` format (e.g., `employees.edit`, `leave.approve`)

## Database Notes

- Schema source of truth: `supabase/schema.sql`; migration SQLs in `supabase/` — run in Supabase SQL Editor
- RLS enabled on all tables; add policies when creating new tables
- `employees` table has `employment_type_id` (FK → `employment_types`) and `job_specification_id` (FK → `job_descriptions`) added via migration (not in original schema.sql)
- `employment_types.category` CHECK constraint: `'permanent'` | `'contract'` | `'temporary'` | `'intern'` | `'consultant'`

## UI Components

All in `src/components/ui/` — import via `@/components/ui`:
`Button` (variants: `primary`, `secondary`, `danger`, `ghost`) · `Input` · `Select` · `Card` · `Modal` / `ModalHeader` / `ModalBody` / `ModalFooter` · `Badge` · `Avatar` · `ConfirmModal`

Toast: `import toast from 'react-hot-toast'` — used in mutation `onSuccess`/`onError` callbacks. (`sonner` is also used in `EmployeeDetailContent.tsx` only.)
