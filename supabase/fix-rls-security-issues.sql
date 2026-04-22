-- =============================================================================
-- Fix all Supabase security linter errors
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================


-- =============================================================================
-- SECTION 1: Enable RLS on tables that already have policies defined
-- (policy_exists_rls_disabled — policies were created but RLS was never enabled)
-- =============================================================================

ALTER TABLE public.asset_assignment_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_brands              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_vendors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approvals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations                 ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2: Enable RLS + add policies on tables with no policies yet
-- Policy convention: authenticated users can read; admins manage via service-role
-- (All admin writes in this app go through API routes using the service-role key,
--  which bypasses RLS — so "authenticated read" is sufficient for these tables)
-- =============================================================================

-- company_structures
ALTER TABLE public.company_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read company structures"
  ON public.company_structures FOR SELECT
  TO authenticated USING (true);

-- international_operations
ALTER TABLE public.international_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read international operations"
  ON public.international_operations FOR SELECT
  TO authenticated USING (true);

-- org_relationships
ALTER TABLE public.org_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read org relationships"
  ON public.org_relationships FOR SELECT
  TO authenticated USING (true);

-- publication_requests
ALTER TABLE public.publication_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read publication requests"
  ON public.publication_requests FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert publication requests"
  ON public.publication_requests FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update publication requests"
  ON public.publication_requests FOR UPDATE
  TO authenticated USING (true);

-- travel_requests
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read travel requests"
  ON public.travel_requests FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert travel requests"
  ON public.travel_requests FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update travel requests"
  ON public.travel_requests FOR UPDATE
  TO authenticated USING (true);

-- roles (read-only for authenticated; written only via service-role)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT
  TO authenticated USING (true);

-- permissions (read-only for authenticated)
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read permissions"
  ON public.permissions FOR SELECT
  TO authenticated USING (true);

-- role_permissions (read-only for authenticated)
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated USING (true);

-- security_policies (read-only for authenticated; admins write via service-role)
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read security policies"
  ON public.security_policies FOR SELECT
  TO authenticated USING (true);

-- active_sessions (users can only see/manage their own sessions)
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own active sessions"
  ON public.active_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own active sessions"
  ON public.active_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- two_factor_auth (users can only see/manage their own 2FA records)
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own 2FA settings"
  ON public.two_factor_auth FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own 2FA settings"
  ON public.two_factor_auth FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- password_policies (read-only for authenticated)
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read password policies"
  ON public.password_policies FOR SELECT
  TO authenticated USING (true);

-- password_history (users can only see their own history)
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own password history"
  ON public.password_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_password_metadata (users can only see their own metadata)
ALTER TABLE public.user_password_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own password metadata"
  ON public.user_password_metadata FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- employee_reporting_fields (read/write for authenticated)
ALTER TABLE public.employee_reporting_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read employee reporting fields"
  ON public.employee_reporting_fields FOR SELECT
  TO authenticated USING (true);

-- employee_profile_templates (read-only for authenticated)
ALTER TABLE public.employee_profile_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read employee profile templates"
  ON public.employee_profile_templates FOR SELECT
  TO authenticated USING (true);

-- asset_service_requests
ALTER TABLE public.asset_service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read asset service requests"
  ON public.asset_service_requests FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert asset service requests"
  ON public.asset_service_requests FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset service requests"
  ON public.asset_service_requests FOR UPDATE
  TO authenticated USING (true);

-- asset_warranty_tracking
ALTER TABLE public.asset_warranty_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read asset warranty tracking"
  ON public.asset_warranty_tracking FOR SELECT
  TO authenticated USING (true);


-- =============================================================================
-- SECTION 3: Fix SECURITY DEFINER views
-- Recreate them as SECURITY INVOKER so they respect the querying user's RLS
-- =============================================================================

-- department_hierarchy
DROP VIEW IF EXISTS public.department_hierarchy;
CREATE OR REPLACE VIEW public.department_hierarchy
  WITH (security_invoker = true)
AS
  SELECT
    d.id,
    d.name,
    d.description,
    d.parent_id,
    d.created_at,
    p.name AS parent_department_name
  FROM departments d
  LEFT JOIN departments p ON d.parent_id = p.id;

-- company_structure_hierarchy
DROP VIEW IF EXISTS public.company_structure_hierarchy;
CREATE OR REPLACE VIEW public.company_structure_hierarchy
  WITH (security_invoker = true)
AS
  SELECT
    cs.*,
    p.name AS parent_name
  FROM company_structures cs
  LEFT JOIN company_structures p ON cs.parent_id = p.id;

-- intl_operations_summary
DROP VIEW IF EXISTS public.intl_operations_summary;
CREATE OR REPLACE VIEW public.intl_operations_summary
  WITH (security_invoker = true)
AS
  SELECT * FROM public.international_operations;

-- board_members
DROP VIEW IF EXISTS public.board_members;
CREATE OR REPLACE VIEW public.board_members
  WITH (security_invoker = true)
AS
  SELECT
    e.id,
    e.first_name,
    e.last_name,
    e.email,
    e.avatar_url,
    jt.title AS job_title
  FROM employees e
  LEFT JOIN job_titles jt ON e.job_title_id = jt.id
  WHERE e.status = 'active';

-- locations_with_details
DROP VIEW IF EXISTS public.locations_with_details;
CREATE OR REPLACE VIEW public.locations_with_details
  WITH (security_invoker = true)
AS
  SELECT
    l.*,
    lt.name AS location_type_name
  FROM locations l
  LEFT JOIN location_types lt ON l.location_type = lt.code;
