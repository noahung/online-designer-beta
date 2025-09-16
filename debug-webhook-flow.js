// Comprehensive webhook debugging script
// Run with: node debug-webhook-flow.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bahloynyhjgmdndqabhu.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugWebhookFlow() {
  console.log('🔍 Starting comprehensive webhook flow debugging...\n')

  // 1. Check webhook_notifications table
  console.log('1️⃣ Checking webhook_notifications table...')
  try {
    const { data: notifications, error } = await supabase
      .from('webhook_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.log('❌ Error querying webhook_notifications:', error.message)
    } else {
      console.log('✅ Found', notifications?.length || 0, 'recent webhook notifications:')
      notifications?.forEach((n, i) => {
        console.log(`   ${i + 1}. ID: ${n.id}`)
        console.log(`      Status: ${n.status}`)
        console.log(`      Webhook URL: ${n.webhook_url}`)
        console.log(`      Attempts: ${n.attempts}`)
        console.log(`      Created: ${n.created_at}`)
        if (n.error_message) {
          console.log(`      Error: ${n.error_message}`)
        }
        console.log('')
      })
    }
  } catch (err) {
    console.log('❌ Unexpected error checking webhook_notifications:', err.message)
  }

  // 2. Check clients table for webhook URLs
  console.log('2️⃣ Checking clients table for webhook URLs...')
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, webhook_url')
      .not('webhook_url', 'is', null)
      .neq('webhook_url', '')

    if (error) {
      console.log('❌ Error querying clients:', error.message)
    } else {
      console.log('✅ Found', clients?.length || 0, 'clients with webhook URLs:')
      clients?.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (ID: ${c.id})`)
        console.log(`      Webhook URL: ${c.webhook_url}`)
        console.log('')
      })

      if (!clients || clients.length === 0) {
        console.log('⚠️  NO CLIENTS HAVE WEBHOOK URLs CONFIGURED!')
        console.log('   This is likely the root cause of the "webhook not configured" error.')
        console.log('   Solution: Set webhook URLs in the client management interface.')
      }
    }
  } catch (err) {
    console.log('❌ Unexpected error checking clients:', err.message)
  }

  // 3. Check recent form responses
  console.log('3️⃣ Checking recent form responses...')
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        id,
        form_id,
        created_at,
        forms (
          name,
          client_id,
          clients (
            name,
            webhook_url
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.log('❌ Error querying responses:', error.message)
    } else {
      console.log('✅ Found', responses?.length || 0, 'recent responses:')
      responses?.forEach((r, i) => {
        console.log(`   ${i + 1}. Response ID: ${r.id}`)
        console.log(`      Form: ${r.forms?.name} (ID: ${r.form_id})`)
        console.log(`      Client: ${r.forms?.clients?.name}`)
        console.log(`      Client Webhook URL: ${r.forms?.clients?.webhook_url || 'NOT SET'}`)
        console.log(`      Created: ${r.created_at}`)
        console.log('')
      })
    }
  } catch (err) {
    console.log('❌ Unexpected error checking responses:', err.message)
  }

  // 4. Test API endpoints
  console.log('4️⃣ Testing webhook API endpoints...')

  // Test subscribe endpoint (this will fail without proper auth, but we can see the structure)
  console.log('   Testing /api/webhooks/subscribe endpoint structure...')
  try {
    const subscribeResponse = await fetch('https://designer.advertomedia.co.uk/api/webhooks/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: 'test-form-id',
        api_key: 'test-api-key'
      })
    })
    console.log('   Subscribe endpoint response:', subscribeResponse.status, subscribeResponse.statusText)
  } catch (err) {
    console.log('   Subscribe endpoint test failed (expected):', err.message)
  }

  // Test unsubscribe endpoint
  console.log('   Testing /api/webhooks/unsubscribe endpoint structure...')
  try {
    const unsubscribeResponse = await fetch('https://designer.advertomedia.co.uk/api/webhooks/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: 'test-form-id',
        api_key: 'test-api-key'
      })
    })
    console.log('   Unsubscribe endpoint response:', unsubscribeResponse.status, unsubscribeResponse.statusText)
  } catch (err) {
    console.log('   Unsubscribe endpoint test failed (expected):', err.message)
  }

  // 5. Check Edge Function logs (if accessible)
  console.log('5️⃣ Edge Function status...')
  console.log('   Edge Function URL: https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/process-webhooks')
  console.log('   Check Supabase Dashboard > Edge Functions > process-webhooks for logs')

  console.log('\n🎯 DEBUGGING SUMMARY:')
  console.log('====================')
  console.log('1. If no webhook URLs are configured in clients table → Set webhook URLs in client management')
  console.log('2. If webhook URLs exist but no notifications are created → Check database trigger logs')
  console.log('3. If notifications exist but status is "pending" → Check Edge Function logs')
  console.log('4. If notifications are "failed" → Check error_message field for details')
  console.log('5. Check Vercel function logs for API endpoint errors')
  console.log('6. Check browser console for any JavaScript errors during form submission')

  console.log('\n📋 NEXT STEPS:')
  console.log('1. Deploy the updated code with debugging logs')
  console.log('2. Submit a test form response')
  console.log('3. Check all the logs mentioned above')
  console.log('4. Look for the 🔍 debug messages in each component')
}

debugWebhookFlow().catch(console.error)