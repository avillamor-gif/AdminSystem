-- Organization Structure Module - Complete Database Schema
-- This schema supports: Company Structure, Locations, Departments, International Operations, and Org Chart

-- =====================================================
-- 1. COMPANY STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS company_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES company_structures(id) ON DELETE CASCADE,
  structure_type VARCHAR(50) NOT NULL CHECK (structure_type IN ('headquarters', 'regional_office', 'field_office', 'program_unit', 'department', 'division', 'branch')),
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location_id UUID, -- Will reference locations table
  employee_count INTEGER DEFAULT 0,
  budget DECIMAL(15,2),
  established_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restructuring', 'pending')),
  code VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  mission_statement TEXT,
  vision_statement TEXT,
  operational_hours VARCHAR(100),
  timezone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_company_structures_parent ON company_structures(parent_id);
CREATE INDEX IF NOT EXISTS idx_company_structures_type ON company_structures(structure_type);
CREATE INDEX IF NOT EXISTS idx_company_structures_status ON company_structures(status);

-- =====================================================
-- 2. LOCATIONS / OFFICES
-- =====================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('headquarters', 'regional_office', 'branch_office', 'field_office', 'remote', 'warehouse', 'datacenter')),
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  company_structure_id UUID REFERENCES company_structures(id) ON DELETE SET NULL,
  
  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact Information
  phone VARCHAR(50),
  fax VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Operational Details
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_capacity INTEGER,
  current_employee_count INTEGER DEFAULT 0,
  operational_hours VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  established_date DATE,
  
  -- Financial
  monthly_rent DECIMAL(12,2),
  square_footage INTEGER,
  lease_expiry_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_construction', 'closing')),
  is_headquarters BOOLEAN DEFAULT FALSE,
  
  -- Facilities
  has_parking BOOLEAN DEFAULT FALSE,
  parking_spaces INTEGER,
  has_cafeteria BOOLEAN DEFAULT FALSE,
  has_gym BOOLEAN DEFAULT FALSE,
  has_medical_room BOOLEAN DEFAULT FALSE,
  has_conference_rooms BOOLEAN DEFAULT FALSE,
  conference_room_count INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);

-- =====================================================
-- 3. ENHANCED DEPARTMENTS (Add more fields to existing table)
-- =====================================================

-- Check if departments table exists and add new columns
DO $$ 
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='code') THEN
    ALTER TABLE departments ADD COLUMN code VARCHAR(50) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='parent_department_id') THEN
    ALTER TABLE departments ADD COLUMN parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='location_id') THEN
    ALTER TABLE departments ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='budget') THEN
    ALTER TABLE departments ADD COLUMN budget DECIMAL(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='cost_center') THEN
    ALTER TABLE departments ADD COLUMN cost_center VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='email') THEN
    ALTER TABLE departments ADD COLUMN email VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='phone') THEN
    ALTER TABLE departments ADD COLUMN phone VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='status') THEN
    ALTER TABLE departments ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restructuring'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='established_date') THEN
    ALTER TABLE departments ADD COLUMN established_date DATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_location ON departments(location_id);

-- =====================================================
-- 4. INTERNATIONAL OPERATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS international_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(100) NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  region VARCHAR(100),
  operation_type VARCHAR(50) CHECK (operation_type IN ('headquarters', 'regional_office', 'program_office', 'project_office', 'partner_office')),
  
  -- Office Details
  office_name VARCHAR(255),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  company_structure_id UUID REFERENCES company_structures(id) ON DELETE SET NULL,
  
  -- Contact
  country_director_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Operational
  established_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'closed')),
  employee_count INTEGER DEFAULT 0,
  local_staff_count INTEGER DEFAULT 0,
  expat_staff_count INTEGER DEFAULT 0,
  
  -- Financial
  annual_budget DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  funding_sources TEXT[],
  
  -- Legal & Compliance
  legal_entity_name VARCHAR(255),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  registration_date DATE,
  registration_authority VARCHAR(255),
  
  -- Programs
  active_programs INTEGER DEFAULT 0,
  program_areas TEXT[],
  beneficiary_count INTEGER,
  
  -- Language & Culture
  official_languages TEXT[],
  working_languages TEXT[],
  timezone VARCHAR(50),
  
  -- Partnership
  local_partners TEXT[],
  government_partnerships TEXT[],
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intl_ops_country ON international_operations(country);
CREATE INDEX IF NOT EXISTS idx_intl_ops_region ON international_operations(region);
CREATE INDEX IF NOT EXISTS idx_intl_ops_status ON international_operations(status);
CREATE INDEX IF NOT EXISTS idx_intl_ops_type ON international_operations(operation_type);

-- =====================================================
-- 5. ORGANIZATIONAL RELATIONSHIPS (for org chart)
-- =====================================================

CREATE TABLE IF NOT EXISTS org_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'direct_report' CHECK (relationship_type IN ('direct_report', 'dotted_line', 'matrix', 'functional', 'project')),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'temporary')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_org_rel_parent ON org_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_rel_child ON org_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_org_rel_dept ON org_relationships(department_id);

-- =====================================================
-- 6. ADD FOREIGN KEY TO COMPANY STRUCTURES
-- =====================================================

-- Add the location_id foreign key reference after locations table is created
ALTER TABLE company_structures 
  DROP CONSTRAINT IF EXISTS company_structures_location_id_fkey,
  ADD CONSTRAINT company_structures_location_id_fkey 
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- =====================================================
-- 7. VIEWS FOR EASY QUERYING
-- =====================================================

-- Company Structure Hierarchy View
CREATE OR REPLACE VIEW company_structure_hierarchy AS
WITH RECURSIVE structure_tree AS (
  -- Base case: top-level structures
  SELECT 
    id, name, description, level, parent_id, structure_type, 
    manager_id, location_id, status, code,
    1 as depth,
    ARRAY[name]::text[] as path,
    name as root_name
  FROM company_structures
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child structures
  SELECT 
    cs.id, cs.name, cs.description, cs.level, cs.parent_id, cs.structure_type,
    cs.manager_id, cs.location_id, cs.status, cs.code,
    st.depth + 1,
    st.path || cs.name::text,
    st.root_name
  FROM company_structures cs
  INNER JOIN structure_tree st ON cs.parent_id = st.id
)
SELECT * FROM structure_tree;

-- Location with Manager Details View
CREATE OR REPLACE VIEW locations_with_details AS
SELECT 
  l.*,
  e.first_name || ' ' || e.last_name as manager_name,
  e.email as manager_email,
  cs.name as structure_name
FROM locations l
LEFT JOIN employees e ON l.manager_id = e.id
LEFT JOIN company_structures cs ON l.company_structure_id = cs.id;

-- International Operations Summary View
CREATE OR REPLACE VIEW intl_operations_summary AS
SELECT 
  io.*,
  e.first_name || ' ' || e.last_name as director_name,
  l.name as location_name,
  l.city,
  cs.name as structure_name
FROM international_operations io
LEFT JOIN employees e ON io.country_director_id = e.id
LEFT JOIN locations l ON io.location_id = l.id
LEFT JOIN company_structures cs ON io.company_structure_id = cs.id;

-- Department Hierarchy View
CREATE OR REPLACE VIEW department_hierarchy AS
WITH RECURSIVE dept_tree AS (
  -- Base case: top-level departments
  SELECT 
    id, name, description, parent_department_id, location_id,
    1 as depth,
    ARRAY[name]::text[] as path,
    name as root_name
  FROM departments
  WHERE parent_department_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child departments
  SELECT 
    d.id, d.name, d.description, d.parent_department_id, d.location_id,
    dt.depth + 1,
    dt.path || d.name::text,
    dt.root_name
  FROM departments d
  INNER JOIN dept_tree dt ON d.parent_department_id = dt.id
)
SELECT * FROM dept_tree;

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================

-- Function to update employee count in locations
CREATE OR REPLACE FUNCTION update_location_employee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE locations
    SET current_employee_count = (
      SELECT COUNT(*) FROM employees WHERE location_id = NEW.location_id
    )
    WHERE id = NEW.location_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE locations
    SET current_employee_count = (
      SELECT COUNT(*) FROM employees WHERE location_id = OLD.location_id
    )
    WHERE id = OLD.location_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employee count
DROP TRIGGER IF EXISTS trigger_update_location_employee_count ON employees;
CREATE TRIGGER trigger_update_location_employee_count
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_location_employee_count();

-- =====================================================
-- 9. SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- Insert sample headquarters
INSERT INTO company_structures (name, description, level, structure_type, status, code, country)
VALUES 
  ('IBON International HQ', 'Main headquarters', 1, 'headquarters', 'active', 'HQ-001', 'Philippines')
ON CONFLICT (code) DO NOTHING;

-- Insert sample location
INSERT INTO locations (name, code, location_type, country, city, status, is_headquarters)
VALUES 
  ('Manila Headquarters', 'LOC-MNL-HQ', 'headquarters', 'Philippines', 'Manila', 'active', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 10. DISABLE RLS FOR DEVELOPMENT (Remove in production)
-- =====================================================

ALTER TABLE company_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE international_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_relationships DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE company_structures IS 'Organizational structure hierarchy';
COMMENT ON TABLE locations IS 'Physical office locations and facilities';
COMMENT ON TABLE international_operations IS 'International country operations';
COMMENT ON TABLE org_relationships IS 'Employee reporting relationships for org chart';
