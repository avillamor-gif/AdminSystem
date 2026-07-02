#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  console.log('\n🔍 DATABASE DIAGNOSTICS\n');

  try {
    // 1. Check employment_types
    console.log('1️⃣  Checking employment_types...');
    const { data: empTypes, error: empTypesError } = await supabase
      .from('employment_types')
      .select('id, name, category');
    
    if (empTypesError) {
      console.error('   ❌ Error:', empTypesError.message);
    } else {
      console.log(`   ✅ Found ${empTypes?.length || 0} employment types:`);
      empTypes?.forEach(et => {
        console.log(`      - ${et.name} (category: ${et.category})`);
      });
    }

    // 2. Check employees count
    console.log('\n2️⃣  Checking employees...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, employment_type_id')
      .limit(5);
    
    if (empError) {
      console.error('   ❌ Error:', empError.message);
    } else {
      console.log(`   ✅ Found ${employees?.length || 0} employees (showing first 5):`);
      employees?.forEach(emp => {
        console.log(`      - ${emp.employee_id}: ${emp.first_name} ${emp.last_name} (employment_type_id: ${emp.employment_type_id})`);
      });
    }

    // 3. Check probationary_reviews table structure
    console.log('\n3️⃣  Checking probationary_reviews table...');
    const { data: reviews, error: revError, status } = await supabase
      .from('probationary_reviews')
      .select('*')
      .limit(5);
    
    if (revError && status !== 406) {
      console.error('   ❌ Error:', revError.message);
    } else if (status === 406) {
      console.log('   ℹ️  Table exists but may be empty');
    } else {
      console.log(`   ✅ Found ${reviews?.length || 0} probationary reviews (showing first 5):`);
      if (reviews && reviews.length > 0) {
        console.log('   Columns:', Object.keys(reviews[0]));
        reviews.forEach(rev => {
          console.log(`      - Review: ${rev.review_type || 'N/A'}, Due: ${rev.due_date || 'N/A'}`);
        });
      }
    }

    // 4. Check employees with their employment_types (joined) - use left join
    console.log('\n4️⃣  Employees with employment types (all categories)...');
    const { data: empWithTypes, error: joinError } = await supabase
      .from('employees')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        employment_type_id,
        employment_types(id, name, category)
      `)
      .limit(10);
    
    if (joinError) {
      console.error('   ❌ Error:', joinError.message);
    } else {
      console.log(`   ✅ Found ${empWithTypes?.length || 0} employees:`);
      empWithTypes?.forEach(emp => {
        const empType = emp.employment_types ? emp.employment_types[0] : null;
        const category = empType ? empType.category : 'NO TYPE ASSIGNED';
        console.log(`      - ${emp.employee_id}: ${emp.first_name} ${emp.last_name} → ${category}`);
      });
    }

    // 5. Specifically look for Probationary employment type
    console.log('\n5️⃣  Looking for employees with "Probationary" employment type...');
    const { data: probEmps, error: probError } = await supabase
      .from('employees')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        hire_date,
        employment_types(id, name, category)
      `)
      .eq('employment_types.name', 'Probationary');
    
    if (probError) {
      console.error('   ❌ Error:', probError.message);
    } else {
      console.log(`   ✅ Found ${probEmps?.length || 0} probationary employees`);
      probEmps?.forEach(emp => {
        const empType = emp.employment_types ? emp.employment_types[0] : null;
        console.log(`      - ${emp.employee_id}: ${emp.first_name} ${emp.last_name} (Hired: ${emp.hire_date})`);
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }

  console.log('\n');
}

runDiagnostics();
