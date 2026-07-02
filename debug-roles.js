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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function debugRoles() {
  try {
    console.log('📋 Checking roles table...\n');
    const { data: roles, error: rolesError } = await admin
      .from('roles')
      .select('id, name, description, status');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError.message);
      process.exit(1);
    }

    console.log('Found roles:');
    roles.forEach(r => {
      console.log(`  - ${r.name} (${r.id})`);
      console.log(`    Status: ${r.status}`);
      console.log(`    Description: ${r.description}\n`);
    });

    console.log('\n📋 Checking Super Admin permissions...\n');
    const { data: superAdminRole } = await admin
      .from('roles')
      .select('id, name, role_permissions(permission:permissions(code, name))')
      .eq('name', 'Super Admin')
      .single();

    if (!superAdminRole) {
      console.error('❌ Super Admin role not found in roles table!');
      console.log('We need to insert it. Running INSERT now...\n');

      // Insert Super Admin role
      const { data: insertedRole, error: insertError } = await admin
        .from('roles')
        .insert({
          name: 'Super Admin',
          description: 'Full system access with all administrative privileges',
          is_system_role: true,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting Super Admin role:', insertError.message);
        process.exit(1);
      }

      console.log(`✅ Inserted Super Admin role: ${insertedRole.id}\n`);
    } else {
      console.log(`✅ Super Admin role found: ${superAdminRole.id}`);
      console.log(`   Permissions: ${superAdminRole.role_permissions.length}\n`);

      if (superAdminRole.role_permissions.length === 0) {
        console.warn('⚠️  Super Admin has NO permissions assigned!');
      } else {
        console.log('   Permission codes:');
        superAdminRole.role_permissions.forEach(rp => {
          console.log(`     - ${rp.permission.code}`);
        });
      }
    }

    console.log('\n📋 Checking user_role_assignments table...\n');
    const { data: assignments, error: assignError } = await admin
      .from('user_role_assignments')
      .select('role_id, roles(id, name, description)')
      .eq('user_id', 'd8134e56-1897-46df-8659-12ba900eb670');

    if (assignError) {
      if (assignError.message.includes('does not exist')) {
        console.log('⚠️  user_role_assignments table does not exist (this is OK, using legacy user_roles)');
      } else {
        console.error('Error:', assignError.message);
      }
    } else {
      console.log(`Found ${assignments?.length ?? 0} role assignments for your user`);
      if (assignments && assignments.length > 0) {
        assignments.forEach((a, i) => {
          console.log(`\n  Assignment ${i + 1}:`);
          console.log(`    Role ID: ${a.role_id}`);
          if (Array.isArray(a.roles)) {
            a.roles.forEach(r => {
              console.log(`    Role Name: ${r.name}`);
              console.log(`    Description: ${r.description}`);
            });
          } else if (a.roles) {
            console.log(`    Role Name: ${a.roles.name}`);
            console.log(`    Description: ${a.roles.description}`);
          }
        });
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugRoles();
