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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to format date to YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function createFinalProbationaryReviews() {
  try {
    console.log('🔍 Fetching employee data...\n');

    // Get employee data for both employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, hire_date')
      .in('employee_id', ['20260223', '20260428']);

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      process.exit(1);
    }

    if (employees.length !== 2) {
      console.error(`❌ Expected 2 employees, found ${employees.length}`);
      process.exit(1);
    }

    console.log(`✅ Found ${employees.length} employees\n`);

    // Prepare review records
    const reviewsToCreate = employees.map((emp) => {
      const hireDate = new Date(emp.hire_date);
      const dueDate = addDays(hireDate, 150);

      return {
        employee_id: emp.id,
        review_type: 'final_5mo',
        due_date: formatDate(dueDate),
        status: 'pending',
        created_at: new Date().toISOString(),
      };
    });

    console.log('📋 Creating probationary review records:\n');
    reviewsToCreate.forEach((review, idx) => {
      const emp = employees[idx];
      console.log(`  [${idx + 1}] ${emp.first_name} ${emp.last_name}`);
      console.log(`      Review Type: ${review.review_type}`);
      console.log(`      Due Date: ${review.due_date}`);
      console.log(`      Status: ${review.status}\n`);
    });

    // Insert records
    const { data: createdReviews, error: createError } = await supabase
      .from('probationary_reviews')
      .insert(reviewsToCreate)
      .select('*');

    if (createError) {
      console.error('❌ Error creating review records:', createError);
      process.exit(1);
    }

    console.log('✅ Successfully created probationary review records!\n');

    // Display confirmation
    console.log('📊 Confirmation Summary:');
    console.log('========================\n');

    createdReviews.forEach((review, idx) => {
      const emp = employees[idx];
      console.log(`Record ${idx + 1}:`);
      console.log(`  Employee: ${emp.first_name} ${emp.last_name} (ID: ${emp.employee_id})`);
      console.log(`  Review Type: ${review.review_type}`);
      console.log(`  Due Date: ${review.due_date}`);
      console.log(`  Status: ${review.status}`);
      console.log(`  Created: ${new Date(review.created_at).toLocaleString()}\n`);
    });

    console.log('✅ All records created successfully!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createFinalProbationaryReviews();
