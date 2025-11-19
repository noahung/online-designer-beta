import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testClientWebhook() {
  try {
    console.log('🔍 Testing client webhook configuration...')
    
    // Get all clients to see which ones have webhook URLs
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, webhook_url')
    
    if (error) {
      console.error('❌ Error fetching clients:', error)
      return
    }
    
    console.log('📊 Client webhook status:')
    clients.forEach(client => {
      console.log(`- ${client.name} (ID: ${client.id}): ${client.webhook_url ? '✅ Has webhook' : '❌ No webhook'}`)
    })
    
    // Check for forms without webhook URLs
    const clientsWithoutWebhook = clients.filter(c => !c.webhook_url)
    
    if (clientsWithoutWebhook.length > 0) {
      console.log('\n⚠️ Clients missing webhook URLs:')
      clientsWithoutWebhook.forEach(client => {
        console.log(`- ${client.name} (ID: ${client.id}) - No webhook URL configured`)
      })
      
      console.log('\n💡 To fix: Add webhook URLs to these clients in the database')
      console.log('Example SQL: UPDATE clients SET webhook_url = \'https://your-webhook-url.com\' WHERE id = \'client_id\'')
    }
    
  } catch (error) {
    console.error('❌ Error testing client webhook:', error)
  }
}

testClientWebhook()