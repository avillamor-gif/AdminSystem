-- Sample test data for termination workflow testing

-- First, let's assign some assets to employees
-- Replace the employee_id values with actual IDs from your employees table

-- Example: Assign laptop to an employee
INSERT INTO employee_assets (employee_id, asset_type, asset_name, asset_number, serial_number, assigned_date, status, condition_on_assignment, purchase_value)
VALUES 
  -- Replace 'YOUR_EMPLOYEE_ID_HERE' with an actual employee UUID
  ('YOUR_EMPLOYEE_ID_HERE', 'laptop', 'MacBook Pro 16"', 'LAP-001', 'C02XJ0ACJHD4', '2024-01-15', 'assigned', 'good', 2500.00),
  ('YOUR_EMPLOYEE_ID_HERE', 'phone', 'iPhone 13 Pro', 'PHN-001', 'IMEI123456789', '2024-01-15', 'assigned', 'good', 1200.00),
  ('YOUR_EMPLOYEE_ID_HERE', 'access_card', 'Office Access Card', 'ACC-001', NULL, '2024-01-15', 'assigned', 'good', 25.00);

-- To find your employee IDs, run this query first:
-- SELECT id, employee_id, first_name, last_name FROM employees WHERE status = 'active' LIMIT 10;

-- Then replace the 'YOUR_EMPLOYEE_ID_HERE' above with one of those UUIDs
