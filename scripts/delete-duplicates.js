const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteDuplicates() {
  try {
    console.log('🔍 Finding duplicate members...\n');

    // Get all members
    const { data: members } = await supabase
      .from('members')
      .select('id, member_number, first_name, last_name');

    const nameMap = {};
    const duplicates = [];

    members.forEach(m => {
      const key = `${m.first_name.toLowerCase()} ${m.last_name.toLowerCase()}`;
      if (!nameMap[key]) {
        nameMap[key] = [];
      }
      nameMap[key].push(m);
    });

    // Find members with duplicate names and collect IDs to delete
    const idsToDelete = [];

    Object.entries(nameMap).forEach(([name, entries]) => {
      if (entries.length > 1) {
        // Sort by member number to keep the first one
        entries.sort((a, b) => {
          const numA = parseInt(a.member_number.match(/\d+$/)[0]);
          const numB = parseInt(b.member_number.match(/\d+$/)[0]);
          return numA - numB;
        });

        // Keep first, delete rest
        for (let i = 1; i < entries.length; i++) {
          idsToDelete.push(entries[i].id);
          duplicates.push({
            name,
            keep: entries[0],
            delete: entries[i],
          });
        }
      }
    });

    console.log(`Found ${duplicates.length} duplicate entries to delete:\n`);

    duplicates.forEach(dup => {
      console.log(`${dup.name}:`);
      console.log(`  ✅ Keep: ${dup.keep.member_number}`);
      console.log(`  ❌ Delete: ${dup.delete.member_number}\n`);
    });

    if (idsToDelete.length === 0) {
      console.log('✨ No duplicates to delete.');
      process.exit(0);
    }

    // Delete duplicates in batches
    console.log(`🗑️  Deleting ${idsToDelete.length} duplicate records...\n`);

    for (let i = 0; i < idsToDelete.length; i++) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', idsToDelete[i]);

      if (error) {
        console.error(`❌ Failed to delete ID ${idsToDelete[i]}:`, error);
        process.exit(1);
      }

      console.log(`✅ Deleted record ${i + 1}/${idsToDelete.length}`);
    }

    // Get final count
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✨ Successfully deleted ${idsToDelete.length} duplicate members!`);
    console.log(`📊 Total members remaining: ${count}`);

  } catch (error) {
    console.error('❌ Delete failed:', error);
    process.exit(1);
  }
}

deleteDuplicates();
