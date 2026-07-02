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

async function getEmploymentTypeDetails() {
  try {
    const employmentTypeId = '76984a26-2ac8-40a3-8b56-98608f68e915';
    
    const { data: empType, error } = await supabase
      .from('employment_types')
      .select('*')
      .eq('id', employmentTypeId)
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('\n📋 Employment Type Details:');
    console.log(`  Name: ${empType.name}`);
    console.log(`  Category: ${empType.category}`);
    console.log(`  Description: ${empType.description || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getEmploymentTypeDetails();
