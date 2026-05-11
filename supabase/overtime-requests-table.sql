-- ============================================================
-- Overtime, Official Business (OB), and Stay-On Request Tracking
-- Per IBON Manual:
--   Overtime (OT): +25% ordinary days, +30% rest days/holidays
--   Stay-On: employee stays beyond shift (same rate as OT)
--   Official Business (OB): off-site work, no OT pay — attendance credit only
-- ============================================================

create table if not exists overtime_requests (
  id                  uuid primary key default gen_random_uuid(),
  request_number      text unique not null,
  employee_id         uuid not null references employees(id) on delete cascade,
  request_type        text not null check (request_type in ('overtime', 'stay_on', 'official_business')),
  request_date        date not null,           -- the day the OT/OB is occurring
  start_time          time not null,
  end_time            time not null,
  total_hours         numeric(5,2),            -- computed or entered
  location            text,                    -- for OB: where they're going
  purpose             text not null,
  day_type            text not null default 'regular'
                        check (day_type in ('regular', 'rest_day', 'special_holiday', 'regular_holiday')),
  ot_rate_multiplier  numeric(4,2),            -- e.g. 1.25, 1.30 — auto-set from day_type
  estimated_ot_pay    numeric(10,2),           -- computed estimate
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by         uuid references employees(id),
  approved_at         timestamptz,
  rejection_reason    text,
  requested_by        uuid references employees(id),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists overtime_requests_employee_id_idx on overtime_requests(employee_id);
create index if not exists overtime_requests_request_date_idx on overtime_requests(request_date);
create index if not exists overtime_requests_status_idx on overtime_requests(status);

-- Updated-at trigger
create or replace function update_overtime_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_overtime_requests_updated_at on overtime_requests;
create trigger set_overtime_requests_updated_at
  before update on overtime_requests
  for each row execute function update_overtime_requests_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

alter table overtime_requests enable row level security;

-- Admins/HR can manage all
create policy "Admins can manage overtime requests"
  on overtime_requests for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'hr')
    )
  );

-- Employees can manage their own
create policy "Employees can manage own overtime requests"
  on overtime_requests for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.employee_id = overtime_requests.employee_id
    )
  );

-- Supervisors can view and approve their team's requests
create policy "Supervisors can view team overtime requests"
  on overtime_requests for select
  using (
    exists (
      select 1 from employees e
      join employees mgr on mgr.id = e.manager_id
      join user_roles ur on ur.employee_id = mgr.id
      where e.id = overtime_requests.employee_id
        and ur.user_id = auth.uid()
    )
  );
