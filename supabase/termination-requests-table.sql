-- Create termination_requests table for employee termination and resignation management
CREATE TABLE IF NOT EXISTS termination_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES employees(id),
  
  -- Termination details
  termination_type VARCHAR(50) NOT NULL CHECK (termination_type IN ('voluntary', 'involuntary', 'retirement', 'end_of_contract', 'death', 'other')),
  termination_reason VARCHAR(100) NOT NULL,
  reason_details TEXT,
  is_resignation BOOLEAN DEFAULT false,
  
  -- Dates
  proposed_last_working_date DATE NOT NULL,
  actual_last_working_date DATE,
  notice_period_days INTEGER,
  
  -- Workflow status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  
  -- Approval tracking
  approved_by UUID REFERENCES employees(id),
  approved_date TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES employees(id),
  rejection_reason TEXT,
  
  -- Financial details
  severance_applicable BOOLEAN DEFAULT false,
  severance_amount DECIMAL(12, 2),
  benefits_continuation BOOLEAN DEFAULT false,
  benefits_continuation_months INTEGER,
  
  -- Exit process
  exit_interview_required BOOLEAN DEFAULT true,
  exit_interview_completed BOOLEAN DEFAULT false,
  exit_interview_date DATE,
  asset_return_required BOOLEAN DEFAULT true,
  assets_returned BOOLEAN DEFAULT false,
  
  -- Additional information
  business_justification TEXT,
  hr_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_termination_requests_employee ON termination_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_termination_requests_status ON termination_requests(status);
CREATE INDEX IF NOT EXISTS idx_termination_requests_requested_by ON termination_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_termination_requests_type ON termination_requests(termination_type);
CREATE INDEX IF NOT EXISTS idx_termination_requests_last_working ON termination_requests(proposed_last_working_date);
CREATE INDEX IF NOT EXISTS idx_termination_requests_created ON termination_requests(created_at DESC);

-- Enable RLS
ALTER TABLE termination_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read termination requests"
  ON termination_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert termination requests"
  ON termination_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update termination requests"
  ON termination_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete termination requests"
  ON termination_requests FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_termination_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_termination_requests_updated_at ON termination_requests;

CREATE TRIGGER update_termination_requests_updated_at
  BEFORE UPDATE ON termination_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_termination_requests_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'termination_requests'
  ) THEN
    RAISE NOTICE 'Table termination_requests created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create termination_requests table';
  END IF;
END $$;
