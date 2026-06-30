-- Update Performance permissions to match active pages
-- Run this in Supabase SQL editor to refresh Edit Role modal options.

begin;

-- Remove deprecated performance permissions from role assignments first.
delete from role_permissions
where permission_id in (
  select id from permissions where code in (
    'admin.performance.review_cycles',
    'admin.performance.rating_scales',
    'admin.performance.goal_templates',
    'admin.performance.competency_models',
    'admin.performance.kpi_frameworks',
    'admin.performance.360_feedback',
    'admin.performance.review_cycles.create',
    'admin.performance.review_cycles.edit',
    'admin.performance.goal_templates.manage'
  )
);

-- Remove deprecated performance permissions.
delete from permissions
where code in (
  'admin.performance.review_cycles',
  'admin.performance.rating_scales',
  'admin.performance.goal_templates',
  'admin.performance.competency_models',
  'admin.performance.kpi_frameworks',
  'admin.performance.360_feedback',
  'admin.performance.review_cycles.create',
  'admin.performance.review_cycles.edit',
  'admin.performance.goal_templates.manage'
);

-- Add current performance submenu permissions.
insert into permissions (name, code, category, description)
values
  ('Appraisal Management', 'admin.performance.appraisals', 'Admin Modules', 'Access Appraisal Management submenu'),
  ('Probationary Reviews', 'admin.performance.probationary_reviews', 'Admin Modules', 'Access Probationary Reviews submenu'),
  ('Appraisal Management: Manage', 'admin.performance.appraisals.manage', 'Admin Modules', 'Manage appraisal workflows'),
  ('Probationary Reviews: Manage', 'admin.performance.probationary_reviews.manage', 'Admin Modules', 'Manage probationary reviews')
on conflict (code) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description;

-- Grant new performance permissions to core admin roles.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p
  on p.code in (
    'admin.performance.appraisals',
    'admin.performance.probationary_reviews',
    'admin.performance.appraisals.manage',
    'admin.performance.probationary_reviews.manage'
  )
where lower(r.name) in ('super admin', 'admin', 'hr manager', 'executive director')
on conflict do nothing;

commit;
