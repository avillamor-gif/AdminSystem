-- ============================================
-- Job & Position Management Tables Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Pay Grades Table (check if columns exist before adding)
CREATE TABLE IF NOT EXISTS pay_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  min_salary DECIMAL(12, 2) NOT NULL,
  max_salary DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add name column first if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='name') THEN
    ALTER TABLE pay_grades ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Grade';
  END IF;
  
  -- Add currency column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='currency') THEN
    ALTER TABLE pay_grades ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
  END IF;
  
  -- Add employee_count column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='employee_count') THEN
    ALTER TABLE pay_grades ADD COLUMN employee_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add status column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='status') THEN
    ALTER TABLE pay_grades ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    -- Add check constraint separately
    ALTER TABLE pay_grades ADD CONSTRAINT pay_grades_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
  
  -- Add mid_point as generated column ONLY if min_salary and max_salary exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='mid_point') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='min_salary')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='max_salary') THEN
    ALTER TABLE pay_grades ADD COLUMN mid_point DECIMAL(12, 2) GENERATED ALWAYS AS ((min_salary + max_salary) / 2) STORED;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- Ignore if constraint already exists
END $$;

-- Job Descriptions Table (extends job_titles)
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title_id UUID REFERENCES job_titles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(255),
  summary TEXT,
  responsibilities JSONB DEFAULT '[]',
  qualifications JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  experience_required VARCHAR(100),
  education_required VARCHAR(255),
  employment_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structures Table
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  pay_grade_id UUID REFERENCES pay_grades(id) ON DELETE SET NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  components JSONB DEFAULT '[]',
  total_compensation DECIMAL(12, 2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Paths Table
CREATE TABLE IF NOT EXISTS career_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  levels JSONB DEFAULT '[]',
  total_duration VARCHAR(100),
  employees_on_path INTEGER DEFAULT 0,
  skills_required JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pay_grades_level ON pay_grades(level);
CREATE INDEX IF NOT EXISTS idx_pay_grades_status ON pay_grades(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_title ON job_descriptions(job_title_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_salary_structures_pay_grade ON salary_structures(pay_grade_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_effective_date ON salary_structures(effective_date);
CREATE INDEX IF NOT EXISTS idx_salary_structures_status ON salary_structures(status);
CREATE INDEX IF NOT EXISTS idx_career_paths_category ON career_paths(category);
CREATE INDEX IF NOT EXISTS idx_career_paths_status ON career_paths(status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE pay_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;

-- Pay Grades Policies
DROP POLICY IF EXISTS "Authenticated users can read pay grades" ON pay_grades;
CREATE POLICY "Authenticated users can read pay grades"
  ON pay_grades FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage pay grades" ON pay_grades;
CREATE POLICY "Admins can manage pay grades"
  ON pay_grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Job Descriptions Policies
DROP POLICY IF EXISTS "Authenticated users can read job descriptions" ON job_descriptions;
CREATE POLICY "Authenticated users can read job descriptions"
  ON job_descriptions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage job descriptions" ON job_descriptions;
CREATE POLICY "Admins can manage job descriptions"
  ON job_descriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Salary Structures Policies (more restricted - only admin/HR)
DROP POLICY IF EXISTS "Admins can read salary structures" ON salary_structures;
CREATE POLICY "Admins can read salary structures"
  ON salary_structures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

DROP POLICY IF EXISTS "Admins can manage salary structures" ON salary_structures;
CREATE POLICY "Admins can manage salary structures"
  ON salary_structures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Career Paths Policies
DROP POLICY IF EXISTS "Authenticated users can read career paths" ON career_paths;
CREATE POLICY "Authenticated users can read career paths"
  ON career_paths FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage career paths" ON career_paths;
CREATE POLICY "Admins can manage career paths"
  ON career_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- ============================================
-- Triggers for Updated At Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pay_grades_updated_at ON pay_grades;
CREATE TRIGGER update_pay_grades_updated_at 
  BEFORE UPDATE ON pay_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at 
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_structures_updated_at ON salary_structures;
CREATE TRIGGER update_salary_structures_updated_at 
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_career_paths_updated_at ON career_paths;
CREATE TRIGGER update_career_paths_updated_at 
  BEFORE UPDATE ON career_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Sample Pay Grades (dynamically check which columns exist)
DO $$
DECLARE
  has_name BOOLEAN;
  has_code BOOLEAN;
  has_level BOOLEAN;
  has_min_salary BOOLEAN;
  has_max_salary BOOLEAN;
  has_employee_count BOOLEAN;
  has_status BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='name') INTO has_name;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='code') INTO has_code;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='level') INTO has_level;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='min_salary') INTO has_min_salary;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='max_salary') INTO has_max_salary;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='employee_count') INTO has_employee_count;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_grades' AND column_name='status') INTO has_status;
  
  -- Only insert if all required columns exist
  IF has_name AND has_code AND has_level AND has_min_salary AND has_max_salary AND has_employee_count AND has_status THEN
    INSERT INTO pay_grades (name, code, level, min_salary, max_salary, employee_count, status) VALUES
      ('Entry Level', 'PG1', 1, 40000, 55000, 45, 'active'),
      ('Professional', 'PG2', 2, 55000, 75000, 38, 'active'),
      ('Senior Professional', 'PG3', 3, 75000, 100000, 28, 'active'),
      ('Lead', 'PG4', 4, 100000, 135000, 22, 'active'),
      ('Manager', 'PG5', 5, 135000, 175000, 15, 'active'),
      ('Principal', 'PG6', 6, 175000, 225000, 5, 'active')
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE 'Sample pay grades inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping pay grades sample data - not all required columns exist';
  END IF;
END $$;

-- Sample Job Descriptions (dynamically check which columns exist)
DO $$
DECLARE
  has_title BOOLEAN;
  has_code BOOLEAN;
  has_department BOOLEAN;
  has_summary BOOLEAN;
  has_responsibilities BOOLEAN;
  has_qualifications BOOLEAN;
  has_skills BOOLEAN;
  has_experience_required BOOLEAN;
  has_status BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='title') INTO has_title;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='code') INTO has_code;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='department') INTO has_department;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='summary') INTO has_summary;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='responsibilities') INTO has_responsibilities;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='qualifications') INTO has_qualifications;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='skills') INTO has_skills;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='experience_required') INTO has_experience_required;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_descriptions' AND column_name='status') INTO has_status;
  
  -- Only insert if all required columns exist
  IF has_title AND has_code AND has_department AND has_summary AND has_responsibilities AND has_qualifications AND has_skills AND has_experience_required AND has_status THEN
    INSERT INTO job_descriptions (title, code, department, summary, responsibilities, qualifications, skills, experience_required, status) VALUES
      (
        'Software Engineer',
        'JD-SE',
        'Engineering',
        'Design, develop, and maintain scalable software applications',
        '["Write clean, maintainable code", "Participate in code reviews", "Collaborate with cross-functional teams", "Debug and resolve technical issues"]',
        '["Bachelor degree in Computer Science or related field", "Strong problem-solving skills", "Experience with version control systems"]',
        '["JavaScript", "React", "Node.js", "SQL", "Git"]',
        '2-4 years',
        'active'
      ),
      (
        'Senior Product Manager',
        'JD-PM',
        'Product',
        'Lead product strategy and drive product development from conception to launch',
        '["Define product vision and roadmap", "Conduct market research", "Prioritize features", "Collaborate with engineering and design teams"]',
        '["5+ years of product management experience", "Strong analytical skills", "Excellent communication abilities", "Experience with Agile methodologies"]',
        '["Product Strategy", "User Research", "Data Analysis", "Stakeholder Management", "Agile/Scrum"]',
        '5-7 years',
        'active'
      ),
      (
        'Data Analyst',
        'JD-DA',
        'Analytics',
        'Analyze complex datasets to provide actionable business insights',
        '["Extract and analyze data", "Create dashboards and reports", "Identify trends and patterns", "Present findings to stakeholders"]',
        '["Bachelor degree in Statistics, Mathematics, or related field", "Proficiency in SQL", "Strong analytical mindset"]',
        '["SQL", "Python", "Tableau", "Excel", "Statistics"]',
        '1-3 years',
        'active'
      )
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE 'Sample job descriptions inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping job descriptions sample data - not all required columns exist';
  END IF;
END $$;

-- Sample Career Paths (dynamically check which columns exist)
DO $$
DECLARE
  has_name BOOLEAN;
  has_code BOOLEAN;
  has_category BOOLEAN;
  has_description BOOLEAN;
  has_levels BOOLEAN;
  has_total_duration BOOLEAN;
  has_employees_on_path BOOLEAN;
  has_skills_required BOOLEAN;
  has_status BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='name') INTO has_name;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='code') INTO has_code;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='category') INTO has_category;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='description') INTO has_description;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='levels') INTO has_levels;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='total_duration') INTO has_total_duration;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='employees_on_path') INTO has_employees_on_path;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='skills_required') INTO has_skills_required;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='career_paths' AND column_name='status') INTO has_status;
  
  -- Only insert if all required columns exist
  IF has_name AND has_code AND has_category AND has_description AND has_levels AND has_total_duration AND has_employees_on_path AND has_skills_required AND has_status THEN
    INSERT INTO career_paths (name, code, category, description, levels, total_duration, employees_on_path, skills_required, status) VALUES
      (
        'Software Engineering Track',
        'CP-SE',
        'Engineering',
        'Technical career progression from junior developer to principal engineer',
        '[
          {"title":"Junior Software Engineer","duration":"1-2 years","requirements":["Bachelor degree","Basic programming skills","Teamwork"]},
          {"title":"Software Engineer","duration":"2-3 years","requirements":["Strong coding skills","Project experience","Code reviews"]},
          {"title":"Senior Software Engineer","duration":"3-4 years","requirements":["System design","Mentorship","Technical leadership"]},
          {"title":"Staff Engineer","duration":"3-5 years","requirements":["Architecture expertise","Cross-team leadership","Strategic thinking"]},
          {"title":"Principal Engineer","duration":"Ongoing","requirements":["Industry recognition","Company-wide impact","Innovation"]}
        ]',
        '9-14 years',
        45,
        '["Programming", "System Design", "Leadership", "Communication"]',
        'active'
      ),
      (
        'Product Management Track',
        'CP-PM',
        'Product',
        'Leadership path from associate PM to Chief Product Officer',
        '[
          {"title":"Associate Product Manager","duration":"1-2 years","requirements":["Business acumen","User empathy","Data analysis"]},
          {"title":"Product Manager","duration":"2-3 years","requirements":["Product strategy","Roadmap planning","Stakeholder management"]},
          {"title":"Senior Product Manager","duration":"3-4 years","requirements":["Market expertise","Team leadership","P&L ownership"]},
          {"title":"Director of Product","duration":"3-5 years","requirements":["Multi-product management","Team building","Vision setting"]},
          {"title":"VP of Product / CPO","duration":"Ongoing","requirements":["Company strategy","Executive leadership","Market positioning"]}
        ]',
        '9-14 years',
        12,
        '["Strategy", "Analytics", "Leadership", "Market Research"]',
        'active'
      )
    ON CONFLICT (code) DO NOTHING;
    RAISE NOTICE 'Sample career paths inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping career paths sample data - not all required columns exist';
  END IF;
END $$;

-- Migration Complete!
-- Now regenerate TypeScript types: npm run db:types
