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

async function createProbationaryReviews() {
  try {
    console.log('Creating probationary reviews...\n');

    // Employee data to create reviews for
    const employees = [
      {
        employee_id: '20260223',
        name: 'Ma. Cleofe Aseveros',
        hire_date: '2026-02-23',
      },
      {
        employee_id: '20260428',
        name: 'Mary Lei Española',
        hire_date: '2026-04-28',
      },
    ];

    const results = [];

    for (const emp of employees) {
      console.log(`\nProcessing: ${emp.name} (employee_id: ${emp.employee_id})`);

      // Step 1: Look up employee by employee_id to get UUID
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, hire_date')
        .eq('employee_id', emp.employee_id)
        .single();

      if (empError) {
        console.error(`  ❌ Error finding employee: ${empError.message}`);
        results.push({
          employee_id: emp.employee_id,
          name: emp.name,
          status: 'error',
          message: empError.message,
        });
        continue;
      }

      if (!empData) {
        console.error(`  ❌ Employee not found: ${emp.employee_id}`);
        results.push({
          employee_id: emp.employee_id,
          name: emp.name,
          status: 'error',
          message: 'Employee not found',
        });
        continue;
      }

      console.log(`  ✓ Found employee UUID: ${empData.id}`);
      console.log(`  ✓ Hire date: ${empData.hire_date}`);

      // Step 2: Calculate due date (hire_date + 90 days)
      const hireDate = new Date(empData.hire_date);
      const dueDate = new Date(hireDate);
      dueDate.setDate(dueDate.getDate() + 90);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      console.log(`  ✓ Due date (hire_date + 90 days): ${dueDateStr}`);

      // Step 3: Create probationary review record
      const { data: reviewData, error: reviewError } = await supabase
        .from('probationary_reviews')
        .insert({
          employee_id: empData.id,
          review_type: 'interim_3mo',
          due_date: dueDateStr,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reviewError) {
        console.error(`  ❌ Error creating probationary review: ${reviewError.message}`);
        results.push({
          employee_id: emp.employee_id,
          name: emp.name,
          status: 'error',
          message: reviewError.message,
        });
        continue;
      }

      console.log(`  ✓ Probationary review created!`);
      console.log(`  ✓ Review ID: ${reviewData.id}`);
      console.log(`  ✓ Status: ${reviewData.status}`);
      console.log(`  ✓ Review Type: ${reviewData.review_type}`);
      console.log(`  ✓ Due Date: ${reviewData.due_date}`);

      results.push({
        employee_id: emp.employee_id,
        name: emp.name,
        uuid: empData.id,
        review_id: reviewData.id,
        due_date: reviewData.due_date,
        status: 'success',
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'error');

    console.log(`\n✓ Successfully created: ${successful.length}`);
    successful.forEach((r) => {
      console.log(`  - ${r.name} (employee_id: ${r.employee_id})`);
      console.log(`    Review ID: ${r.review_id}`);
      console.log(`    Due Date: ${r.due_date}`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}`);
      failed.forEach((r) => {
        console.log(`  - ${r.name} (employee_id: ${r.employee_id})`);
        console.log(`    Error: ${r.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

createProbationaryReviews();
