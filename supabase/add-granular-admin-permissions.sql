-- ============================================================
-- Add Granular Admin Permissions for RBAC
-- Expand permission codes for fine-grained access control
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. Clear existing granular permissions to avoid conflicts
-- (Keep only top-level admin.* and governance/membership which are good)
DELETE FROM permissions 
WHERE category IN ('Admin Modules', 'Admin')
AND code NOT IN (
  'admin.manage', 'admin.user_access', 'admin.organization', 
  'admin.job_management', 'admin.employee_data', 'admin.time_attendance',
  'admin.leave_management', 'admin.payroll_benefits', 'admin.performance',
  'admin.learning', 'admin.recruitment', 'admin.compliance', 'admin.analytics',
  'admin.system_config', 'admin.travel', 'admin.assets', 'admin.supplies',
  'admin.publications', 'admin.internship', 'admin.manage'
);

-- 2. Insert granular admin permissions (module-level and feature-level)
INSERT INTO permissions (name, code, category, description)
VALUES
-- User Access & Security
('User Access: View', 'admin.user_access.view', 'Admin Modules', 'View user access settings'),
('User Access: Manage', 'admin.user_access.manage', 'Admin Modules', 'Manage user access and security'),
('User Management: Create', 'admin.user_access.user_management.create', 'Admin Modules', 'Create new user accounts'),
('User Management: Edit', 'admin.user_access.user_management.edit', 'Admin Modules', 'Edit existing user accounts'),
('User Management: Delete', 'admin.user_access.user_management.delete', 'Admin Modules', 'Delete user accounts'),
('RBAC: View', 'admin.user_access.rbac.view', 'Admin Modules', 'View roles and permissions'),
('RBAC: Manage', 'admin.user_access.rbac.manage', 'Admin Modules', 'Manage roles, permissions, and access control'),

-- Organization Structure
('Organization: View', 'admin.organization.view', 'Admin Modules', 'View organization structure'),
('Organization: Manage', 'admin.organization.manage', 'Admin Modules', 'Manage organization structure'),
('Company Structure: View', 'admin.organization.company_structure.view', 'Admin Modules', 'View company hierarchy'),
('Company Structure: Edit', 'admin.organization.company_structure.edit', 'Admin Modules', 'Edit company structure and departments'),
('Locations: View', 'admin.organization.locations_management.view', 'Admin Modules', 'View office locations'),
('Locations: Manage', 'admin.organization.locations_management.manage', 'Admin Modules', 'Create, edit, delete locations'),
('Location Types: Manage', 'admin.organization.location_types.manage', 'Admin Modules', 'Manage location types'),
('Department Hierarchy: View', 'admin.organization.department_hierarchy.view', 'Admin Modules', 'View department structure'),
('Department Hierarchy: Edit', 'admin.organization.department_hierarchy.edit', 'Admin Modules', 'Edit department hierarchy'),

-- Job Management
('Job Management: View', 'admin.job_management.view', 'Admin Modules', 'View job titles and descriptions'),
('Job Management: Manage', 'admin.job_management.manage', 'Admin Modules', 'Manage job management'),
('Job Titles: Create', 'admin.job_management.job_titles.create', 'Admin Modules', 'Create new job titles'),
('Job Titles: Edit', 'admin.job_management.job_titles.edit', 'Admin Modules', 'Edit job titles'),
('Job Titles: Delete', 'admin.job_management.job_titles.delete', 'Admin Modules', 'Delete job titles'),
('Job Descriptions: View', 'admin.job_management.job_descriptions.view', 'Admin Modules', 'View job descriptions'),
('Job Descriptions: Create', 'admin.job_management.job_descriptions.create', 'Admin Modules', 'Create job descriptions'),
('Job Descriptions: Edit', 'admin.job_management.job_descriptions.edit', 'Admin Modules', 'Edit job descriptions'),
('Job Descriptions: Delete', 'admin.job_management.job_descriptions.delete', 'Admin Modules', 'Delete job descriptions'),
('Pay Grades: Manage', 'admin.job_management.pay_grades.manage', 'Admin Modules', 'Manage pay grades'),
('Employment Types: Manage', 'admin.job_management.employment_types.manage', 'Admin Modules', 'Manage employment types'),

-- Employee Data Management
('Employee Data: View', 'admin.employee_data.view', 'Admin Modules', 'View employee data'),
('Employee Data: Manage', 'admin.employee_data.manage', 'Admin Modules', 'Manage employee data'),
('Employee Profiles: View', 'admin.employee_data.employee_profiles.view', 'Admin Modules', 'View employee profiles'),
('Employee Profiles: Edit', 'admin.employee_data.employee_profiles.edit', 'Admin Modules', 'Edit employee profiles'),
('Employee Records: View', 'admin.employee_data.employee_records.view', 'Admin Modules', 'View employee records'),
('Employee Records: Manage', 'admin.employee_data.employee_records.manage', 'Admin Modules', 'Manage employee records'),
('Termination & Activation: Manage', 'admin.employee_data.termination_activation.manage', 'Admin Modules', 'Process employee terminations and reactivations'),

-- Time & Attendance
('Time & Attendance: View', 'admin.time_attendance.view', 'Admin Modules', 'View time and attendance data'),
('Time & Attendance: Manage', 'admin.time_attendance.manage', 'Admin Modules', 'Manage time and attendance settings'),
('Work Schedules: View', 'admin.time_attendance.work_schedules.view', 'Admin Modules', 'View work schedules'),
('Work Schedules: Edit', 'admin.time_attendance.work_schedules.edit', 'Admin Modules', 'Edit work schedules'),
('Shift Patterns: Manage', 'admin.time_attendance.shift_patterns.manage', 'Admin Modules', 'Manage shift patterns'),
('Attendance Policies: View', 'admin.time_attendance.attendance_policies.view', 'Admin Modules', 'View attendance policies'),
('Attendance Policies: Manage', 'admin.time_attendance.attendance_policies.manage', 'Admin Modules', 'Manage attendance policies'),

-- Leave & Absence
('Leave Management: View', 'admin.leave_management.view', 'Admin Modules', 'View leave management settings'),
('Leave Management: Manage', 'admin.leave_management.manage', 'Admin Modules', 'Manage leave management'),
('Leave Types: View', 'admin.leave_management.leave_types.view', 'Admin Modules', 'View leave types'),
('Leave Types: Create', 'admin.leave_management.leave_types.create', 'Admin Modules', 'Create leave types'),
('Leave Types: Edit', 'admin.leave_management.leave_types.edit', 'Admin Modules', 'Edit leave types'),
('Leave Types: Delete', 'admin.leave_management.leave_types.delete', 'Admin Modules', 'Delete leave types'),
('Leave Policies: View', 'admin.leave_management.leave_policies.view', 'Admin Modules', 'View leave policies'),
('Leave Policies: Manage', 'admin.leave_management.leave_policies.manage', 'Admin Modules', 'Manage leave policies'),
('Accrual Rules: Manage', 'admin.leave_management.accrual_rules.manage', 'Admin Modules', 'Manage leave accrual rules'),
('Holiday Calendar: Manage', 'admin.leave_management.holiday_calendar.manage', 'Admin Modules', 'Manage holiday calendar'),

-- Payroll & Benefits
('Payroll & Benefits: View', 'admin.payroll_benefits.view', 'Admin Modules', 'View payroll and benefits'),
('Payroll & Benefits: Manage', 'admin.payroll_benefits.manage', 'Admin Modules', 'Manage payroll and benefits'),
('Pay Components: Create', 'admin.payroll_benefits.pay_components.create', 'Admin Modules', 'Create pay components'),
('Pay Components: Edit', 'admin.payroll_benefits.pay_components.edit', 'Admin Modules', 'Edit pay components'),
('Benefits Plans: View', 'admin.payroll_benefits.benefits_plans.view', 'Admin Modules', 'View benefits plans'),
('Benefits Plans: Manage', 'admin.payroll_benefits.benefits_plans.manage', 'Admin Modules', 'Manage benefits plans'),

-- Performance
('Performance: View', 'admin.performance.view', 'Admin Modules', 'View performance management'),
('Performance: Manage', 'admin.performance.manage', 'Admin Modules', 'Manage performance management'),
('Appraisal Management', 'admin.performance.appraisals', 'Admin Modules', 'Access Appraisal Management submenu'),
('Probationary Reviews', 'admin.performance.probationary_reviews', 'Admin Modules', 'Access Probationary Reviews submenu'),
('Appraisal Management: Manage', 'admin.performance.appraisals.manage', 'Admin Modules', 'Manage appraisal workflows'),
('Probationary Reviews: Manage', 'admin.performance.probationary_reviews.manage', 'Admin Modules', 'Manage probationary reviews'),

-- Learning & Development
('Learning & Development: View', 'admin.learning_development.view', 'Admin Modules', 'View learning and development'),
('Learning & Development: Manage', 'admin.learning_development.manage', 'Admin Modules', 'Manage learning and development'),
('Training Programs: View', 'admin.learning_development.training_programs.view', 'Admin Modules', 'View training programs'),
('Training Programs: Create', 'admin.learning_development.training_programs.create', 'Admin Modules', 'Create training programs'),
('Training Programs: Edit', 'admin.learning_development.training_programs.edit', 'Admin Modules', 'Edit training programs'),
('Certifications: Manage', 'admin.learning_development.certifications.manage', 'Admin Modules', 'Manage certifications'),

-- Recruitment
('Recruitment: View', 'admin.recruitment.view', 'Admin Modules', 'View recruitment'),
('Recruitment: Manage', 'admin.recruitment.manage', 'Admin Modules', 'Manage recruitment'),
('Job Postings: Create', 'admin.recruitment.job_postings.create', 'Admin Modules', 'Post job openings'),
('Job Postings: Edit', 'admin.recruitment.job_postings.edit', 'Admin Modules', 'Edit job postings'),
('Candidates: View', 'admin.recruitment.candidates.view', 'Admin Modules', 'View job candidates'),
('Candidates: Manage', 'admin.recruitment.candidates.manage', 'Admin Modules', 'Manage candidates'),

-- Compliance & Audit
('Compliance & Audit: View', 'admin.compliance_audit.view', 'Admin Modules', 'View compliance and audit'),
('Compliance & Audit: Manage', 'admin.compliance_audit.manage', 'Admin Modules', 'Manage compliance and audit'),
('Audit Trails: View', 'admin.compliance_audit.audit_trails.view', 'Admin Modules', 'View audit logs'),
('Compliance Policies: View', 'admin.compliance_audit.compliance_policies.view', 'Admin Modules', 'View compliance policies'),
('Compliance Policies: Manage', 'admin.compliance_audit.compliance_policies.manage', 'Admin Modules', 'Manage compliance policies'),

-- Analytics & Reporting
('Analytics & Reporting: View', 'admin.analytics_reports.view', 'Admin Modules', 'View reports and analytics'),
('Analytics & Reporting: Manage', 'admin.analytics_reports.manage', 'Admin Modules', 'Manage reports and analytics'),
('Reports: Create', 'admin.analytics_reports.reports.create', 'Admin Modules', 'Create custom reports'),
('Reports: Edit', 'admin.analytics_reports.reports.edit', 'Admin Modules', 'Edit custom reports'),
('Dashboards: Manage', 'admin.analytics_reports.dashboards.manage', 'Admin Modules', 'Configure dashboards'),

-- System Configuration
('System Configuration: View', 'admin.system_config.view', 'Admin Modules', 'View system configuration'),
('System Configuration: Manage', 'admin.system_config.manage', 'Admin Modules', 'Manage system configuration'),
('General Settings: View', 'admin.system_config.general_settings.view', 'Admin Modules', 'View general settings'),
('General Settings: Edit', 'admin.system_config.general_settings.edit', 'Admin Modules', 'Edit general settings'),
('Email Configuration: Manage', 'admin.system_config.email_configuration.manage', 'Admin Modules', 'Configure email settings'),
('Workflow Settings: Manage', 'admin.system_config.workflow_settings.manage', 'Admin Modules', 'Manage workflow settings'),
('API Settings: Manage', 'admin.system_config.api_settings.manage', 'Admin Modules', 'Manage API settings'),

-- Travel
('Travel: View', 'admin.travel.view', 'Admin Modules', 'View travel management'),
('Travel: Manage', 'admin.travel.manage', 'Admin Modules', 'Manage travel management'),
('Travel Requests: View', 'admin.travel.travel_requests.view', 'Admin Modules', 'View travel requests'),
('Travel Requests: Manage', 'admin.travel.travel_requests.manage', 'Admin Modules', 'Manage travel requests'),
('Travel Policies: Manage', 'admin.travel.travel_policies.manage', 'Admin Modules', 'Manage travel policies'),

-- Asset Management
('Asset Management: View', 'admin.assets.view', 'Admin Modules', 'View asset management'),
('Asset Management: Manage', 'admin.assets.manage', 'Admin Modules', 'Manage asset management'),
('Assets: Create', 'admin.assets.assets.create', 'Admin Modules', 'Create assets'),
('Assets: Edit', 'admin.assets.assets.edit', 'Admin Modules', 'Edit assets'),
('Assets: Delete', 'admin.assets.assets.delete', 'Admin Modules', 'Delete assets'),
('Assignments: View', 'admin.assets.assignments.view', 'Admin Modules', 'View asset assignments'),
('Assignments: Manage', 'admin.assets.assignments.manage', 'Admin Modules', 'Manage asset assignments'),
('Maintenance: View', 'admin.assets.maintenance.view', 'Admin Modules', 'View maintenance records'),
('Maintenance: Manage', 'admin.assets.maintenance.manage', 'Admin Modules', 'Manage maintenance records'),

-- Office Equipment
('Equipment: View', 'admin.equipment.view', 'Admin Modules', 'View office equipment'),
('Equipment: Manage', 'admin.equipment.manage', 'Admin Modules', 'Manage office equipment'),
('Equipment Requests: View', 'admin.equipment.equipment_requests.view', 'Admin Modules', 'View equipment requests'),
('Equipment Requests: Approve', 'admin.equipment.equipment_requests.approve', 'Admin Modules', 'Approve equipment requests'),

-- Office Supplies
('Supplies: View', 'admin.supplies.view', 'Admin Modules', 'View office supplies'),
('Supplies: Manage', 'admin.supplies.manage', 'Admin Modules', 'Manage office supplies'),
('Supply Inventory: View', 'admin.supplies.supply_inventory.view', 'Admin Modules', 'View supply inventory'),
('Supply Inventory: Manage', 'admin.supplies.supply_inventory.manage', 'Admin Modules', 'Manage supply inventory'),
('Supply Requests: View', 'admin.supplies.supply_requests.view', 'Admin Modules', 'View supply requests'),
('Supply Requests: Approve', 'admin.supplies.supply_requests.approve', 'Admin Modules', 'Approve supply requests'),

-- Publications
('Publications: View', 'admin.publications.view', 'Admin Modules', 'View publications'),
('Publications: Manage', 'admin.publications.manage', 'Admin Modules', 'Manage publications'),
('Publications: Create', 'admin.publications.publications.create', 'Admin Modules', 'Create publications'),
('Publications: Edit', 'admin.publications.publications.edit', 'Admin Modules', 'Edit publications'),
('Publications: Delete', 'admin.publications.publications.delete', 'Admin Modules', 'Delete publications'),
('Publications: Approve', 'admin.publications.publications.approve', 'Admin Modules', 'Approve publications'),

-- Internship & Volunteer
('Internship & Volunteer: View', 'admin.internship_volunteer.view', 'Admin Modules', 'View internship and volunteer'),
('Internship & Volunteer: Manage', 'admin.internship_volunteer.manage', 'Admin Modules', 'Manage internship and volunteer'),
('Partner Institutions: Create', 'admin.internship_volunteer.partner_institutions.create', 'Admin Modules', 'Create partner institutions'),
('Partner Institutions: Edit', 'admin.internship_volunteer.partner_institutions.edit', 'Admin Modules', 'Edit partner institutions'),
('Enrollments: View', 'admin.internship_volunteer.enrollments.view', 'Admin Modules', 'View enrollments'),
('Enrollments: Manage', 'admin.internship_volunteer.enrollments.manage', 'Admin Modules', 'Manage enrollments'),

-- Monitoring & Evaluation
('Monitoring & Evaluation: View', 'admin.monitoring_evaluation.view', 'Admin Modules', 'View monitoring and evaluation'),
('Monitoring & Evaluation: Manage', 'admin.monitoring_evaluation.manage', 'Admin Modules', 'Manage monitoring and evaluation'),
('Programs: Create', 'admin.monitoring_evaluation.programs.create', 'Admin Modules', 'Create M&E programs'),
('Programs: Edit', 'admin.monitoring_evaluation.programs.edit', 'Admin Modules', 'Edit programs'),
('Data Entry: Submit', 'admin.monitoring_evaluation.data_entry.submit', 'Admin Modules', 'Submit M&E data')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = 'Admin Modules',
  description = EXCLUDED.description;

-- 3. Categorize as "Admin Modules"
UPDATE permissions 
SET category = 'Admin Modules' 
WHERE code LIKE 'admin.%' AND category != 'Admin Modules';

-- 4. Verify insertion
SELECT 
  category,
  COUNT(*) as count
FROM permissions
GROUP BY category
ORDER BY category;

-- 5. Show granular admin permissions
SELECT 
  code,
  name,
  category
FROM permissions
WHERE category = 'Admin Modules'
ORDER BY code;
