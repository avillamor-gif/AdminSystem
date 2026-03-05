# II Admin System - AI Coding Instructions

## Architecture Overview

**Next.js 14 App Router + Supabase** HRM system. All code lives in `src/` inside the workspace root (not a subdirectory).

```
src/
├── app/(dashboard)/            # Protected routes — all HR pages live here
│   ├── employees/[id]/         # Employee detail (massive page ~1100 lines)
│   ├── admin/                  # Admin sub-sections (job-management, leave-management, etc.)
│   └── layout.tsx              # Shared dashboard shell
├── components/ui/              # Button, Input, Card, Modal, Badge, Avatar, Select
├── hooks/                      # React Query hooks (one file per domain)
├── services/                   # Supabase query layer (one file per domain)
└── lib/supabase/
    ├── client.ts               # Browser client
    ├── server.ts               # Server component client
    └── database.types.ts       # Auto-generated types — DO NOT hand-edit
```

**Data flow:** `Component → Hook (React Query) → Service → Supabase → PostgreSQL`

## Development Commands

```bash
npm install          # from workspace root (not hrm-react/)
npm run dev          # http://localhost:3000
npm run build
npm run db:types     # regenerate src/lib/supabase/database.types.ts from Supabase
```

## Critical Supabase Patterns

### Always use `select('*')` after mutations and for simple fetches
Supabase PostgREST throws `PGRST200` if a joined table has no direct FK in the schema cache. **Never use aliased joins (`job_title:job_titles(...)`) in `.select()` on `insert`, `update`, or any table where the FK relationship isn't confirmed.** Use `select('*')` and resolve relations manually or via separate queries.

```typescript
// ✅ Safe — used in employee.service.ts, jobDescription.service.ts, etc.
const { data, error } = await supabase
  .from('job_descriptions')
  .insert(payload)
  .select('*')       // NOT .select('*, job_title:job_titles(id, title)')
  .single()

// ✅ Safe join pattern (confirmed FK exists)
// Used only in org.service.ts, leave.service.ts where FKs are verified
.select('*, department:departments(id, name), job_title:job_titles(id, title)')
```

### Supabase Client Import
- **Client components:** `import { createClient } from '@/lib/supabase/client'`
- **Server components:** `import { createClient } from '@/lib/supabase/server'`

### Types
```typescript
import type { Tables, InsertTables, UpdateTables } from '@/lib/supabase'
type Employee = Tables<'employees'>
type EmployeeInsert = InsertTables<'employees'>
```

## Service Layer Conventions

- **`employee.service.ts` `update()`** has an explicit `allowedFields` allowlist. Any new columns added to the `employees` table **must be added to this array** or they will be silently stripped:
  ```typescript
  const allowedFields = [
    'employee_id', 'first_name', 'last_name', 'email', 'phone',
    'date_of_birth', 'hire_date', 'department_id', 'job_title_id',
    'manager_id', 'location_id', 'work_location_type', 'remote_location',
    'status', 'avatar_url', 'address', 'city', 'country',
    'employment_type_id', 'job_specification_id'
  ]
  ```
- **`employee.service.ts` `getAll()`** deliberately avoids Supabase joins (PGRST200 risk). It fetches `departments` and `job_titles` in separate queries and maps them in JS.
- Services with `select('*')` fixed: `jobDescription.service.ts`, `contractDocument.service.ts`, `employeeAttachment.service.ts`.

## React Query Hook Pattern

Every domain has a hook file in `src/hooks/`. Follow this structure exactly:

```typescript
// src/hooks/useJobDescriptions.ts
export const jobDescriptionKeys = {
  all: ['job_descriptions'] as const,
  lists: () => [...jobDescriptionKeys.all, 'list'] as const,
  list: (filters: object) => [...jobDescriptionKeys.lists(), filters] as const,
}

export function useJobDescriptions(filters: JobDescriptionFilters) {
  return useQuery({
    queryKey: jobDescriptionKeys.list(filters),
    queryFn: () => jobDescriptionService.getAll(filters),
  })
}

export function useCreateJobDescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JobDescriptionInsert) => jobDescriptionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobDescriptionKeys.lists() })
      toast.success('Job description created')
    },
    onError: (error) => { console.error('Error creating job description:', error) },
  })
}
```

## Admin Page Pattern

Admin CRUD pages under `src/app/(dashboard)/admin/` must connect to DB hooks — **never use `useState` with hardcoded mock data arrays**. See `employment-types/page.tsx` and `job-descriptions/page.tsx` as reference implementations. Key elements:

```typescript
const { data: items = [], isLoading } = useFeature({})
const createMutation = useCreateFeature()
const updateMutation = useUpdateFeature()
const deleteMutation = useDeleteFeature()

// handleSubmit:
await selectedItem
  ? updateMutation.mutateAsync({ id: selectedItem.id, data: formData })
  : createMutation.mutateAsync(formData)

// Button loading state:
<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
  {isSaving ? 'Saving...' : 'Save'}
</Button>
```

JSONB array fields (`responsibilities`, `qualifications`, `skills` on `job_descriptions`) must be guarded: `Array.isArray(desc.responsibilities) ? desc.responsibilities : []`

## Database Notes

- Schema source of truth: `supabase/schema.sql` — run new SQL in Supabase SQL Editor
- RLS enabled on all tables; add policies when creating new tables
- `employees` table has columns `employment_type_id` (FK → `employment_types`) and `job_specification_id` (FK → `job_descriptions`) added via migration (not in original schema.sql)
- `employment_types.category` has a CHECK constraint: allowed values are `'permanent'`, `'contract'`, `'temporary'`, `'intern'`, `'consultant'`
- Auth: `user_roles` table links Supabase auth users to roles; `src/middleware.ts` protects dashboard routes

## UI Components

All in `src/components/ui/` — import via `@/components/ui`:
`Button` (variants: `primary`, `secondary`, `danger`, `ghost`) · `Input` · `Select` · `Card` · `Modal` / `ModalHeader` / `ModalBody` / `ModalFooter` · `Badge` · `Avatar`

Toast notifications: `import toast from 'react-hot-toast'` → `toast.success(...)` / `toast.error(...)`
