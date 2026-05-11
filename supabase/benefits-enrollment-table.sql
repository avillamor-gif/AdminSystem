-- ============================================================
-- Benefits Enrollment Tracking
-- Per IBON Manual:
--   HMO: 50-50 cost share between employee and employer
--   Family coverage: additional member at employee's full cost
--   Bereavement Assistance: PHP 15,000 financial grant (not leave)
--     - Immediate family: parent, sibling, spouse, child
-- ============================================================

-- ── Employee Benefits Enrollment ─────────────────────────────

create table if not exists employee_benefits_enrollment (
  id                  uuid primary key default gen_random_uuid(),
  employee_id         uuid not null references employees(id) on delete cascade,
  benefits_plan_id    uuid not null references benefits_plans(id),
  enrollment_date     date not null default current_date,
  effectivity_date    date,
  end_date            date,
  is_active           boolean not null default true,
  coverage_type       text not null default 'employee_only'
                        check (coverage_type in ('employee_only', 'with_dependents')),
  employee_share      numeric(10,2),   -- employee's monthly premium share
  employer_share      numeric(10,2),   -- employer's monthly premium share
  total_premium       numeric(10,2),   -- total monthly premium
  notes               text,
  enrolled_by         uuid references employees(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (employee_id, benefits_plan_id, is_active)
    deferrable initially deferred
);

create index if not exists employee_benefits_enrollment_employee_id_idx
  on employee_benefits_enrollment(employee_id);

-- ── Bereavement Assistance Claims ────────────────────────────

create table if not exists bereavement_assistance_claims (
  id                  uuid primary key default gen_random_uuid(),
  employee_id         uuid not null references employees(id) on delete cascade,
  deceased_name       text not null,
  relationship        text not null
                        check (relationship in ('parent', 'sibling', 'spouse', 'child', 'other')),
  date_of_death       date not null,
  amount              numeric(10,2) not null default 15000.00,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'released', 'rejected')),
  approved_by         uuid references employees(id),
  approved_at         timestamptz,
  released_at         timestamptz,
  supporting_docs     jsonb,   -- array of {name, url}
  notes               text,
  requested_by        uuid references employees(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists bereavement_claims_employee_id_idx
  on bereavement_assistance_claims(employee_id);

-- ── Updated-at triggers ───────────────────────────────────────

create or replace function update_benefits_enrollment_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_benefits_enrollment_updated_at on employee_benefits_enrollment;
create trigger set_benefits_enrollment_updated_at
  before update on employee_benefits_enrollment
  for each row execute function update_benefits_enrollment_updated_at();

create or replace function update_bereavement_claims_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_bereavement_claims_updated_at on bereavement_assistance_claims;
create trigger set_bereavement_claims_updated_at
  before update on bereavement_assistance_claims
  for each row execute function update_bereavement_claims_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

alter table employee_benefits_enrollment enable row level security;
alter table bereavement_assistance_claims enable row level security;

create policy "Admins can manage benefits enrollment"
  on employee_benefits_enrollment for all
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'hr'))
  );

create policy "Employees can view own benefits enrollment"
  on employee_benefits_enrollment for select
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.employee_id = employee_benefits_enrollment.employee_id)
  );

create policy "Admins can manage bereavement claims"
  on bereavement_assistance_claims for all
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'hr'))
  );

create policy "Employees can manage own bereavement claims"
  on bereavement_assistance_claims for all
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.employee_id = bereavement_assistance_claims.employee_id)
  );
