#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔄 Syncing Adrienne\'s attendance data to internship module...\n');
    
    const employeeId = 'fbdc747a-05e2-4186-8a12-5d3d2deddc13'; // Adrienne UUID
    
    // Get enrollment
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
    
    if (!enrollment) {
      console.error('❌ Enrollment not found');
      return;
    }
    
    console.log('📌 Enrollment ID:', enrollment.id);
    
    // Get all attendance records for this employee
    const { data: records } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: true });
    
    console.log(`📊 Found ${records?.length || 0} attendance records\n`);
    
    if (!records || records.length === 0) {
      console.log('❌ No records found');
      return;
    }
    
    let totalHours = 0;
    let updated = 0;
    
    // Update each record: calculate hours and link to enrollment
    for (const record of records) {
      // Calculate rendered hours from clock times
      let renderedHours = 0;
      if (record.clock_in && record.clock_out) {
        const clockIn = new Date(record.clock_in);
        const clockOut = new Date(record.clock_out);
        renderedHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60); // convert to hours
      }
      
      totalHours += renderedHours;
      
      // Update record with enrollment_id and calculated rendered_hours
      const { error } = await supabase
        .from('attendance_records')
        .update({
          enrollment_id: enrollment.id,
          rendered_hours: Math.round(renderedHours * 100) / 100, // Round to 2 decimals
        })
        .eq('id', record.id);
      
      if (error) {
        console.error(`❌ Failed to update ${record.id}:`, error.message);
      } else {
        updated++;
        if (updated % 5 === 0) {
          console.log(`  ✓ Updated ${updated}/${records.length}...`);
        }
      }
    }
    
    console.log(`\n✅ Updated ${updated}/${records.length} records`);
    console.log(`📈 Total calculated hours: ${totalHours.toFixed(1)}h`);
    
    // Update program_enrollments.rendered_hours
    console.log('\n🔗 Updating enrollment rendered_hours...');
    const { error: enrollError } = await supabase
      .from('program_enrollments')
      .update({ rendered_hours: Math.round(totalHours * 10) / 10 })
      .eq('id', enrollment.id);
    
    if (enrollError) {
      console.error('❌ Failed to update enrollment:', enrollError.message);
    } else {
      console.log(`✅ Enrollment updated: ${totalHours.toFixed(1)}h`);
    }
    
    console.log('\n✨ Sync complete!');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
