-- ============================================================
-- Probationary Review Tracking
-- Per IBON Manual: 6-month probationary period, 2 key checkpoints:
--   - Interim review at ~3 months (day 90)
--   - Final review at ~5 months (day 150) before regularization
-- ============================================================

create table if not exists probationary_reviews (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references employees(id) on delete cascade,
  review_type       text not null check (review_type in ('interim_3mo', 'final_5mo')),
  due_date          date not null,
  status            text not null default 'pending' check (status in ('pending', 'completed', 'overdue', 'skipped')),
  recommendation    text check (recommendation in ('regularize', 'extend_probation', 'terminate', null)),
  reviewer_id       uuid references employees(id),
  performance_score numeric(4,2),
  notes             text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index for fast per-employee lookups
create index if not exists probationary_reviews_employee_id_idx on probationary_reviews(employee_id);
create index if not exists probationary_reviews_due_date_idx on probationary_reviews(due_date);
create index if not exists probationary_reviews_status_idx on probationary_reviews(status);

-- Updated-at trigger
create or replace function update_probationary_reviews_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_probationary_reviews_updated_at on probationary_reviews;
create trigger set_probationary_reviews_updated_at
  before update on probationary_reviews
  for each row execute function update_probationary_reviews_updated_at();

-- Auto-mark overdue: call this via a scheduled job or on-read query
-- (The app also handles display-level overdue flagging.)

-- ============================================================
-- RLS Policies
-- ============================================================
alter table probationary_reviews enable row level security;

-- Admins & HR can do everything
create policy "Admins can manage probationary reviews"
  on probationary_reviews for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'hr')
    )
  );

-- Supervisors/managers can view reviews for their direct reports
create policy "Supervisors can view team probationary reviews"
  on probationary_reviews for select
  using (
    exists (
      select 1 from employees e
      join employees mgr on mgr.id = e.manager_id
      join user_roles ur on ur.employee_id = mgr.id
      where e.id = probationary_reviews.employee_id
        and ur.user_id = auth.uid()
    )
  );

-- Employees can view their own
create policy "Employees can view own probationary reviews"
  on probationary_reviews for select
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.employee_id = probationary_reviews.employee_id
    )
  );

-- ============================================================
-- Helper: Create probationary review records for an employee
-- Call this after inserting/updating an employee whose
-- employment_type is 'Probationary' (code = 'PROB').
--
-- Usage:
--   select create_probationary_reviews('<employee_uuid>', '<hire_date>');
-- ============================================================
create or replace function create_probationary_reviews(
  p_employee_id uuid,
  p_hire_date   date
)
returns void language plpgsql as $$
begin
  -- Remove any existing pending/overdue reviews first (idempotent)
  delete from probationary_reviews
  where employee_id = p_employee_id
    and status in ('pending', 'overdue');

  -- Interim review: 90 days from hire
  insert into probationary_reviews (employee_id, review_type, due_date, status)
  values (p_employee_id, 'interim_3mo', p_hire_date + interval '90 days', 'pending');

  -- Final review: 150 days from hire
  insert into probationary_reviews (employee_id, review_type, due_date, status)
  values (p_employee_id, 'final_5mo', p_hire_date + interval '150 days', 'pending');
end;
$$;

-- ============================================================
-- Manually create reviews for any current probationary employees
-- (run once after applying this migration)
-- ============================================================
insert into probationary_reviews (employee_id, review_type, due_date, status)
select
  e.id,
  'interim_3mo',
  e.hire_date + interval '90 days',
  case
    when e.hire_date + interval '90 days' < current_date then 'overdue'
    else 'pending'
  end
from employees e
join employment_types et on et.id = e.employment_type_id
where et.code = 'PROB'
  and e.status = 'active'
  and not exists (
    select 1 from probationary_reviews pr
    where pr.employee_id = e.id and pr.review_type = 'interim_3mo'
  )
on conflict do nothing;

insert into probationary_reviews (employee_id, review_type, due_date, status)
select
  e.id,
  'final_5mo',
  e.hire_date + interval '150 days',
  case
    when e.hire_date + interval '150 days' < current_date then 'overdue'
    else 'pending'
  end
from employees e
join employment_types et on et.id = e.employment_type_id
where et.code = 'PROB'
  and e.status = 'active'
  and not exists (
    select 1 from probationary_reviews pr
    where pr.employee_id = e.id and pr.review_type = 'final_5mo'
  )
on conflict do nothing;
