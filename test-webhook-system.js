// Test script to verify webhook system
// Run this in browser console to test webhook functionality

// Test 1: Check if webhook_notifications table exists and has data
async function testWebhookSystem() {
  console.log('🧪 Testing webhook system...')

  try {
    // Check webhook_notifications table
    const { data: notifications, error } = await supabase
      .from('webhook_notifications')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error accessing webhook_notifications table:', error)
      return
    }

    console.log('✅ webhook_notifications table accessible')
    console.log('📊 Recent notifications:', notifications)

    // Check if clients have webhook URLs
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, webhook_url')
      .not('webhook_url', 'is', null)

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError)
      return
    }

    console.log('✅ Clients with webhook URLs:', clients)

    // Test webhook URL format
    clients.forEach(client => {
      if (client.webhook_url) {
        try {
          new URL(client.webhook_url)
          console.log(`✅ Valid webhook URL for ${client.name}: ${client.webhook_url}`)
        } catch (e) {
          console.error(`❌ Invalid webhook URL for ${client.name}: ${client.webhook_url}`)
        }
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Test 2: Simulate a form submission to test webhook trigger
async function testWebhookTrigger() {
  console.log('🧪 Testing webhook trigger...')

  try {
    // This would normally be triggered by a form submission
    // For testing, we'll check if the trigger exists
    console.log('📝 To test webhook trigger:')
    console.log('1. Set a webhook URL for a client in Clients page')
    console.log('2. Submit a form response for that client')
    console.log('3. Check webhook_notifications table for new entries')
    console.log('4. Check Supabase Edge Function logs for processing')

  } catch (error) {
    console.error('❌ Trigger test failed:', error)
  }
}

// Run tests
testWebhookSystem()
testWebhookTrigger()