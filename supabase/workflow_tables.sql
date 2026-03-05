-- Workflow Management Tables
-- Run this in your Supabase SQL Editor

-- Workflow Templates Table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  request_type VARCHAR(50) NOT NULL, -- leave, travel, expense, asset, publication, termination
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}', -- departments, job_titles, amount_ranges, etc.
  steps JSONB NOT NULL, -- array of workflow steps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Requests Table (main workflow tracking)
CREATE TABLE workflow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(255) NOT NULL, -- Reference to actual request (leave_request.id, etc)
  request_type VARCHAR(50) NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  current_level INTEGER DEFAULT 1,
  total_levels INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted', -- draft, submitted, in_progress, approved, rejected, cancelled
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  business_justification TEXT,
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  completed_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Steps Table (individual approval steps)
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflow_requests(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  approver_role VARCHAR(50) NOT NULL, -- manager, department_head, hr, finance, admin
  approver_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  approver_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, skipped
  action_date TIMESTAMPTZ,
  comments TEXT,
  is_current_level BOOLEAN DEFAULT false,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel Requests Table
CREATE TABLE travel_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  purpose VARCHAR(50) NOT NULL, -- business_meeting, conference, training, client_visit, other
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL,
  estimated_cost DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft',
  urgency VARCHAR(20) DEFAULT 'medium',
  accommodation_required BOOLEAN DEFAULT false,
  transport_mode VARCHAR(50),
  business_justification TEXT NOT NULL,
  budget_code VARCHAR(50),
  cost_center VARCHAR(50),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  documents TEXT[], -- array of document URLs/names
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Requests Table
CREATE TABLE expense_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  travel_request_id UUID REFERENCES travel_requests(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL, -- meals, accommodation, transport, entertainment, communication, other
  subcategory VARCHAR(100),
  merchant VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10, 6),
  local_amount DECIMAL(12, 2),
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- corporate_card, personal_card, cash, bank_transfer
  status VARCHAR(50) DEFAULT 'draft',
  receipt_attached BOOLEAN DEFAULT false,
  receipt_url TEXT,
  billable BOOLEAN DEFAULT false,
  client_code VARCHAR(50),
  project_code VARCHAR(50),
  tax_amount DECIMAL(12, 2),
  tax_rate DECIMAL(5, 2),
  policy_compliant BOOLEAN DEFAULT true,
  policy_violation_reason TEXT,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  reimbursement_date TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Assignments Table
CREATE TABLE asset_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  asset_id VARCHAR(100) NOT NULL, -- Reference to asset registry
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL, -- laptop, phone, vehicle, equipment, etc.
  serial_number VARCHAR(100),
  assignment_type VARCHAR(50) NOT NULL, -- permanent, temporary, loan
  assigned_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  condition_on_assignment VARCHAR(50) DEFAULT 'good', -- excellent, good, fair, poor
  condition_on_return VARCHAR(50),
  status VARCHAR(50) DEFAULT 'requested', -- requested, approved, assigned, returned, damaged, lost
  purpose TEXT,
  location VARCHAR(255),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publication Requests Table
CREATE TABLE publication_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  publication_id VARCHAR(100) NOT NULL,
  publication_title VARCHAR(255) NOT NULL,
  publication_type VARCHAR(50) NOT NULL, -- book, journal, magazine, research, manual, report
  publisher VARCHAR(255),
  isbn VARCHAR(20),
  request_type VARCHAR(50) NOT NULL, -- copy, access, subscription, purchase
  quantity INTEGER DEFAULT 1,
  purpose TEXT NOT NULL,
  justification TEXT,
  estimated_cost DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'draft',
  delivery_method VARCHAR(50), -- physical, digital, online_access
  delivery_address TEXT,
  deadline DATE,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  fulfilled_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Termination Requests Table
CREATE TABLE termination_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES employees(id) ON DELETE SET NULL, -- Usually manager or HR
  termination_type VARCHAR(50) NOT NULL, -- voluntary, involuntary, retirement, end_of_contract
  termination_reason VARCHAR(100), -- resignation, performance, restructuring, misconduct, etc.
  proposed_last_working_date DATE NOT NULL,
  actual_last_working_date DATE,
  notice_period_days INTEGER,
  is_resignation BOOLEAN DEFAULT false,
  resignation_letter_url TEXT,
  severance_applicable BOOLEAN DEFAULT false,
  severance_amount DECIMAL(12, 2),
  benefits_continuation BOOLEAN DEFAULT false,
  garden_leave BOOLEAN DEFAULT false,
  non_compete_applicable BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, pending_approval, approved, rejected, processed
  urgency VARCHAR(20) DEFAULT 'medium',
  business_justification TEXT,
  exit_interview_required BOOLEAN DEFAULT true,
  exit_interview_date TIMESTAMPTZ,
  asset_return_required BOOLEAN DEFAULT true,
  knowledge_transfer_plan TEXT,
  replacement_plan TEXT,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_date TIMESTAMPTZ,
  rejection_reason TEXT,
  processed_date TIMESTAMPTZ,
  hr_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflow_requests_employee ON workflow_requests(employee_id);
CREATE INDEX idx_workflow_requests_type ON workflow_requests(request_type);
CREATE INDEX idx_workflow_requests_status ON workflow_requests(status);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_current ON workflow_steps(is_current_level) WHERE is_current_level = true;

CREATE INDEX idx_travel_requests_employee ON travel_requests(employee_id);
CREATE INDEX idx_travel_requests_status ON travel_requests(status);
CREATE INDEX idx_expense_requests_employee ON expense_requests(employee_id);
CREATE INDEX idx_expense_requests_status ON expense_requests(status);
CREATE INDEX idx_asset_assignments_employee ON asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_status ON asset_assignments(status);
CREATE INDEX idx_publication_requests_employee ON publication_requests(employee_id);
CREATE INDEX idx_publication_requests_status ON publication_requests(status);
CREATE INDEX idx_termination_requests_employee ON termination_requests(employee_id);
CREATE INDEX idx_termination_requests_status ON termination_requests(status);

-- Triggers for updated_at
CREATE TRIGGER update_workflow_templates_updated_at 
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_requests_updated_at 
  BEFORE UPDATE ON workflow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at 
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_requests_updated_at 
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_requests_updated_at 
  BEFORE UPDATE ON expense_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_assignments_updated_at 
  BEFORE UPDATE ON asset_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publication_requests_updated_at 
  BEFORE UPDATE ON publication_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_termination_requests_updated_at 
  BEFORE UPDATE ON termination_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflow templates
INSERT INTO workflow_templates (name, request_type, description, steps) VALUES
('Standard Leave Approval', 'leave', 'Default leave request approval workflow', 
 '[{"level":1,"approverRole":"manager","timeoutDays":3,"escalationRole":"department_head"},{"level":2,"approverRole":"hr","timeoutDays":2}]'),

('Standard Travel Approval', 'travel', 'Default travel request approval workflow', 
 '[{"level":1,"approverRole":"manager","timeoutDays":2,"autoApprove":true,"conditions":{"maxAmount":500}},{"level":2,"approverRole":"department_head","timeoutDays":3,"conditions":{"minAmount":500,"maxAmount":2000}},{"level":3,"approverRole":"finance","timeoutDays":5,"conditions":{"minAmount":2000}}]'),

('Standard Expense Approval', 'expense', 'Default expense reimbursement workflow', 
 '[{"level":1,"approverRole":"manager","timeoutDays":2,"autoApprove":true,"conditions":{"maxAmount":25}},{"level":2,"approverRole":"department_head","timeoutDays":3,"conditions":{"minAmount":25,"maxAmount":500}},{"level":3,"approverRole":"finance","timeoutDays":5,"conditions":{"minAmount":500}}]'),

('Asset Assignment Approval', 'asset', 'Default asset assignment workflow', 
 '[{"level":1,"approverRole":"manager","timeoutDays":1},{"level":2,"approverRole":"admin","timeoutDays":2}]'),

('Publication Request Approval', 'publication', 'Default publication copy request workflow', 
 '[{"level":1,"approverRole":"manager","timeoutDays":2},{"level":2,"approverRole":"admin","timeoutDays":3}]'),

('Employee Termination Workflow', 'termination', 'Employee termination approval and processing', 
 '[{"level":1,"approverRole":"manager","timeoutDays":1},{"level":2,"approverRole":"hr","timeoutDays":2},{"level":3,"approverRole":"admin","timeoutDays":1}]');