const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = rest.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserRoleAssignment() {
  try {
    console.log('🔄 Fixing user role assignment...\n');

    // Get Super Admin role ID
    const { data: superAdminRole } = await admin
      .from('roles')
      .select('id')
      .eq('name', 'Super Admin')
      .single();

    if (!superAdminRole) {
      console.error('❌ Super Admin role not found');
      process.exit(1);
    }

    console.log(`✅ Found Super Admin role: ${superAdminRole.id}`);

    // Update user_role_assignments
    const userId = 'd8134e56-1897-46df-8659-12ba900eb670';
    const { data: updated, error } = await admin
      .from('user_role_assignments')
      .update({ role_id: superAdminRole.id })
      .eq('user_id', userId)
      .select('*, roles(id, name)');

    if (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Successfully updated user role assignment!');
    console.log('\n📋 Updated record:');
    if (updated && updated.length > 0) {
      console.log(`   User ID: ${updated[0].user_id}`);
      console.log(`   New Role: ${updated[0].roles?.name}`);
    }

    console.log('\n✨ Your account is now Super Admin. Please refresh the app.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixUserRoleAssignment();
