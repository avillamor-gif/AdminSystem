/**
 * Test script: Submit a supply request and trigger notification system
 * This will test if emails are being sent correctly with the new logging
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupplyRequestNotification() {
  try {
    console.log('🔍 Finding a test employee...');
    
    // Get first employee
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .limit(1);
    
    if (empError || !employees || employees.length === 0) {
      console.error('❌ Failed to find employee:', empError);
      return;
    }

    const employee = employees[0];
    console.log(`✅ Found employee: ${employee.first_name} ${employee.last_name} (${employee.email})`);

    // Get first supply item or category
    const { data: items } = await supabase
      .from('supply_items')
      .select('id, name, category_id')
      .limit(1);

    const itemId = items?.[0]?.id;
    const itemName = items?.[0]?.name ?? 'Printer Paper (Test)';
    const categoryId = items?.[0]?.category_id;

    console.log(`📦 Using item: ${itemName}`);

    // Create supply request
    const reqNum = 'SR-TEST-' + Date.now().toString().slice(-8);
    console.log(`\n📝 Creating supply request: ${reqNum}...`);

    const { data: insertedReq, error: insertError } = await supabase
      .from('supply_requests')
      .insert({
        request_number: reqNum,
        employee_id: employee.id,
        item_id: itemId || null,
        item_name: itemName,
        category_id: categoryId || null,
        quantity: 5,
        purpose: 'Test supply request to verify notifications are working',
        priority: 'medium',
        status: 'pending',
        notes: 'This is a test request - can be deleted',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Failed to create supply request:', insertError);
      return;
    }

    console.log(`✅ Supply request created: ${insertedReq.id}`);

    // Trigger notification via API
    console.log(`\n📧 Triggering notification...\n`);
    console.log('Sending POST to /api/notifications/send with:');
    console.log(`  - table: supply_request_notifications`);
    console.log(`  - employee_id: ${employee.id}`);
    console.log(`  - request_id: ${insertedReq.id}`);
    console.log(`  - request_number: ${reqNum}`);
    console.log(`  - targetGroup: supply`);

    const response = await fetch(
      `${supabaseUrl.replace('https://', 'http://localhost:3000')}/api/notifications/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'supply_request_notifications',
          employeeId: employee.id,
          requestId: insertedReq.id,
          title: 'New Supply Request',
          message: `{name} has submitted a supply request for ${itemName}.`,
          requesterName: `${employee.first_name} ${employee.last_name}`,
          requestNumber: reqNum,
          targetGroup: 'supply',
        }),
      }
    ).catch(err => {
      console.log('\n⚠️  Local fetch failed (server not running). That\'s OK - check Vercel/production logs instead.');
      console.log('   This test will work once the app is deployed and you submit a supply request in the UI.');
      return { ok: false };
    });

    if (response?.ok) {
      const result = await response.json();
      console.log('\n✅ Notification API response:', result);
    }

    console.log(`\n📋 Test supply request created:`);
    console.log(`   Request #: ${reqNum}`);
    console.log(`   Employee: ${employee.first_name} ${employee.last_name}`);
    console.log(`   Item: ${itemName}`);
    console.log(`   Quantity: 5`);
    console.log(`   Status: pending`);
    console.log(`\n💡 Check server logs for email sending debug output:`);
    console.log('   [notifications/send] Preparing to send emails to X recipient(s)');
    console.log('   [notifications/send] Retrieved Y auth users');
    console.log('   [notifications/send] Resolved Z email address(es)');
    console.log('   [notifications/send] Batch 1: N sent, M failed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupplyRequestNotification();
