const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agzwhsymweevikhauavm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnendoc3ltd2VldmlraGF1YXZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI1NjI0NiwiZXhwIjoyMDg2ODMyMjQ2fQ.qufxP76TpaG3fZHOiMU3PoGYqoD3INzHa0hS3bG8cBg';

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function restoreSuperAdmin() {
  const email = 'avillamor@iboninternational.org';

  try {
    // Step 1: Find user in auth.users
    console.log(`🔍 Looking up auth user for ${email}...`);
    const { data: authUsers, error: authError } = await admin
      .auth
      .admin
      .listUsers();

    if (authError) {
      console.error('❌ Failed to list auth users:', authError.message);
      process.exit(1);
    }

    const authUser = authUsers.users.find(u => u.email === email);
    if (!authUser) {
      console.error(`❌ Auth user not found for ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found auth user: ${authUser.id}`);

    // Step 2: Find user_roles record by user_id
    console.log(`\n🔍 Finding user_roles record...`);
    const { data: userRoles, error: userError } = await admin
      .from('user_roles')
      .select('id, user_id, employee_id, role')
      .eq('user_id', authUser.id)
      .single();

    if (userError || !userRoles) {
      console.error(`❌ User roles record not found:`, userError?.message);
      process.exit(1);
    }

    console.log(`✅ Found user_roles record:`);
    console.log(`   ID: ${userRoles.id}`);
    console.log(`   Current role: ${userRoles.role}`);
    console.log(`   Employee ID: ${userRoles.employee_id}`);

    if (userRoles.role === 'super admin') {
      console.log(`\n✅ Already has Super Admin role!`);
      process.exit(0);
    }

    // Step 3: Update role to super admin
    console.log(`\n🔄 Updating role to 'super admin'...`);
    const { data: updated, error: updateError } = await admin
      .from('user_roles')
      .update({ role: 'super admin' })
      .eq('id', userRoles.id)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ Successfully restored Super Admin role!`);
    console.log(`\n📋 Updated record:`);
    console.log(`   ID: ${updated[0].id}`);
    console.log(`   New role: ${updated[0].role}`);
    console.log(`\n✨ Your account has been restored to Super Admin. Please refresh the app.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

restoreSuperAdmin();
