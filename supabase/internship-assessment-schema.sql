-- IBON International Intern Assessment Form — online version
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS internship_assessments (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id               UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,

  -- Part I: General Workplace Performance (scale 1-6)
  r_attendance                SMALLINT CHECK (r_attendance BETWEEN 1 AND 6),
  r_punctuality               SMALLINT CHECK (r_punctuality BETWEEN 1 AND 6),
  r_appropriate_dress         SMALLINT CHECK (r_appropriate_dress BETWEEN 1 AND 6),
  r_attitude                  SMALLINT CHECK (r_attitude BETWEEN 1 AND 6),
  r_acceptance_criticism      SMALLINT CHECK (r_acceptance_criticism BETWEEN 1 AND 6),
  r_asks_questions            SMALLINT CHECK (r_asks_questions BETWEEN 1 AND 6),
  r_self_motivated            SMALLINT CHECK (r_self_motivated BETWEEN 1 AND 6),
  r_ethical_behaviour         SMALLINT CHECK (r_ethical_behaviour BETWEEN 1 AND 6),

  -- Part I: Specific Job Assignment Performance (scale 1-6)
  r_job_knowledge             SMALLINT CHECK (r_job_knowledge BETWEEN 1 AND 6),
  r_verbal_communication      SMALLINT CHECK (r_verbal_communication BETWEEN 1 AND 6),
  r_written_communication     SMALLINT CHECK (r_written_communication BETWEEN 1 AND 6),
  r_analytical_skills         SMALLINT CHECK (r_analytical_skills BETWEEN 1 AND 6),
  r_technical_skills          SMALLINT CHECK (r_technical_skills BETWEEN 1 AND 6),
  r_meets_deadlines           SMALLINT CHECK (r_meets_deadlines BETWEEN 1 AND 6),
  r_takes_initiative          SMALLINT CHECK (r_takes_initiative BETWEEN 1 AND 6),
  r_sets_priorities           SMALLINT CHECK (r_sets_priorities BETWEEN 1 AND 6),

  -- Part I: Open-ended questions (filled by intern)
  strengths_weaknesses        TEXT,
  important_achievements      TEXT,
  most_difficult              TEXT,
  likes_dislikes              TEXT,
  overall_performance         TEXT CHECK (overall_performance IN ('outstanding','above_average','satisfactory','below_average','unsatisfactory')),
  intern_other_comments       TEXT,

  -- Part II: Supervisor evaluation
  supervisor_strengths_areas  TEXT,
  supervisor_comments         TEXT,

  -- Workflow state
  status                      TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','part1_complete','complete')),
  part1_submitted_at          TIMESTAMPTZ,
  part2_submitted_at          TIMESTAMPTZ,

  -- Meta
  created_by                  UUID REFERENCES employees(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internship_assessments_enrollment ON internship_assessments(enrollment_id);

-- RLS
ALTER TABLE internship_assessments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read assessments for their own enrollment
CREATE POLICY "Interns can view their own assessments"
  ON internship_assessments FOR SELECT
  TO authenticated
  USING (
    enrollment_id IN (
      SELECT pe.id FROM program_enrollments pe
      JOIN employees emp ON emp.id = pe.employee_id
      JOIN user_roles ur ON ur.employee_id = emp.id
      WHERE ur.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','hr','manager')
    )
  );

-- Only admins/HR can insert
CREATE POLICY "Admins can manage assessments"
  ON internship_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','hr')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_internship_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_internship_assessments_updated_at
  BEFORE UPDATE ON internship_assessments
  FOR EACH ROW EXECUTE FUNCTION update_internship_assessments_updated_at();

-- Permission
INSERT INTO permissions (code, name, description, category)
VALUES ('admin.internship.assessments', 'Internship Assessments', 'Manage intern assessment forms', 'internship')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Executive Director', 'Admin', 'HR Manager', 'HR Staff')
  AND p.code = 'admin.internship.assessments'
ON CONFLICT DO NOTHING;
