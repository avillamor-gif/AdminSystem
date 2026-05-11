-- ============================================================
-- Disciplinary Tracking
-- Per IBON Manual: progressive discipline for infractions
-- Tracks warnings, suspension, and dismissal recommendations
-- Offense types: Tardiness, AWOL, Misconduct, Insubordination, etc.
-- Penalty levels: verbal_warning → written_warning → suspension → dismissal
-- ============================================================

create table if not exists disciplinary_records (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references employees(id) on delete cascade,
  offense_type    text not null check (offense_type in (
                    'tardiness', 'awol', 'misconduct', 'insubordination',
                    'negligence', 'dishonesty', 'harassment', 'policy_violation', 'other'
                  )),
  offense_date    date not null,
  offense_count   integer not null default 1,   -- cumulative count for this offense_type
  penalty_level   text not null check (penalty_level in (
                    'verbal_warning', 'written_warning_1', 'written_warning_2',
                    'suspension_1day', 'suspension_3day', 'suspension_5day', 'dismissal'
                  )),
  description     text not null,
  status          text not null default 'open'
                    check (status in ('open', 'acknowledged', 'appealed', 'closed', 'overturned')),
  issued_by       uuid references employees(id),
  acknowledged_at timestamptz,
  resolution_notes text,
  attachments     jsonb,    -- array of {name, url} for supporting documents
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists disciplinary_records_employee_id_idx on disciplinary_records(employee_id);
create index if not exists disciplinary_records_offense_type_idx on disciplinary_records(offense_type);
create index if not exists disciplinary_records_status_idx on disciplinary_records(status);

-- Updated-at trigger
create or replace function update_disciplinary_records_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_disciplinary_records_updated_at on disciplinary_records;
create trigger set_disciplinary_records_updated_at
  before update on disciplinary_records
  for each row execute function update_disciplinary_records_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

alter table disciplinary_records enable row level security;

-- Admins/HR can manage all
create policy "Admins can manage disciplinary records"
  on disciplinary_records for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'hr')
    )
  );

-- Employees can view their own records
create policy "Employees can view own disciplinary records"
  on disciplinary_records for select
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.employee_id = disciplinary_records.employee_id
    )
  );

-- Supervisors can view records for their direct reports
create policy "Supervisors can view team disciplinary records"
  on disciplinary_records for select
  using (
    exists (
      select 1 from employees e
      join employees mgr on mgr.id = e.manager_id
      join user_roles ur on ur.employee_id = mgr.id
      where e.id = disciplinary_records.employee_id
        and ur.user_id = auth.uid()
    )
  );

-- ── Helper: calculate next penalty level based on offense count ──
-- Per IBON progressive discipline schedule:
--   1st offense: verbal_warning
--   2nd offense: written_warning_1
--   3rd offense: written_warning_2
--   4th offense: suspension_1day
--   5th offense: suspension_3day
--   6th+ offense: dismissal
-- (Adjust by offense_type if needed)

create or replace function next_penalty_level(p_offense_count integer)
returns text language plpgsql as $$
begin
  case p_offense_count
    when 1 then return 'verbal_warning';
    when 2 then return 'written_warning_1';
    when 3 then return 'written_warning_2';
    when 4 then return 'suspension_1day';
    when 5 then return 'suspension_3day';
    else        return 'dismissal';
  end case;
end;
$$;
