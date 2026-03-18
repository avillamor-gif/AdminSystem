-- ============================================================
-- Admin Submenu-Level Permissions
-- Run in Supabase SQL Editor AFTER add-admin-module-permissions.sql
-- ============================================================

INSERT INTO permissions (name, code, category, description) VALUES

-- ── User Access & Security ─────────────────────────────────────────────────
('User Management',                'admin.user_access.user_management',    'Admin Modules', 'Access User Management submenu'),
('Role-Based Access Control',      'admin.user_access.rbac',               'Admin Modules', 'Access RBAC submenu'),
('Security Policies',              'admin.user_access.security_policies',   'Admin Modules', 'Access Security Policies submenu'),
('Session Management',             'admin.user_access.session_management',  'Admin Modules', 'Access Session Management submenu'),
('Two-Factor Authentication',      'admin.user_access.two_factor',          'Admin Modules', 'Access Two-Factor Authentication submenu'),
('Password Policies',              'admin.user_access.password_policies',   'Admin Modules', 'Access Password Policies submenu'),

-- ── Organization Structure ─────────────────────────────────────────────────
('Company Structure',              'admin.organization.company_structure',       'Admin Modules', 'Access Company Structure submenu'),
('Locations Management',           'admin.organization.locations_management',    'Admin Modules', 'Access Locations Management submenu'),
('Location Types',                 'admin.organization.location_types',          'Admin Modules', 'Access Location Types submenu'),
('Department Hierarchy',           'admin.organization.department_hierarchy',    'Admin Modules', 'Access Department Hierarchy submenu'),
('International Operations',       'admin.organization.international_operations','Admin Modules', 'Access International Operations submenu'),
('Organizational Chart',           'admin.organization.organizational_chart',    'Admin Modules', 'Access Organizational Chart submenu'),

-- ── Job Management ────────────────────────────────────────────────────────
('Job Titles',                     'admin.job_management.job_titles',        'Admin Modules', 'Access Job Titles submenu'),
('Job Descriptions',               'admin.job_management.job_descriptions',  'Admin Modules', 'Access Job Descriptions submenu'),
('Pay Grades',                     'admin.job_management.pay_grades',        'Admin Modules', 'Access Pay Grades submenu'),
('Salary Structures',              'admin.job_management.salary_structures', 'Admin Modules', 'Access Salary Structures submenu'),
('Employment Types',               'admin.job_management.employment_types',  'Admin Modules', 'Access Employment Types submenu'),
('Job Categories',                 'admin.job_management.job_categories',    'Admin Modules', 'Access Job Categories submenu'),
('Career Paths',                   'admin.job_management.career_paths',      'Admin Modules', 'Access Career Paths submenu'),

-- ── Employee Data Management ───────────────────────────────────────────────
('Employee Profiles',              'admin.employee_data.employee_profiles',      'Admin Modules', 'Access Employee Profiles submenu'),
('Data Management',                'admin.employee_data.data_management',        'Admin Modules', 'Access Data Management submenu'),
('PIM Configuration',              'admin.employee_data.pim_configuration',      'Admin Modules', 'Access PIM Configuration submenu'),
('Reporting Fields',               'admin.employee_data.reporting_fields',       'Admin Modules', 'Access Reporting Fields submenu'),
('Data Import/Export',             'admin.employee_data.data_import_export',     'Admin Modules', 'Access Data Import/Export submenu'),
('Employee Records',               'admin.employee_data.employee_records',       'Admin Modules', 'Access Employee Records submenu'),
('Termination & Activation',       'admin.employee_data.termination_activation', 'Admin Modules', 'Access Termination & Activation submenu'),

-- ── Time & Attendance ─────────────────────────────────────────────────────
('Work Schedules',                 'admin.time_attendance.work_schedules',        'Admin Modules', 'Access Work Schedules submenu'),
('Shift Patterns',                 'admin.time_attendance.shift_patterns',        'Admin Modules', 'Access Shift Patterns submenu'),
('Overtime Rules',                 'admin.time_attendance.overtime_rules',        'Admin Modules', 'Access Overtime Rules submenu'),
('Break Policies',                 'admin.time_attendance.break_policies',        'Admin Modules', 'Access Break Policies submenu'),
('Time Tracking Methods',          'admin.time_attendance.time_tracking_methods', 'Admin Modules', 'Access Time Tracking Methods submenu'),
('Attendance Policies',            'admin.time_attendance.attendance_policies',   'Admin Modules', 'Access Attendance Policies submenu'),
('Attendance Reports',             'admin.time_attendance.reports',               'Admin Modules', 'Access Attendance Reports submenu'),

-- ── Leave Management ──────────────────────────────────────────────────────
('All Leave Requests',             'admin.leave_management.leave_requests',    'Admin Modules', 'Access All Leave Requests submenu'),
('Leave Credit Approvals',         'admin.leave_management.credit_approvals',  'Admin Modules', 'Access Leave Credit Approvals submenu'),
('Leave Types',                    'admin.leave_management.leave_types',       'Admin Modules', 'Access Leave Types submenu'),
('Accrual Rules',                  'admin.leave_management.accrual_rules',     'Admin Modules', 'Access Accrual Rules submenu'),
('Leave Policies',                 'admin.leave_management.leave_policies',    'Admin Modules', 'Access Leave Policies submenu'),
('Leave Balances',                 'admin.leave_management.leave_balances',    'Admin Modules', 'Access Leave Balances submenu'),
('Holiday Calendar',               'admin.leave_management.holiday_calendar',  'Admin Modules', 'Access Holiday Calendar submenu'),
('Absence Categories',             'admin.leave_management.absence_categories','Admin Modules', 'Access Absence Categories submenu'),
('Approval Workflows',             'admin.leave_management.approval_workflows','Admin Modules', 'Access Approval Workflows submenu'),

-- ── Payroll & Benefits ────────────────────────────────────────────────────
('Payroll Runs',                   'admin.payroll_benefits.payroll_runs',      'Admin Modules', 'Access Payroll Runs submenu'),
('Pay Components',                 'admin.payroll_benefits.pay_components',    'Admin Modules', 'Access Pay Components submenu'),
('Tax Configuration',              'admin.payroll_benefits.tax_configuration', 'Admin Modules', 'Access Tax Configuration submenu'),
('Benefits Plans',                 'admin.payroll_benefits.benefits_plans',    'Admin Modules', 'Access Benefits Plans submenu'),
('Deductions',                     'admin.payroll_benefits.deductions',        'Admin Modules', 'Access Deductions submenu'),
('Bonus Structures',               'admin.payroll_benefits.bonus_structures',  'Admin Modules', 'Access Bonus Structures submenu'),
('Reimbursements',                 'admin.payroll_benefits.reimbursements',    'Admin Modules', 'Access Reimbursements submenu'),

-- ── Performance Management ────────────────────────────────────────────────
('Review Cycles',                  'admin.performance.review_cycles',      'Admin Modules', 'Access Review Cycles submenu'),
('Rating Scales',                  'admin.performance.rating_scales',      'Admin Modules', 'Access Rating Scales submenu'),
('Goal Templates',                 'admin.performance.goal_templates',     'Admin Modules', 'Access Goal Templates submenu'),
('Competency Models',              'admin.performance.competency_models',  'Admin Modules', 'Access Competency Models submenu'),
('KPI Frameworks',                 'admin.performance.kpi_frameworks',     'Admin Modules', 'Access KPI Frameworks submenu'),
('360 Feedback',                   'admin.performance.360_feedback',       'Admin Modules', 'Access 360 Feedback submenu'),

-- ── Learning & Development ────────────────────────────────────────────────
('Training Programs',              'admin.learning.training_programs',   'Admin Modules', 'Access Training Programs submenu'),
('Certifications',                 'admin.learning.certifications',      'Admin Modules', 'Access Certifications submenu'),
('Skills Matrix',                  'admin.learning.skills_matrix',       'Admin Modules', 'Access Skills Matrix submenu'),
('Learning Paths',                 'admin.learning.learning_paths',      'Admin Modules', 'Access Learning Paths submenu'),
('External Training',              'admin.learning.external_training',   'Admin Modules', 'Access External Training submenu'),
('Compliance Training',            'admin.learning.compliance_training', 'Admin Modules', 'Access Compliance Training submenu'),

-- ── Recruitment Management ────────────────────────────────────────────────
('Job Postings',                   'admin.recruitment.job_postings',           'Admin Modules', 'Access Job Postings submenu'),
('Candidate Management',           'admin.recruitment.candidate_management',   'Admin Modules', 'Access Candidate Management submenu'),
('Application Tracking',           'admin.recruitment.application_tracking',   'Admin Modules', 'Access Application Tracking submenu'),
('Interview Scheduling',           'admin.recruitment.interview_scheduling',   'Admin Modules', 'Access Interview Scheduling submenu'),
('Candidate Pipeline',             'admin.recruitment.candidate_pipeline',     'Admin Modules', 'Access Candidate Pipeline submenu'),
('Hiring Workflows',               'admin.recruitment.hiring_workflows',       'Admin Modules', 'Access Hiring Workflows submenu'),
('Offer Management',               'admin.recruitment.offer_management',       'Admin Modules', 'Access Offer Management submenu'),
('Onboarding Process',             'admin.recruitment.onboarding_process',     'Admin Modules', 'Access Onboarding Process submenu'),
('Recruitment Analytics',          'admin.recruitment.recruitment_analytics',  'Admin Modules', 'Access Recruitment Analytics submenu'),
('Job Boards Integration',         'admin.recruitment.job_boards_integration', 'Admin Modules', 'Access Job Boards Integration submenu'),
('Talent Pool',                    'admin.recruitment.talent_pool',            'Admin Modules', 'Access Talent Pool submenu'),
('Screening Questions',            'admin.recruitment.screening_questions',    'Admin Modules', 'Access Screening Questions submenu'),

-- ── Compliance & Audit ────────────────────────────────────────────────────
('Regulatory Compliance',          'admin.compliance.regulatory_compliance',    'Admin Modules', 'Access Regulatory Compliance submenu'),
('Audit Trails',                   'admin.compliance.audit_trails',             'Admin Modules', 'Access Audit Trails submenu'),
('Data Retention Policies',        'admin.compliance.data_retention_policies',  'Admin Modules', 'Access Data Retention Policies submenu'),
('Privacy Settings',               'admin.compliance.privacy_settings',         'Admin Modules', 'Access Privacy Settings submenu'),
('GDPR Compliance',                'admin.compliance.gdpr_compliance',           'Admin Modules', 'Access GDPR Compliance submenu'),
('Labor Law Compliance',           'admin.compliance.labor_law_compliance',      'Admin Modules', 'Access Labor Law Compliance submenu'),

-- ── Analytics & Reporting ─────────────────────────────────────────────────
('Standard Reports',               'admin.analytics.standard_reports',          'Admin Modules', 'Access Standard Reports submenu'),
('Custom Reports',                 'admin.analytics.custom_reports',             'Admin Modules', 'Access Custom Reports submenu'),
('Dashboard Configuration',        'admin.analytics.dashboard_configuration',   'Admin Modules', 'Access Dashboard Configuration submenu'),
('Data Analytics',                 'admin.analytics.data_analytics',             'Admin Modules', 'Access Data Analytics submenu'),
('KPI Metrics',                    'admin.analytics.kpi_metrics',                'Admin Modules', 'Access KPI Metrics submenu'),
('Export Settings',                'admin.analytics.export_settings',            'Admin Modules', 'Access Export Settings submenu'),

-- ── System Configuration ──────────────────────────────────────────────────
('General Settings',               'admin.system_config.general_settings',       'Admin Modules', 'Access General Settings submenu'),
('Email Configuration',            'admin.system_config.email_configuration',    'Admin Modules', 'Access Email Configuration submenu'),
('Workflow Settings',              'admin.system_config.workflow_settings',       'Admin Modules', 'Access Workflow Settings submenu'),
('API Settings',                   'admin.system_config.api_settings',           'Admin Modules', 'Access API Settings submenu'),
('Backup & Recovery',              'admin.system_config.backup_recovery',         'Admin Modules', 'Access Backup & Recovery submenu'),
('Integration Management',         'admin.system_config.integration_management', 'Admin Modules', 'Access Integration Management submenu'),
('System Maintenance',             'admin.system_config.system_maintenance',      'Admin Modules', 'Access System Maintenance submenu'),

-- ── Travel Management ────────────────────────────────────────────────────
('Travel Requests',                'admin.travel.travel_requests',    'Admin Modules', 'Access Travel Requests submenu'),
('Travel Booking',                 'admin.travel.travel_booking',     'Admin Modules', 'Access Travel Booking submenu'),
('Expense Management',             'admin.travel.expense_management', 'Admin Modules', 'Access Expense Management submenu'),
('Travel Policies',                'admin.travel.travel_policies',    'Admin Modules', 'Access Travel Policies submenu'),
('Vendor Management (Travel)',     'admin.travel.vendor_management',  'Admin Modules', 'Access Vendor Management submenu'),
('Travel Analytics',               'admin.travel.travel_analytics',   'Admin Modules', 'Access Travel Analytics submenu'),

-- ── Asset Management ─────────────────────────────────────────────────────
('Assets',                         'admin.assets.assets',      'Admin Modules', 'Access Assets submenu'),
('Assignments',                    'admin.assets.assignments', 'Admin Modules', 'Access Assignments submenu'),
('Maintenance',                    'admin.assets.maintenance', 'Admin Modules', 'Access Maintenance submenu'),
('Asset Requests',                 'admin.assets.requests',    'Admin Modules', 'Access Asset Requests submenu'),
('Asset Setup',                    'admin.assets.setup',       'Admin Modules', 'Access Asset Setup submenu'),
('Asset Reports',                  'admin.assets.reports',     'Admin Modules', 'Access Asset Reports submenu'),

-- ── Office Supplies ───────────────────────────────────────────────────────
('Supply Inventory',               'admin.supplies.supply_inventory',  'Admin Modules', 'Access Supply Inventory submenu'),
('Supply Requests',                'admin.supplies.supply_requests',   'Admin Modules', 'Access Supply Requests submenu'),
('Purchase Orders',                'admin.supplies.purchase_orders',   'Admin Modules', 'Access Purchase Orders submenu'),
('Stock Levels',                   'admin.supplies.stock_levels',      'Admin Modules', 'Access Stock Levels submenu'),
('Supply Reports',                 'admin.supplies.reports',           'Admin Modules', 'Access Supply Reports submenu'),
('Supply Setup',                   'admin.supplies.setup',             'Admin Modules', 'Access Supply Setup submenu'),

-- ── Publications ─────────────────────────────────────────────────────────
('Publication Management',         'admin.publications.publication_management', 'Admin Modules', 'Access Publication Management submenu'),
('Add Publication',                'admin.publications.add_publication',        'Admin Modules', 'Access Add Publication submenu'),
('Printing Presses',               'admin.publications.printing_presses',       'Admin Modules', 'Access Printing Presses submenu'),
('Distribution Lists',             'admin.publications.distribution_lists',     'Admin Modules', 'Access Distribution Lists submenu'),
('Publication Reports',            'admin.publications.reports',                'Admin Modules', 'Access Publication Reports submenu'),
('Publication Setup',              'admin.publications.setup',                  'Admin Modules', 'Access Publication Setup submenu'),

-- ── Internship & Volunteer ────────────────────────────────────────────────
('Partner Institutions',           'admin.internship.partner_institutions', 'Admin Modules', 'Access Partner Institutions submenu'),
('Enrollments',                    'admin.internship.enrollments',          'Admin Modules', 'Access Enrollments submenu'),
('Hours Monitoring',               'admin.internship.hours_monitoring',     'Admin Modules', 'Access Hours Monitoring submenu'),
('Certificates',                   'admin.internship.certificates',         'Admin Modules', 'Access Certificates submenu')

ON CONFLICT (code) DO NOTHING;

-- ── Grant all submenu permissions to Super Admin, Admin, ED ───────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director')
  AND p.code LIKE 'admin.%.%'
ON CONFLICT DO NOTHING;

-- ── Grant HR Manager submenu permissions for their allowed modules ─────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'HR Manager'
  AND (
    p.code LIKE 'admin.user_access.%'
    OR p.code LIKE 'admin.organization.%'
    OR p.code LIKE 'admin.job_management.%'
    OR p.code LIKE 'admin.employee_data.%'
    OR p.code LIKE 'admin.time_attendance.%'
    OR p.code LIKE 'admin.leave_management.%'
    OR p.code LIKE 'admin.performance.%'
    OR p.code LIKE 'admin.recruitment.%'
    OR p.code LIKE 'admin.analytics.%'
  )
ON CONFLICT DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────────────────
SELECT r.name AS role, COUNT(p.id) AS submenu_permissions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.code LIKE 'admin.%.%'
GROUP BY r.name
ORDER BY r.name;
