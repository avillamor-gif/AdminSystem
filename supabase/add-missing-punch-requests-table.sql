-- Create missing_punch_requests table for interns to request missed punch entries
-- Run in Supabase SQL Editor

CREATE TABLE missing_punch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, date)
);

-- Indexes for efficient querying
CREATE INDEX idx_missing_punch_requests_enrollment_id ON missing_punch_requests(enrollment_id);
CREATE INDEX idx_missing_punch_requests_status ON missing_punch_requests(status);
CREATE INDEX idx_missing_punch_requests_requested_by ON missing_punch_requests(requested_by);
CREATE INDEX idx_missing_punch_requests_created_at ON missing_punch_requests(created_at);

-- Enable RLS
ALTER TABLE missing_punch_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow interns to create their own requests
CREATE POLICY "Interns can create their own missing punch requests"
  ON missing_punch_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Policy: Allow interns to view their own requests
CREATE POLICY "Interns can view their own requests"
  ON missing_punch_requests FOR SELECT
  USING (
    requested_by = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'hr', 'ed', 'super admin')
    )
  );

-- Policy: Allow admins/HR to update (approve/reject) requests
CREATE POLICY "Admins and HR can update requests"
  ON missing_punch_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'hr', 'ed', 'super admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'hr', 'ed', 'super admin')
    )
  );
