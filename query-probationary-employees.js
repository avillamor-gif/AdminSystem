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
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryProbationaryEmployees() {
  console.log('\n📋 Querying probationary employees and their reviews...\n');

  try {
    // Get all probationary employees (filter by employment_types.name = 'Probationary')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        email,
        hire_date,
        employment_types(id, name, category)
      `)
      .eq('employment_types.name', 'Probationary')
      .order('hire_date', { ascending: false });

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      process.exit(1);
    }

    if (!employees || employees.length === 0) {
      console.log('ℹ️  No employees found with probationary employment type.');
      process.exit(0);
    }

    console.log(`✅ Found ${employees.length} probationary employee(s)\n`);
    console.log('═'.repeat(140));

    // Fetch reviews for each employee
    for (const emp of employees) {
      const { data: reviews, error: revError } = await supabase
        .from('probationary_reviews')
        .select('*')
        .eq('employee_id', emp.id)
        .order('due_date', { ascending: true });

      if (revError) {
        console.error(`❌ Error fetching reviews for ${emp.first_name} ${emp.last_name}:`, revError);
        continue;
      }

      // Format hire date
      const hireDate = new Date(emp.hire_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Calculate days on probation
      const today = new Date();
      const hiredDate = new Date(emp.hire_date);
      const daysOnProbation = Math.floor((today - hiredDate) / (1000 * 60 * 60 * 24));

      // Determine probation status
      let probationStatus = '🟢 Active';
      if (daysOnProbation < 0) {
        probationStatus = '⚪ Not Started';
      }

      console.log(`\n👤 ${emp.first_name} ${emp.last_name.toUpperCase()}`);
      console.log('─'.repeat(140));
      console.log(`   Employee ID:     ${emp.employee_id}`);
      console.log(`   Email:           ${emp.email}`);
      console.log(`   Hired:           ${hireDate} (${Math.abs(daysOnProbation)} days ago) - ${probationStatus}`);
      console.log(`   Employment Type: ${emp.employment_types && emp.employment_types[0] ? emp.employment_types[0].name : 'Probationary'}`);

      if (reviews && reviews.length > 0) {
        console.log(`\n   📑 Probationary Reviews (${reviews.length}):`);
        reviews.forEach((review, idx) => {
          const reviewType = review.review_type || 'General Review';
          const dueDate = review.due_date
            ? new Date(review.due_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'Not Set';
          const completedDate = review.completed_date
            ? new Date(review.completed_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : null;

          let status = '⏳ PENDING';
          let statusEmoji = '⏳';
          if (completedDate) {
            status = '✅ COMPLETED';
            statusEmoji = '✅';
          } else if (review.due_date && new Date(review.due_date) < today) {
            status = '⚠️  OVERDUE';
            statusEmoji = '⚠️ ';
          }

          console.log(
            `      ${idx + 1}. [${statusEmoji} ${status}] ${reviewType.toUpperCase()}`
          );
          console.log(`         Due Date: ${dueDate}${completedDate ? ` | Completed: ${completedDate}` : ''}`);

          if (review.status) {
            console.log(`         Review Status: ${review.status}`);
          }
          if (review.reviewer_id) {
            console.log(`         Reviewer ID: ${review.reviewer_id}`);
          }
          if (review.notes) {
            const notePreview = review.notes.substring(0, 100);
            console.log(`         Notes: ${notePreview}${review.notes.length > 100 ? '...' : ''}`);
          }
        });
      } else {
        console.log('\n   📑 Probationary Reviews: None scheduled yet');
      }
    }

    console.log('\n' + '═'.repeat(140) + '\n');

    // Summary statistics
    const totalReviews = employees.reduce((sum, emp) => {
      return sum + (emp.reviews ? emp.reviews.length : 0);
    }, 0);

    console.log(`📊 SUMMARY:`);
    console.log(`   Total Probationary Employees: ${employees.length}`);
    console.log(`   Total Reviews: ${totalReviews}`);
    console.log();

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

queryProbationaryEmployees();
