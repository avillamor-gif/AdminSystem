-- Performance Appraisal Forms (staff + admin workflow)

create table if not exists performance_appraisals (
  id uuid primary key default gen_random_uuid(),
  appraisee_employee_id uuid not null references employees(id) on delete cascade,
  appraiser_employee_id uuid references employees(id) on delete set null,
  period_covered varchar(20) not null check (period_covered in ('midyear', 'yearend')),
  review_year integer not null,
  status varchar(30) not null default 'draft' check (status in ('draft', 'pending_review', 'in_review', 'returned', 'completed')),
  filename text not null,
  form_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  finalized_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_perf_appraisal_appraisee on performance_appraisals(appraisee_employee_id);
create index if not exists idx_perf_appraisal_appraiser on performance_appraisals(appraiser_employee_id);
create index if not exists idx_perf_appraisal_status on performance_appraisals(status);
create index if not exists idx_perf_appraisal_year on performance_appraisals(review_year);

alter table performance_appraisals enable row level security;

-- Access is handled via API routes using service-role for now.
-- Keep direct table access blocked until explicit policies are introduced.
