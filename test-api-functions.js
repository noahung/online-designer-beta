// Test script to verify database functions are working
// Run this with: node test-api-functions.js

const { createClient } = require('@supabase/supabase-js')

// Your Supabase configuration
const supabaseUrl = 'https://bahloynyhjgmdndqabhu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseFunctions() {
  console.log('Testing database functions...\n')
  
  // Test 1: Check if functions exist
  console.log('1. Checking if functions exist...')
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', ['validate_api_key', 'get_forms_by_api_key', 'generate_new_api_key'])
    
    if (error) {
      console.log('❌ Functions check failed:', error.message)
    } else {
      console.log('✅ Functions found:', data.map(f => f.routine_name))
    }
  } catch (err) {
    console.log('❌ Functions check error:', err.message)
  }
  
  console.log('\n2. Testing validate_api_key function...')
  try {
    // Test with a sample API key
    const { data, error } = await supabase
      .rpc('validate_api_key', {
        api_key_param: 'dk_live_a5bcb5eefd32130e42cc2bbf3f1c90eb'
      })
    
    if (error) {
      console.log('❌ validate_api_key failed:', error.message)
    } else {
      console.log('✅ validate_api_key result:', data)
    }
  } catch (err) {
    console.log('❌ validate_api_key error:', err.message)
  }
  
  console.log('\n3. Testing get_forms_by_api_key function...')
  try {
    const { data, error } = await supabase
      .rpc('get_forms_by_api_key', {
        api_key_param: 'dk_live_a5bcb5eefd32130e42cc2bbf3f1c90eb'
      })
    
    if (error) {
      console.log('❌ get_forms_by_api_key failed:', error.message)
    } else {
      console.log('✅ get_forms_by_api_key result:', data)
    }
  } catch (err) {
    console.log('❌ get_forms_by_api_key error:', err.message)
  }
  
  console.log('\nTest completed!')
}

testDatabaseFunctions()
