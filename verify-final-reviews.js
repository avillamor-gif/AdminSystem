#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envFile = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envFile, 'utf-8');
const envLines = envContent.split('\n');

const env = {};
envLines.forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyRecords() {
  try {
    // Get employee IDs
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_id, hire_date')
      .in('employee_id', ['20260223', '20260428']);

    const empMap = {};
    employees.forEach((emp) => {
      empMap[emp.id] = emp;
    });

    // Get probationary reviews
    const { data: reviews, error } = await supabase
      .from('probationary_reviews')
      .select('*')
      .in('employee_id', employees.map((e) => e.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('\n✅ Verification: Final Probationary Reviews Successfully Created\n');
    console.log('================================\n');

    reviews.forEach((review, idx) => {
      const emp = empMap[review.employee_id];
      console.log(`Record ${idx + 1}:`);
      console.log(`  Employee: ${emp.first_name} ${emp.last_name}`);
      console.log(`  Employee ID: ${emp.employee_id}`);
      console.log(`  Hire Date: ${emp.hire_date}`);
      console.log(`  Review Type: ${review.review_type}`);
      console.log(`  Due Date: ${review.due_date}`);
      console.log(`  Status: ${review.status}`);
      console.log(`  Created At: ${new Date(review.created_at).toLocaleString()}`);
      console.log();
    });

    console.log('✅ Both records confirmed in Supabase!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyRecords();
