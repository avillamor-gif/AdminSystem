-- Fix Alberto Villamor account mapping
-- This script finds the correct Alberto Villamor employee record and remaps the account

begin;

-- Update user_roles to point to the correct Alberto Villamor employee
update user_roles
set employee_id = (
  select id from employees 
  where first_name = 'Alberto' and last_name = 'Villamor'
  order by created_at desc
  limit 1
)
where user_id = (
  select id from auth.users 
  where email = 'avillamor@iboninternational.org'
);

-- Verify the fix worked
select ur.user_id, ur.employee_id, e.first_name, e.last_name, e.email as emp_email
from user_roles ur
join employees e on ur.employee_id = e.id
where ur.user_id = (
  select id from auth.users 
  where email = 'avillamor@iboninternational.org'
);

commit;
