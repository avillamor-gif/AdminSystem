-- Migration: Add new field groups to PIM Configuration
-- This adds support for: dependents, immigration, assets, qualifications, security
-- Run this AFTER the initial employee-data-management-schema.sql

-- =====================================================
-- 1. UPDATE PIM FIELD CONFIG TABLE
-- =====================================================

-- Drop the old constraint
ALTER TABLE pim_field_config DROP CONSTRAINT IF EXISTS pim_field_config_field_group_check;

-- Add new constraint with all 13 field groups
ALTER TABLE pim_field_config ADD CONSTRAINT pim_field_config_field_group_check 
  CHECK (field_group IN ('basic', 'contact', 'job', 'personal', 'emergency', 'documents', 'salary', 'benefits', 'dependents', 'immigration', 'assets', 'qualifications', 'security'));

-- =====================================================
-- 2. UPDATE CUSTOM FIELDS TABLE
-- =====================================================

-- Drop the old constraint
ALTER TABLE employee_custom_fields DROP CONSTRAINT IF EXISTS employee_custom_fields_category_check;

-- Add new constraint with all categories
ALTER TABLE employee_custom_fields ADD CONSTRAINT employee_custom_fields_category_check 
  CHECK (category IN ('personal', 'contact', 'job', 'emergency', 'education', 'certification', 'custom', 'dependents', 'immigration', 'assets', 'qualifications', 'security'));

-- =====================================================
-- 3. ADD SAMPLE FIELDS FOR NEW GROUPS
-- =====================================================

-- Dependents fields
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('dependent_name', 'Dependent Name', 'dependents', false, false, 1, 'internal'),
  ('dependent_relationship', 'Relationship', 'dependents', false, false, 2, 'internal'),
  ('dependent_dob', 'Date of Birth', 'dependents', false, true, 3, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- Immigration fields
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('passport_number', 'Passport Number', 'immigration', false, true, 1, 'confidential'),
  ('passport_expiry', 'Passport Expiry Date', 'immigration', false, true, 2, 'confidential'),
  ('visa_type', 'Visa Type', 'immigration', false, true, 3, 'restricted'),
  ('visa_expiry', 'Visa Expiry Date', 'immigration', false, true, 4, 'restricted'),
  ('work_permit_number', 'Work Permit Number', 'immigration', false, true, 5, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- Assets fields
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('assigned_laptop', 'Assigned Laptop', 'assets', false, false, 1, 'internal'),
  ('laptop_serial', 'Laptop Serial Number', 'assets', false, false, 2, 'internal'),
  ('assigned_phone', 'Assigned Phone', 'assets', false, false, 3, 'internal'),
  ('phone_imei', 'Phone IMEI', 'assets', false, false, 4, 'internal')
ON CONFLICT (field_name) DO NOTHING;

-- Qualifications fields
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('highest_education', 'Highest Education', 'qualifications', false, false, 1, 'public'),
  ('degree_field', 'Degree/Field of Study', 'qualifications', false, false, 2, 'public'),
  ('institution', 'Institution', 'qualifications', false, false, 3, 'public'),
  ('graduation_year', 'Graduation Year', 'qualifications', false, false, 4, 'public'),
  ('certifications', 'Certifications', 'qualifications', false, false, 5, 'public'),
  ('languages', 'Languages', 'qualifications', false, false, 6, 'public')
ON CONFLICT (field_name) DO NOTHING;

-- Security fields
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order, access_level) VALUES
  ('two_factor_enabled', 'Two-Factor Authentication', 'security', false, false, 1, 'internal'),
  ('last_password_change', 'Last Password Change', 'security', false, false, 2, 'internal'),
  ('data_access_level', 'Data Access Level', 'security', false, true, 3, 'confidential'),
  ('security_clearance', 'Security Clearance', 'security', false, true, 4, 'confidential')
ON CONFLICT (field_name) DO NOTHING;

-- =====================================================
-- 4. ADD SAMPLE CUSTOM FIELDS FOR NEW CATEGORIES
-- =====================================================

INSERT INTO employee_custom_fields (name, field_key, field_type, category, description, visible, editable, show_in_profile) VALUES
  ('Number of Dependents', 'num_dependents', 'number', 'dependents', 'Total number of dependents', true, true, true),
  ('Citizenship Status', 'citizenship_status', 'select', 'immigration', 'Current citizenship or residency status', true, false, true),
  ('Primary Device Type', 'primary_device', 'select', 'assets', 'Primary work device type', true, false, true),
  ('Professional Licenses', 'prof_licenses', 'textarea', 'qualifications', 'Professional licenses held', true, true, true),
  ('Security Training Completed', 'security_training', 'checkbox', 'security', 'Completed security awareness training', true, false, true)
ON CONFLICT (field_key) DO NOTHING;

-- =====================================================
-- 5. UPDATE FIELD OPTIONS FOR CUSTOM FIELDS
-- =====================================================

UPDATE employee_custom_fields 
SET options = '{"options": ["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Dependent Visa"]}'::jsonb
WHERE field_key = 'citizenship_status';

UPDATE employee_custom_fields 
SET options = '{"options": ["Laptop", "Desktop", "Tablet", "Mobile Phone", "Multiple Devices"]}'::jsonb
WHERE field_key = 'primary_device';

COMMENT ON COLUMN pim_field_config.field_group IS 'Field grouping: basic, contact, job, personal, emergency, documents, salary, benefits, dependents, immigration, assets, qualifications, security';
COMMENT ON COLUMN employee_custom_fields.category IS 'Field category: personal, contact, job, emergency, education, certification, custom, dependents, immigration, assets, qualifications, security';
