-- Create sample probationary employees
-- First, get the IDs we need
SELECT 
  'Step 1: Getting required IDs...' AS info;

-- Check employment types
SELECT id, category FROM employment_types WHERE category = 'probationary' LIMIT 1;

-- Check departments
SELECT id, name FROM departments LIMIT 1;

-- Check job titles
SELECT id, title FROM job_titles LIMIT 1;

-- Now create sample probationary employees
-- Use today's date for hire_date, so reviews will be based on that
INSERT INTO employees (
  employee_id,
  first_name,
  last_name,
  email,
  phone,
  hire_date,
  employment_type_id,
  department_id,
  job_title_id,
  status
)
SELECT
  'PROB-TEST-001' AS employee_id,
  'Test' AS first_name,
  'Probationary One' AS last_name,
  'test.probationary1@iboninternational.org' AS email,
  '+63-2-8-123-4567' AS phone,
  CURRENT_DATE - INTERVAL '30 days' AS hire_date,  -- Hired 30 days ago
  et.id,
  d.id,
  jt.id,
  'active'
FROM employment_types et
CROSS JOIN departments d
CROSS JOIN job_titles jt
WHERE et.category = 'probationary'
  AND d.name = 'General'
  AND jt.title = 'Staff'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create probationary reviews for the test employee
INSERT INTO probationary_reviews (
  employee_id,
  review_type,
  due_date,
  status
)
SELECT
  e.id,
  'interim_3mo' AS review_type,
  e.hire_date + INTERVAL '90 days' AS due_date,
  CASE 
    WHEN e.hire_date + INTERVAL '90 days' < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END AS status
FROM employees e
WHERE e.employee_id = 'PROB-TEST-001'
ON CONFLICT DO NOTHING;

INSERT INTO probationary_reviews (
  employee_id,
  review_type,
  due_date,
  status
)
SELECT
  e.id,
  'final_5mo' AS review_type,
  e.hire_date + INTERVAL '150 days' AS due_date,
  'pending' AS status
FROM employees e
WHERE e.employee_id = 'PROB-TEST-001'
ON CONFLICT DO NOTHING;

SELECT 'Sample probationary data created successfully!' AS result;
