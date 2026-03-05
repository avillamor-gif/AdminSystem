-- Check if contract_documents table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contract_documents'
ORDER BY ordinal_position;

-- Check if any contract documents exist
SELECT COUNT(*) as total_contracts FROM contract_documents;

-- Check recent uploads
SELECT 
  id,
  employee_id,
  file_name,
  file_size,
  file_type,
  created_at
FROM contract_documents
ORDER BY created_at DESC
LIMIT 5;
