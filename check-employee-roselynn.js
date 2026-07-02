#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmployee() {
  try {
    console.log('\n🔍 Checking for Dr. Roselynn Musa...\n');
    
    // 1. Search for employee by name and employee_id
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .or(`employee_id.eq.20260227,first_name.ilike.%Roselynn%,last_name.ilike.%Musa%`);
    
    if (empError) {
      console.error('❌ Error querying employees:', empError);
      return;
    }
    
    if (employees.length === 0) {
      console.log('❌ NO EMPLOYEE FOUND with name Roselynn Musa or employee_id 20260227');
      return;
    }
    
    const emp = employees[0];
    console.log(`✅ FOUND - Employee Details:`);
    console.log(`  ID (UUID): ${emp.id}`);
    console.log(`  Employee ID: ${emp.employee_id}`);
    console.log(`  Name: ${emp.first_name} ${emp.last_name}`);
    console.log(`  Email: ${emp.email}`);
    console.log(`  Status: ${emp.status}`);
    console.log(`  Employment Type ID: ${emp.employment_type_id}`);
    console.log(`  Department ID: ${emp.department_id}`);
    console.log(`  Job Title ID: ${emp.job_title_id}`);
    console.log(`  Manager ID: ${emp.manager_id}`);
    console.log(`  Hire Date: ${emp.hire_date}`);
    console.log(`  Created: ${emp.created_at}`);
    console.log(`  Updated: ${emp.updated_at}`);
    
    console.log(`\n\n🔗 Checking related records for ${emp.first_name} ${emp.last_name}...\n`);
    
    const tables = [
      'probationary_reviews',
      'leave_requests',
      'attendance',
      'travel_requests',
      'user_roles',
      'employee_attachments',
      'contract_documents',
      'performance_reviews',
      'disciplinary_records',
      'promotions',
      'transfers',
      'separations'
    ];
    
    let totalRelated = 0;
    const relatedRecords = {};
    
    for (const table of tables) {
      try {
        const { data: records, error: tableError, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .eq('employee_id', emp.id)
          .limit(5);
        
        if (!tableError && records && records.length > 0) {
          totalRelated += records.length;
          relatedRecords[table] = records.length;
          console.log(`  📌 ${table}: ${records.length} record(s)`);
        }
      } catch (error) {
        // Table doesn't exist or query failed silently
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total related records: ${totalRelated}`);
    
    if (totalRelated === 0) {
      console.log(`\n✅ No foreign key references found. Employee can be safely deleted if needed.`);
    } else {
      console.log(`\n⚠️  WARNING: ${totalRelated} related record(s) found. Deletion may be blocked by foreign key constraints.`);
      console.log(`   Related tables: ${Object.keys(relatedRecords).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkEmployee();
