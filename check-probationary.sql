-- Check existing probationary employees
SELECT 
  e.id,
  e.employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.hire_date,
  et.category,
  COUNT(pr.id) as review_count
FROM employees e
LEFT JOIN employment_types et ON e.employment_type_id = et.id
LEFT JOIN probationary_reviews pr ON e.id = pr.employee_id
WHERE et.category = 'probationary'
GROUP BY e.id, e.employee_id, e.first_name, e.last_name, e.email, e.hire_date, et.category
ORDER BY e.hire_date DESC;
