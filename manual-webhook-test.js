// Manual webhook test
// Run this in browser console to manually test the webhook system

async function manualWebhookTest() {
  console.log('🧪 Manual Webhook Test Starting...')

  try {
    // Step 1: Check if webhook_notifications table exists
    console.log('1️⃣ Checking webhook_notifications table...')
    const { data: notifications, error: tableError } = await supabase
      .from('webhook_notifications')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ webhook_notifications table error:', tableError)
      return
    }
    console.log('✅ webhook_notifications table accessible')

    // Step 2: Check clients with webhook URLs
    console.log('2️⃣ Checking clients with webhook URLs...')
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, webhook_url')
      .not('webhook_url', 'is', null)
      .neq('webhook_url', '')

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError)
      return
    }

    console.log(`✅ Found ${clients.length} clients with webhook URLs:`, clients)

    if (clients.length === 0) {
      console.log('⚠️ No clients have webhook URLs configured')
      return
    }

    // Step 3: Get forms for clients with webhooks
    console.log('3️⃣ Getting forms for clients with webhooks...')
    const clientIds = clients.map(c => c.id)
    const { data: forms, error: formError } = await supabase
      .from('forms')
      .select('id, name, client_id')
      .in('client_id', clientIds)

    if (formError) {
      console.error('❌ Error fetching forms:', formError)
      return
    }

    console.log(`✅ Found ${forms.length} forms for clients with webhooks:`, forms)

    // Step 4: Manually create a test response to trigger webhook
    if (forms.length > 0) {
      console.log('4️⃣ Creating test response to trigger webhook...')

      const testForm = forms[0]
      const testClient = clients.find(c => c.id === testForm.client_id)

      console.log(`📝 Creating test response for form: ${testForm.name} (${testForm.id})`)
      console.log(`👤 Client: ${testClient?.name} (${testClient?.id})`)
      console.log(`🔗 Webhook URL: ${testClient?.webhook_url}`)

      const { data: testResponse, error: insertError } = await supabase
        .from('responses')
        .insert([{
          form_id: testForm.id,
          contact_name: 'Webhook Test User',
          contact_email: 'test@webhook.local',
          contact_phone: '+1234567890',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error creating test response:', insertError)
        return
      }

      console.log('✅ Test response created:', testResponse)

      // Step 5: Check if webhook notification was created
      console.log('5️⃣ Checking if webhook notification was created...')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const { data: webhookNotifications, error: webhookError } = await supabase
        .from('webhook_notifications')
        .select('*')
        .eq('response_id', testResponse.id)
        .order('created_at', { ascending: false })

      if (webhookError) {
        console.error('❌ Error checking webhook notifications:', webhookError)
        return
      }

      if (webhookNotifications && webhookNotifications.length > 0) {
        console.log('✅ Webhook notification created:', webhookNotifications[0])
        console.log('📊 Notification details:', {
          id: webhookNotifications[0].id,
          webhook_url: webhookNotifications[0].webhook_url,
          status: webhookNotifications[0].status,
          attempts: webhookNotifications[0].attempts,
          created_at: webhookNotifications[0].created_at
        })
      } else {
        console.log('❌ No webhook notification was created')
        console.log('🔍 Checking recent webhook notifications...')

        const { data: recentNotifications, error: recentError } = await supabase
          .from('webhook_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (!recentError && recentNotifications) {
          console.log('📋 Recent webhook notifications:', recentNotifications)
        }
      }

      // Step 6: Test webhook processing (if notification exists)
      if (webhookNotifications && webhookNotifications.length > 0) {
        console.log('6️⃣ Testing webhook processing...')

        const notification = webhookNotifications[0]

        try {
          const response = await fetch('/functions/v1/process-webhooks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabase.supabaseKey}`
            }
          })

          console.log('🔄 Webhook processing response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          })

          if (response.ok) {
            console.log('✅ Webhook processing triggered successfully')
          } else {
            const errorText = await response.text()
            console.error('❌ Webhook processing failed:', errorText)
          }
        } catch (error) {
          console.error('❌ Error calling webhook processing:', error)
        }
      }
    }

  } catch (error) {
    console.error('❌ Manual webhook test failed:', error)
  }

  console.log('🏁 Manual webhook test completed')
}

// Run the test
manualWebhookTest()