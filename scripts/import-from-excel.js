const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Path to the Excel file
const excelPath = '/Users/leopura/Desktop/II Membership/II Members_ST.xlsx';

if (!fs.existsSync(excelPath)) {
  console.error(`File not found: ${excelPath}`);
  process.exit(1);
}

async function importFromExcel() {
  try {
    console.log('📂 Reading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 Found ${rows.length} raw rows in Excel`);

    // Skip the first row (header descriptor) and process data rows
    const dataRows = rows.slice(1).filter(row => {
      const name = row['II MEMBERSHIP LIST'] || '';
      return name && name.trim().length > 0;
    });

    console.log(`📊 Found ${dataRows.length} data records\n`);

    // Get all existing members to check for duplicates
    console.log('🔍 Checking existing members...');
    const { data: existingMembers, error: queryError } = await supabase
      .from('members')
      .select('id, member_number, first_name, last_name, email');

    if (queryError) {
      console.error('Error querying members:', queryError);
      process.exit(1);
    }

    console.log(`📊 Found ${existingMembers.length} existing members`);

    // Find the highest member number
    let maxNumber = 0;
    existingMembers.forEach(m => {
      if (m.member_number) {
        const match = m.member_number.match(/MEM-2026-(\d+)/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        }
      }
    });

    let nextNumber = maxNumber + 1;
    console.log(`📊 Highest member number: MEM-2026-${String(maxNumber).padStart(5, '0')}`);
    console.log(`📝 Starting new numbers from: MEM-2026-${String(nextNumber).padStart(5, '0')}\n`);

    // Create a set of existing names for deduplication
    const existingNames = new Set();
    existingMembers.forEach(m => {
      existingNames.add(`${m.first_name} ${m.last_name}`.toLowerCase());
    });

    // Process Excel rows
    const membersToInsert = [];
    const duplicates = [];

    dataRows.forEach((row, index) => {
      // Extract and clean data from Excel columns
      const fullName = (row['II MEMBERSHIP LIST'] || '').trim();
      const country = (row['__EMPTY'] || 'Philippines').trim();
      const organization = (row['__EMPTY_1'] || '').trim();
      const email = (row['__EMPTY_2'] || '').trim();

      if (!fullName) {
        console.warn(`⚠️  Row ${index + 2}: Missing name, skipping`);
        return;
      }

      // Parse full name into first and last name
      const nameParts = fullName.split(',').map(p => p.trim());
      let firstName, lastName;

      if (nameParts.length >= 2) {
        // Format: "Last, First" or "Last, First Jr."
        lastName = nameParts[0];
        firstName = nameParts.slice(1).join(' ');
      } else if (fullName.includes(' ')) {
        // Format: "First Last" - split on last space
        const lastSpaceIndex = fullName.lastIndexOf(' ');
        firstName = fullName.substring(0, lastSpaceIndex);
        lastName = fullName.substring(lastSpaceIndex + 1);
      } else {
        firstName = fullName;
        lastName = '';
      }

      firstName = firstName.trim();
      lastName = lastName.trim();

      if (!firstName || !lastName) {
        console.warn(`⚠️  Row ${index + 2}: Could not parse name "${fullName}", skipping`);
        return;
      }

      const memberFullName = `${firstName} ${lastName}`.toLowerCase();

      if (existingNames.has(memberFullName)) {
        duplicates.push({ firstName, lastName });
        return;
      }

      membersToInsert.push({
        member_number: `MEM-2026-${String(nextNumber + membersToInsert.length).padStart(5, '0')}`,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        country: country || 'Philippines',
        organization: organization || null,
        membership_type: 'regular',
        status: 'active',
        date_admitted: new Date().toISOString().split('T')[0],
        notes: null,
        avatar_url: null,
      });
    });

    console.log(`📋 Unique records to import: ${membersToInsert.length}`);
    console.log(`⚠️  Duplicates found (skipped): ${duplicates.length}\n`);

    if (duplicates.length > 0) {
      console.log('Skipped duplicates:');
      duplicates.forEach(d => console.log(`  - ${d.firstName} ${d.lastName}`));
      console.log();
    }

    if (membersToInsert.length === 0) {
      console.log('✨ No new members to import.');
      process.exit(0);
    }

    // Insert in batches of 50
    console.log(`📝 Importing ${membersToInsert.length} new members...\n`);
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const batch = membersToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('members')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, error);
        process.exit(1);
      }

      imported += batch.length;
      console.log(`✅ Batch ${i / batchSize + 1} imported (${batch.length} members, total: ${imported})`);
    }

    console.log(`\n✨ Successfully imported ${membersToInsert.length} new members!`);
    console.log(`📌 Member numbers: MEM-2026-${String(nextNumber).padStart(5, '0')} to MEM-2026-${String(nextNumber + membersToInsert.length - 1).padStart(5, '0')}`);
    console.log(`📊 Total members in system: ${existingMembers.length + membersToInsert.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importFromExcel();
