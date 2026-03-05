-- Create exit_interviews table for tracking employee exit interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  termination_request_id UUID NOT NULL REFERENCES termination_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Interview details
  interview_date DATE,
  interview_time TIME,
  interviewer_id UUID REFERENCES employees(id),
  interview_location VARCHAR(255),
  interview_method VARCHAR(50) CHECK (interview_method IN ('in_person', 'video', 'phone', 'written')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'declined')),
  
  -- Interview questions and responses
  reason_for_leaving TEXT,
  liked_most TEXT,
  liked_least TEXT,
  suggestions_for_improvement TEXT,
  relationship_with_manager_rating INTEGER CHECK (relationship_with_manager_rating BETWEEN 1 AND 5),
  work_environment_rating INTEGER CHECK (work_environment_rating BETWEEN 1 AND 5),
  compensation_rating INTEGER CHECK (compensation_rating BETWEEN 1 AND 5),
  career_growth_rating INTEGER CHECK (career_growth_rating BETWEEN 1 AND 5),
  work_life_balance_rating INTEGER CHECK (work_life_balance_rating BETWEEN 1 AND 5),
  overall_satisfaction_rating INTEGER CHECK (overall_satisfaction_rating BETWEEN 1 AND 5),
  
  -- Additional questions
  would_recommend_company BOOLEAN,
  would_consider_returning BOOLEAN,
  open_to_future_contact BOOLEAN,
  
  -- Follow-up
  additional_comments TEXT,
  interviewer_notes TEXT,
  action_items TEXT,
  hr_review_notes TEXT,
  
  -- Completion tracking
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES employees(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_exit_interviews_termination ON exit_interviews(termination_request_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_employee ON exit_interviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_interviewer ON exit_interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_status ON exit_interviews(status);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_date ON exit_interviews(interview_date);

-- Enable RLS
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read exit interviews" ON exit_interviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert exit interviews" ON exit_interviews;
DROP POLICY IF EXISTS "Allow authenticated users to update exit interviews" ON exit_interviews;
DROP POLICY IF EXISTS "Allow authenticated users to delete exit interviews" ON exit_interviews;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read exit interviews"
  ON exit_interviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert exit interviews"
  ON exit_interviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update exit interviews"
  ON exit_interviews FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete exit interviews"
  ON exit_interviews FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_exit_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exit_interviews_updated_at ON exit_interviews;

CREATE TRIGGER update_exit_interviews_updated_at
  BEFORE UPDATE ON exit_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_exit_interviews_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'exit_interviews'
  ) THEN
    RAISE NOTICE 'Table exit_interviews created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create exit_interviews table';
  END IF;
END $$;
