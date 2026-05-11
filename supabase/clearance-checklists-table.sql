-- ============================================================
-- Clearance Checklist Tracking
-- Linked to termination_requests (resignation or separation)
-- Dept heads / admin sign off on each checklist item
-- Finance releases final pay once all items are cleared
-- ============================================================

create table if not exists clearance_checklists (
  id                      uuid primary key default gen_random_uuid(),
  termination_request_id  uuid not null references termination_requests(id) on delete cascade,
  employee_id             uuid not null references employees(id) on delete cascade,
  status                  text not null default 'open'
                            check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  last_working_date       date,
  final_pay_released      boolean not null default false,
  final_pay_released_at   timestamptz,
  final_pay_released_by   uuid references employees(id),
  notes                   text,
  created_by              uuid references employees(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists clearance_checklists_employee_id_idx on clearance_checklists(employee_id);
create index if not exists clearance_checklists_termination_request_id_idx on clearance_checklists(termination_request_id);

-- ── Checklist Items ───────────────────────────────────────────

create table if not exists clearance_checklist_items (
  id                  uuid primary key default gen_random_uuid(),
  checklist_id        uuid not null references clearance_checklists(id) on delete cascade,
  department          text not null,      -- e.g. 'IT', 'Finance', 'HR', 'Immediate Supervisor'
  description         text not null,      -- e.g. 'Return laptop and peripherals'
  is_cleared          boolean not null default false,
  cleared_by          uuid references employees(id),
  cleared_at          timestamptz,
  remarks             text,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists clearance_checklist_items_checklist_id_idx on clearance_checklist_items(checklist_id);

-- ── Updated-at triggers ───────────────────────────────────────

create or replace function update_clearance_checklists_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clearance_checklists_updated_at on clearance_checklists;
create trigger set_clearance_checklists_updated_at
  before update on clearance_checklists
  for each row execute function update_clearance_checklists_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

alter table clearance_checklists enable row level security;
alter table clearance_checklist_items enable row level security;

-- Admins/HR can manage all
create policy "Admins can manage clearance checklists"
  on clearance_checklists for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'hr')
    )
  );

create policy "Admins can manage clearance checklist items"
  on clearance_checklist_items for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'hr')
    )
  );

-- Employees can view their own clearance
create policy "Employees can view own clearance checklist"
  on clearance_checklists for select
  using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.employee_id = clearance_checklists.employee_id
    )
  );

create policy "Employees can view own clearance items"
  on clearance_checklist_items for select
  using (
    exists (
      select 1 from clearance_checklists cc
      join user_roles ur on ur.employee_id = cc.employee_id
      where cc.id = clearance_checklist_items.checklist_id
        and ur.user_id = auth.uid()
    )
  );

-- Department heads can clear items for their department
-- (treated as admin permission — use admin API route for writes)

-- ── Default checklist items helper ───────────────────────────
-- Call this after creating a clearance_checklist to populate standard items
-- Usage: select seed_clearance_items('<checklist_uuid>');

create or replace function seed_clearance_items(p_checklist_id uuid)
returns void language plpgsql as $$
begin
  insert into clearance_checklist_items (checklist_id, department, description, sort_order)
  values
    (p_checklist_id, 'Immediate Supervisor', 'Turnover of work and pending tasks', 1),
    (p_checklist_id, 'IT',                  'Return laptop, access cards, and peripherals', 2),
    (p_checklist_id, 'IT',                  'Revoke system accounts and email access', 3),
    (p_checklist_id, 'HR',                  'Return company ID and HR-issued documents', 4),
    (p_checklist_id, 'HR',                  'Final leave balance computation', 5),
    (p_checklist_id, 'Finance',             'Settle outstanding cash advances or loans', 6),
    (p_checklist_id, 'Finance',             'Process final pay computation and release', 7),
    (p_checklist_id, 'Admin',               'Return any other company property', 8);
end;
$$;
