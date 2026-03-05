-- Disable RLS on employee_attachments table for development
ALTER TABLE employee_attachments DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on contract_documents if needed
ALTER TABLE contract_documents DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employee_attachments', 'contract_documents');
