const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    if (key) envVars[key] = value;
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function queryReviews() {
  try {
    // First, get the employee IDs (UUIDs) for the given employee_id strings
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name')
      .in('employee_id', ['20260223', '20260428']);

    if (empError) {
      console.error('Error fetching employees:', empError);
      return;
    }

    if (!employees || employees.length === 0) {
      console.log('No employees found with those employee_ids.');
      return;
    }

    console.log('\n=== Found Employees ===\n');
    employees.forEach((emp) => {
      console.log(`${emp.employee_id}: ${emp.first_name} ${emp.last_name}`);
    });

    // Now query probationary_reviews for these employee UUIDs
    const employeeUuids = employees.map((e) => e.id);
    
    const { data: reviews, error: reviewError } = await supabase
      .from('probationary_reviews')
      .select('*')
      .in('employee_id', employeeUuids)
      .order('employee_id');

    if (reviewError) {
      console.error('Error fetching reviews:', reviewError);
      return;
    }

    console.log('\n=== Probationary Reviews ===\n');
    
    if (!reviews || reviews.length === 0) {
      console.log('No probationary reviews found.');
      return;
    }

    reviews.forEach((review) => {
      const emp = employees.find((e) => e.id === review.employee_id);
      console.log(`ID: ${review.id}`);
      console.log(`Employee: ${emp.first_name} ${emp.last_name} (${emp.employee_id})`);
      console.log(`Review Type: ${review.review_type}`);
      console.log(`Due Date: ${review.due_date}`);
      console.log(`Status: ${review.status}`);
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

queryReviews();
