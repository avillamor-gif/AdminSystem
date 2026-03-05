-- Complete PIM Field Configuration to match My Info tabs
-- This ensures all fields displayed in My Info are properly configured in PIM

-- =====================================================
-- PERSONAL DETAILS TAB (My Info) = PERSONAL GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('first_name', 'First Name', 'personal', true, false, 1, 'public'),
  ('middle_name', 'Middle Name', 'personal', false, false, 2, 'public'),
  ('last_name', 'Last Name', 'personal', true, false, 3, 'public'),
  ('date_of_birth', 'Date of Birth', 'personal', false, true, 4, 'internal'),
  ('gender', 'Gender', 'personal', false, false, 5, 'public'),
  ('marital_status', 'Marital Status', 'personal', false, false, 6, 'internal'),
  ('nationality', 'Nationality', 'personal', false, false, 7, 'public')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- CONTACT INFORMATION TAB (My Info) = CONTACT GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('work_email', 'Work Email', 'contact', true, false, 1, 'public'),
  ('personal_email', 'Personal Email', 'contact', false, false, 2, 'internal'),
  ('work_phone', 'Work Phone', 'contact', false, false, 5, 'public'),
  ('mobile_phone', 'Mobile Phone', 'contact', true, false, 6, 'public'),
  ('home_phone', 'Home Phone', 'contact', false, false, 7, 'internal'),
  ('home_address', 'Home Address', 'contact', false, false, 8, 'internal'),
  ('work_address', 'Work Address', 'contact', false, false, 9, 'public'),
  ('city', 'City', 'contact', false, false, 10, 'public'),
  ('state', 'State/Province', 'contact', false, false, 11, 'public'),
  ('postal_code', 'Postal Code', 'contact', false, false, 12, 'public'),
  ('country', 'Country', 'contact', false, false, 13, 'public')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- EMPLOYMENT DETAILS TAB (My Info) = JOB GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('employee_id', 'Employee ID', 'job', true, false, 1, 'public'),
  ('job_title_id', 'Job Title', 'job', true, false, 2, 'public'),
  ('department_id', 'Department', 'job', true, false, 3, 'public'),
  ('manager_id', 'Manager', 'job', false, false, 4, 'public'),
  ('hire_date', 'Hire Date', 'job', true, false, 5, 'public'),
  ('location_id', 'Work Location', 'job', false, false, 6, 'public'),
  ('status', 'Employment Status', 'job', true, false, 7, 'internal'),
  ('work_location_type', 'Work Location Type', 'job', false, false, 8, 'public')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- EMERGENCY CONTACTS TAB (My Info) = EMERGENCY GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('emergency_contact_name', 'Emergency Contact Name', 'emergency', false, false, 1, 'internal'),
  ('emergency_contact_relationship', 'Emergency Contact Relationship', 'emergency', false, false, 2, 'internal'),
  ('emergency_contact_phone', 'Emergency Contact Phone', 'emergency', false, false, 3, 'internal'),
  ('emergency_contact_address', 'Emergency Contact Address', 'emergency', false, false, 4, 'internal')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- BANKING & PAYROLL TAB (My Info) = SALARY GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('bank_name', 'Bank Name', 'salary', false, true, 2, 'confidential'),
  ('account_number', 'Account Number', 'salary', false, true, 3, 'confidential'),
  ('routing_number', 'Routing Number', 'salary', false, true, 4, 'confidential'),
  ('social_security', 'Social Security Number', 'salary', false, true, 8, 'confidential'),
  ('tax_id', 'Tax ID', 'salary', false, true, 9, 'confidential'),
  ('pag_ibig', 'Pag-IBIG Number', 'salary', false, true, 10, 'confidential'),
  ('philhealth', 'PhilHealth Number', 'salary', false, true, 11, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- BENEFITS & INSURANCE TAB (My Info) = BENEFITS GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('health_insurance', 'Health Insurance', 'benefits', false, true, 1, 'restricted'),
  ('life_insurance', 'Life Insurance', 'benefits', false, true, 2, 'restricted'),
  ('retirement_plan', 'Retirement Plan', 'benefits', false, true, 3, 'restricted')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- DEPENDENTS TAB (My Info) = DEPENDENTS GROUP (PIM)
-- =====================================================

-- Note: Dependents are managed in a separate table (employee_dependents)
-- These fields represent aggregated/summary information
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('dependent_name', 'Dependent Name', 'dependents', false, false, 1, 'internal'),
  ('dependent_relationship', 'Relationship', 'dependents', false, false, 2, 'internal'),
  ('dependent_dob', 'Date of Birth', 'dependents', false, true, 3, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- IMMIGRATION TAB (My Info) = IMMIGRATION GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('passport_number', 'Passport Number', 'immigration', false, true, 1, 'confidential'),
  ('passport_issue_date', 'Passport Issue Date', 'immigration', false, true, 2, 'confidential'),
  ('passport_expiry_date', 'Passport Expiry Date', 'immigration', false, true, 3, 'confidential'),
  ('passport_issuing_country', 'Passport Issuing Country', 'immigration', false, true, 4, 'restricted'),
  ('visa_type', 'Visa Type', 'immigration', false, true, 5, 'restricted'),
  ('visa_number', 'Visa Number', 'immigration', false, true, 6, 'confidential'),
  ('visa_issue_date', 'Visa Issue Date', 'immigration', false, true, 7, 'restricted'),
  ('visa_expiry_date', 'Visa Expiry Date', 'immigration', false, true, 8, 'restricted'),
  ('work_permit_number', 'Work Permit Number', 'immigration', false, true, 9, 'confidential'),
  ('work_permit_expiry', 'Work Permit Expiry', 'immigration', false, true, 10, 'confidential'),
  ('immigration_status', 'Immigration Status', 'immigration', false, true, 11, 'restricted')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- MY ASSETS & EQUIPMENT TAB (My Info) = ASSETS GROUP (PIM)
-- =====================================================

-- Note: Assets are managed in a separate table (employee_assets)
-- These fields represent summary/tracking information
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('assigned_laptop', 'Assigned Laptop', 'assets', false, false, 1, 'internal'),
  ('laptop_serial', 'Laptop Serial Number', 'assets', false, false, 2, 'internal'),
  ('assigned_phone', 'Assigned Phone', 'assets', false, false, 3, 'internal'),
  ('phone_imei', 'Phone IMEI', 'assets', false, false, 4, 'internal')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- QUALIFICATIONS TAB (My Info) = QUALIFICATIONS GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('highest_education', 'Highest Education', 'qualifications', false, false, 1, 'public'),
  ('degree_field', 'Degree/Field of Study', 'qualifications', false, false, 2, 'public'),
  ('institution', 'Institution', 'qualifications', false, false, 3, 'public'),
  ('graduation_year', 'Graduation Year', 'qualifications', false, false, 4, 'public'),
  ('certifications', 'Certifications', 'qualifications', false, false, 5, 'public'),
  ('languages', 'Languages', 'qualifications', false, false, 6, 'public'),
  ('education', 'Education', 'qualifications', false, false, 7, 'public'),
  ('skills', 'Skills', 'qualifications', false, false, 8, 'public')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- SECURITY & PRIVACY TAB (My Info) = SECURITY GROUP (PIM)
-- =====================================================

INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('two_factor_enabled', 'Two-Factor Authentication', 'security', false, false, 1, 'internal'),
  ('last_password_change', 'Last Password Change', 'security', false, false, 2, 'internal'),
  ('data_access_level', 'Data Access Level', 'security', false, true, 3, 'confidential'),
  ('security_clearance', 'Security Clearance', 'security', false, true, 4, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- Update existing fields to make them visible by default
UPDATE pim_field_config SET is_visible = true, show_in_employee_profile = true WHERE is_visible = false OR is_visible IS NULL;

-- Add comments
COMMENT ON TABLE pim_field_config IS 'PIM field configuration - controls visibility, editability, and access levels for all employee fields';
