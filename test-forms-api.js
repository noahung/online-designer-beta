// Test script to check forms retrieval
// Run with: node test-forms-api.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bahloynyhjgmdndqabhu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFormsRetrieval() {
  console.log('Testing forms retrieval with your API key...\n')
  
  // Replace with your actual API key from Settings
  const apiKey = 'dk_live_a2580264470bb04971b09afeaf11cca0'
  
  console.log('1. Testing get_forms_by_api_key function...')
  try {
    const { data, error } = await supabase
      .rpc('get_forms_by_api_key', {
        api_key_param: apiKey
      })
    
    if (error) {
      console.log('❌ get_forms_by_api_key failed:', error.message)
    } else {
      console.log('✅ get_forms_by_api_key result:')
      console.log(JSON.stringify(data, null, 2))
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\n✅ Found ${data.length} forms`)
        data.forEach(form => {
          console.log(`   - ${form.name} (ID: ${form.id}) - Active: ${form.is_active}`)
        })
      } else {
        console.log('\n⚠️  No forms found - checking if user has forms...')
        
        // Let's also check directly in the forms table
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('user_id')
          .eq('api_key', apiKey)
          .single()
        
        if (userSettings) {
          const { data: forms } = await supabase
            .from('forms')
            .select('id, name, is_active, user_id')
            .eq('user_id', userSettings.user_id)
          
          console.log('\n📋 Direct forms check:')
          console.log('Forms in database:', JSON.stringify(forms, null, 2))
        }
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
  
  console.log('\nTest completed!')
}

testFormsRetrieval()
