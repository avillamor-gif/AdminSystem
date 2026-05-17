-- ============================================================
-- Recruitment Management Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  headcount INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','on_hold','closed','cancelled')),
  posted_date DATE,
  closing_date DATE,
  is_internal BOOLEAN DEFAULT false,
  is_remote BOOLEAN DEFAULT false,
  posted_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE IF NOT EXISTS recruitment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  current_employer TEXT,
  current_position TEXT,
  years_experience INTEGER,
  highest_education TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct','referral','job_board','linkedin','website','agency','other')),
  tags TEXT[],
  notes TEXT,
  is_talent_pool BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE IF NOT EXISTS recruitment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES recruitment_candidates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied','screening','interview','assessment','offer','hired','rejected','withdrawn')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','rejected','withdrawn','hired')),
  applied_date DATE DEFAULT CURRENT_DATE,
  resume_url TEXT,
  cover_letter TEXT,
  screening_score INTEGER,
  notes TEXT,
  rejection_reason TEXT,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS recruitment_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'initial' CHECK (interview_type IN ('initial','technical','hr','panel','final','culture_fit')),
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  meeting_link TEXT,
  interviewers UUID[],
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show','rescheduled')),
  feedback TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  recommendation TEXT CHECK (recommendation IN ('strong_hire','hire','neutral','no_hire','strong_no_hire')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS recruitment_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  offered_salary NUMERIC,
  offered_position TEXT,
  start_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','sent','accepted','declined','negotiating','expired','withdrawn')),
  offer_letter_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Tasks
CREATE TABLE IF NOT EXISTS recruitment_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT DEFAULT 'document' CHECK (task_type IN ('document','training','account_setup','orientation','equipment','other')),
  due_date DATE,
  completed_date DATE,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening Questions
CREATE TABLE IF NOT EXISTS recruitment_screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text' CHECK (question_type IN ('text','yes_no','multiple_choice','rating','number')),
  options JSONB,
  is_required BOOLEAN DEFAULT true,
  is_knockout BOOLEAN DEFAULT false,
  knockout_answer TEXT,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hiring Workflow Templates
CREATE TABLE IF NOT EXISTS recruitment_hiring_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Boards
CREATE TABLE IF NOT EXISTS recruitment_job_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_post BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_applications_job ON recruitment_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_applications_candidate ON recruitment_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_applications_stage ON recruitment_applications(stage);
CREATE INDEX IF NOT EXISTS idx_recruitment_interviews_application ON recruitment_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_interviews_date ON recruitment_interviews(scheduled_date);

-- Disable RLS for now (consistent with other tables)
ALTER TABLE job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_onboarding DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_screening_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_hiring_workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_job_boards DISABLE ROW LEVEL SECURITY;
