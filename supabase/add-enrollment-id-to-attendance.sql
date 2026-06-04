-- Add enrollment_id to attendance_records to isolate intern sessions from regular employee records
-- Run this in your Supabase SQL Editor

ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance_records(enrollment_id);

-- Workforce analytics permission: ensure intern category is filterable
-- No schema change needed — employment_types.category already has 'intern' and 'volunteer'

-- Internship analytics permission code
INSERT INTO permissions (code, name, description, category)
VALUES ('admin.internship.analytics', 'Internship Analytics', 'View internship and OJT program analytics', 'internship')
ON CONFLICT (code) DO NOTHING;

-- Grant to admin and hr roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Executive Director', 'Admin', 'HR Manager', 'HR Staff')
  AND p.code = 'admin.internship.analytics'
ON CONFLICT DO NOTHING;
