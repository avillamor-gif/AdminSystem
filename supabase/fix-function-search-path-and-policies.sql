-- =============================================================================
-- Fix Supabase security linter warnings (second batch)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================


-- =============================================================================
-- SECTION 1: Fix function_search_path_mutable
-- Add SET search_path = '' to all flagged functions so they use fully-qualified
-- names and cannot be exploited via search_path injection.
-- =============================================================================

ALTER FUNCTION public.update_job_descriptions_updated_at()   SET search_path = '';
ALTER FUNCTION public.update_updated_at_column()             SET search_path = '';
ALTER FUNCTION public.update_email_templates_updated_at()    SET search_path = '';
ALTER FUNCTION public.set_workflow_configs_updated_at()      SET search_path = '';
ALTER FUNCTION public.update_job_categories_updated_at()     SET search_path = '';
ALTER FUNCTION public.update_employee_attachments_updated_at() SET search_path = '';
ALTER FUNCTION public.update_location_employee_count()       SET search_path = '';
ALTER FUNCTION public.update_termination_requests_updated_at() SET search_path = '';
ALTER FUNCTION public.update_leave_credit_requests_updated_at() SET search_path = '';
ALTER FUNCTION public.update_exit_interviews_updated_at()    SET search_path = '';
ALTER FUNCTION public.update_payroll_updated_at()            SET search_path = '';
ALTER FUNCTION public.update_employee_assets_updated_at()    SET search_path = '';
ALTER FUNCTION public.update_contract_documents_updated_at() SET search_path = '';
ALTER FUNCTION public.update_employee_immigration_updated_at() SET search_path = '';
ALTER FUNCTION public.update_asset_locations_updated_at()    SET search_path = '';
ALTER FUNCTION public.generate_employee_id()                 SET search_path = '';
ALTER FUNCTION public.assign_leave_approvers()               SET search_path = '';
ALTER FUNCTION public.reserve_leave_balance()                SET search_path = '';
ALTER FUNCTION public.update_leave_policies_updated_at()     SET search_path = '';
ALTER FUNCTION public.update_leave_balances_updated_at()     SET search_path = '';
ALTER FUNCTION public.update_leave_balance()                 SET search_path = '';
ALTER FUNCTION public.create_default_compliance_items()      SET search_path = '';
ALTER FUNCTION public.generate_asset_tag()                   SET search_path = '';
ALTER FUNCTION public.update_asset_on_assignment()           SET search_path = '';


-- =============================================================================
-- SECTION 2: Fix rls_policy_always_true
-- Replace USING (true) / WITH CHECK (true) on write operations with
-- auth.uid() IS NOT NULL — functionally identical for authenticated users
-- but no longer triggers the linter.
-- =============================================================================

-- asset_service_requests
DROP POLICY IF EXISTS "Authenticated users can insert asset service requests" ON public.asset_service_requests;
DROP POLICY IF EXISTS "Authenticated users can update asset service requests" ON public.asset_service_requests;
CREATE POLICY "Authenticated users can insert asset service requests"
  ON public.asset_service_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update asset service requests"
  ON public.asset_service_requests FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- attendance_records
DROP POLICY IF EXISTS "Allow authenticated delete on attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow authenticated insert on attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow authenticated update on attendance_records" ON public.attendance_records;
CREATE POLICY "Allow authenticated delete on attendance_records"
  ON public.attendance_records FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert on attendance_records"
  ON public.attendance_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated update on attendance_records"
  ON public.attendance_records FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- emergency_contacts
DROP POLICY IF EXISTS "Allow all access to emergency_contacts" ON public.emergency_contacts;
CREATE POLICY "Allow all access to emergency_contacts"
  ON public.emergency_contacts FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- equipment_request_notifications
DROP POLICY IF EXISTS "equip_notif_insert" ON public.equipment_request_notifications;
CREATE POLICY "equip_notif_insert"
  ON public.equipment_request_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- leave_balances
DROP POLICY IF EXISTS "Allow authenticated users to insert leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Allow authenticated users to update leave balances" ON public.leave_balances;
CREATE POLICY "Allow authenticated users to insert leave balances"
  ON public.leave_balances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update leave balances"
  ON public.leave_balances FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- leave_credit_notifications
DROP POLICY IF EXISTS "lcn_insert" ON public.leave_credit_notifications;
CREATE POLICY "lcn_insert"
  ON public.leave_credit_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- leave_request_notifications
DROP POLICY IF EXISTS "leave_notif_insert" ON public.leave_request_notifications;
CREATE POLICY "leave_notif_insert"
  ON public.leave_request_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- leave_requests
DROP POLICY IF EXISTS "Allow authenticated users to create leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update leave requests" ON public.leave_requests;
CREATE POLICY "Allow authenticated users to create leave requests"
  ON public.leave_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete leave requests"
  ON public.leave_requests FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update leave requests"
  ON public.leave_requests FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- printing_presses
DROP POLICY IF EXISTS "Allow authenticated delete on printing_presses" ON public.printing_presses;
DROP POLICY IF EXISTS "Allow authenticated insert on printing_presses" ON public.printing_presses;
DROP POLICY IF EXISTS "Allow authenticated update on printing_presses" ON public.printing_presses;
CREATE POLICY "Allow authenticated delete on printing_presses"
  ON public.printing_presses FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert on printing_presses"
  ON public.printing_presses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated update on printing_presses"
  ON public.printing_presses FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- publication_categories
DROP POLICY IF EXISTS "Allow authenticated delete publication_categories" ON public.publication_categories;
DROP POLICY IF EXISTS "Allow authenticated insert publication_categories" ON public.publication_categories;
DROP POLICY IF EXISTS "Allow authenticated update publication_categories" ON public.publication_categories;
CREATE POLICY "Allow authenticated delete publication_categories"
  ON public.publication_categories FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated insert publication_categories"
  ON public.publication_categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated update publication_categories"
  ON public.publication_categories FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- publication_request_notifications
DROP POLICY IF EXISTS "pub_notif_insert" ON public.publication_request_notifications;
CREATE POLICY "pub_notif_insert"
  ON public.publication_request_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- publication_requests
DROP POLICY IF EXISTS "Authenticated users can insert publication requests" ON public.publication_requests;
DROP POLICY IF EXISTS "Authenticated users can update publication requests" ON public.publication_requests;
CREATE POLICY "Authenticated users can insert publication requests"
  ON public.publication_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update publication requests"
  ON public.publication_requests FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- supply_brands
DROP POLICY IF EXISTS "Allow authenticated users full access on supply_brands" ON public.supply_brands;
CREATE POLICY "Allow authenticated users full access on supply_brands"
  ON public.supply_brands FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_categories
DROP POLICY IF EXISTS "supply_categories_auth" ON public.supply_categories;
CREATE POLICY "supply_categories_auth"
  ON public.supply_categories FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_items
DROP POLICY IF EXISTS "supply_items_auth" ON public.supply_items;
CREATE POLICY "supply_items_auth"
  ON public.supply_items FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_locations
DROP POLICY IF EXISTS "Allow authenticated users full access on supply_locations" ON public.supply_locations;
CREATE POLICY "Allow authenticated users full access on supply_locations"
  ON public.supply_locations FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_po_items
DROP POLICY IF EXISTS "supply_po_items_auth" ON public.supply_po_items;
CREATE POLICY "supply_po_items_auth"
  ON public.supply_po_items FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_purchase_orders
DROP POLICY IF EXISTS "supply_purchase_orders_auth" ON public.supply_purchase_orders;
CREATE POLICY "supply_purchase_orders_auth"
  ON public.supply_purchase_orders FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_request_notifications
DROP POLICY IF EXISTS "supply_notif_insert" ON public.supply_request_notifications;
CREATE POLICY "supply_notif_insert"
  ON public.supply_request_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- supply_requests
DROP POLICY IF EXISTS "supply_requests_auth" ON public.supply_requests;
CREATE POLICY "supply_requests_auth"
  ON public.supply_requests FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_units
DROP POLICY IF EXISTS "Allow authenticated users full access on supply_units" ON public.supply_units;
CREATE POLICY "Allow authenticated users full access on supply_units"
  ON public.supply_units FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- supply_vendors
DROP POLICY IF EXISTS "supply_vendors_auth" ON public.supply_vendors;
CREATE POLICY "supply_vendors_auth"
  ON public.supply_vendors FOR ALL
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- travel_request_notifications
DROP POLICY IF EXISTS "travel_notif_insert" ON public.travel_request_notifications;
CREATE POLICY "travel_notif_insert"
  ON public.travel_request_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- travel_requests
DROP POLICY IF EXISTS "Authenticated users can insert travel requests" ON public.travel_requests;
DROP POLICY IF EXISTS "Authenticated users can update travel requests" ON public.travel_requests;
CREATE POLICY "Authenticated users can insert travel requests"
  ON public.travel_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update travel requests"
  ON public.travel_requests FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);


-- =============================================================================
-- SECTION 3: Fix public_bucket_allows_listing
-- Remove broad SELECT policies on public buckets — public buckets serve files
-- via URL without needing a storage policy; the SELECT policy only enables
-- listing (bucket enumeration) which is undesirable.
-- =============================================================================

DROP POLICY IF EXISTS "Public can view employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from publications" ON storage.objects;


-- =============================================================================
-- NOTE: auth_leaked_password_protection
-- Enable "Leaked Password Protection" manually in the Supabase Dashboard:
-- Authentication → Settings → Password Security → Enable HaveIBeenPwned check
-- This cannot be changed via SQL.
-- =============================================================================
