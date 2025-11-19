// Comprehensive test for all systems - run this in browser console
// This tests everything step by step to identify the exact issue

async function comprehensiveSystemTest() {
  console.log('🔬 COMPREHENSIVE SYSTEM TEST')
  console.log('===========================')

  const results = {
    database: {},
    webhookTrigger: {},
    webhookProcessing: {},
    emailSending: {},
    overall: {}
  }

  try {
    // Get Supabase client
    const supabase = window.supabase
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ No active session')
      return
    }

    console.log('✅ Supabase client and session available')

    // ===== STEP 1: Test Database Access =====
    console.log('\n📊 TESTING DATABASE ACCESS')

    try {
      // Test webhook_notifications table access
      const { data: webhookTable, error: webhookError } = await supabase
        .from('webhook_notifications')
        .select('count', { count: 'exact', head: true })

      if (webhookError) {
        results.database.webhookTable = { status: 'ERROR', error: webhookError.message }
        console.error('❌ Webhook notifications table access failed:', webhookError)
      } else {
        results.database.webhookTable = { status: 'OK', count: webhookTable }
        console.log('✅ Webhook notifications table accessible')
      }

      // Test clients table access
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, webhook_url')
        .not('webhook_url', 'is', null)
        .neq('webhook_url', '')

      if (clientsError) {
        results.database.clients = { status: 'ERROR', error: clientsError.message }
        console.error('❌ Clients table access failed:', clientsError)
      } else {
        results.database.clients = { status: 'OK', count: clients.length, clients: clients }
        console.log('✅ Clients table accessible, found', clients.length, 'clients with webhook URLs')
      }

      // Test forms table access
      const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, name, client_id')

      if (formsError) {
        results.database.forms = { status: 'ERROR', error: formsError.message }
        console.error('❌ Forms table access failed:', formsError)
      } else {
        results.database.forms = { status: 'OK', count: forms.length }
        console.log('✅ Forms table accessible, found', forms.length, 'forms')
      }

    } catch (e) {
      console.error('❌ Database access test failed:', e)
      results.database.overall = { status: 'ERROR', error: e.message }
    }

    // ===== STEP 2: Test Webhook Trigger =====
    console.log('\n🔗 TESTING WEBHOOK TRIGGER')

    try {
      // Insert a test response to trigger the webhook
      const testFormId = '00000000-0000-0000-0000-000000000001' // Use a test UUID

      const { data: testResponse, error: insertError } = await supabase
        .from('responses')
        .insert([{
          form_id: testFormId,
          contact_name: 'System Test User',
          contact_email: 'test@system.local',
          contact_phone: '+1234567890',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        results.webhookTrigger.insert = { status: 'ERROR', error: insertError.message }
        console.error('❌ Response insert failed:', insertError)
      } else {
        results.webhookTrigger.insert = { status: 'OK', responseId: testResponse.id }
        console.log('✅ Test response inserted:', testResponse.id)

        // Wait for trigger to execute
        console.log('⏳ Waiting for webhook trigger to execute...')
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Check if webhook notification was created
        const { data: notifications, error: notifError } = await supabase
          .from('webhook_notifications')
          .select('*')
          .eq('response_id', testResponse.id)

        if (notifError) {
          results.webhookTrigger.notification = { status: 'ERROR', error: notifError.message }
          console.error('❌ Webhook notification check failed:', notifError)
        } else if (notifications && notifications.length > 0) {
          results.webhookTrigger.notification = { status: 'OK', notification: notifications[0] }
          console.log('✅ Webhook notification created:', notifications[0])
        } else {
          results.webhookTrigger.notification = { status: 'NO_NOTIFICATION' }
          console.log('❌ No webhook notification created - trigger may have failed')
        }
      }
    } catch (e) {
      console.error('❌ Webhook trigger test failed:', e)
      results.webhookTrigger.overall = { status: 'ERROR', error: e.message }
    }

    // ===== STEP 3: Test Webhook Processing =====
    console.log('\n⚙️ TESTING WEBHOOK PROCESSING')

    try {
      // Call the process-webhooks function
      const response = await fetch('/functions/v1/process-webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const responseText = await response.text()

      results.webhookProcessing.call = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        response: responseText
      }

      if (response.ok) {
        console.log('✅ Webhook processing function called successfully')
        console.log('📄 Response:', responseText)
      } else {
        console.error('❌ Webhook processing function failed:', response.status)
        console.error('📄 Error response:', responseText)
      }
    } catch (e) {
      console.error('❌ Webhook processing test failed:', e)
      results.webhookProcessing.call = { status: 'ERROR', error: e.message }
    }

    // ===== STEP 4: Test Email Sending =====
    console.log('\n📧 TESTING EMAIL SENDING')

    try {
      // Call the send-response-email function
      const response = await fetch('/functions/v1/send-response-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          response_id: 'test-response-id',
          test: true
        })
      })

      const responseText = await response.text()

      results.emailSending.call = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        response: responseText
      }

      if (response.ok) {
        console.log('✅ Email sending function called successfully')
        console.log('📄 Response:', responseText)
      } else {
        console.error('❌ Email sending function failed:', response.status)
        console.error('📄 Error response:', responseText)
      }
    } catch (e) {
      console.error('❌ Email sending test failed:', e)
      results.emailSending.call = { status: 'ERROR', error: e.message }
    }

    // ===== STEP 5: Final Analysis =====
    console.log('\n📊 FINAL ANALYSIS')
    console.log('================')

    // Overall assessment
    const dbOk = results.database.webhookTable?.status === 'OK' &&
                 results.database.clients?.status === 'OK' &&
                 results.database.forms?.status === 'OK'

    const webhookOk = results.webhookTrigger.insert?.status === 'OK' &&
                     results.webhookTrigger.notification?.status === 'OK' &&
                     results.webhookProcessing.call?.status === 'OK'

    const emailOk = results.emailSending.call?.status === 'OK'

    results.overall = {
      database: dbOk ? 'WORKING' : 'ISSUES_FOUND',
      webhookSystem: webhookOk ? 'WORKING' : 'ISSUES_FOUND',
      emailSystem: emailOk ? 'WORKING' : 'ISSUES_FOUND',
      overall: (dbOk && webhookOk && emailOk) ? 'ALL_SYSTEMS_WORKING' : 'ISSUES_REMAIN'
    }

    console.log('📊 Database:', results.overall.database)
    console.log('🔗 Webhook System:', results.overall.webhookSystem)
    console.log('📧 Email System:', results.overall.emailSystem)
    console.log('🎯 Overall Status:', results.overall.overall)

    // Detailed breakdown
    console.log('\n📋 DETAILED BREAKDOWN')
    console.log('Database:')
    console.log(`  • Webhook Table: ${results.database.webhookTable?.status || 'UNKNOWN'}`)
    console.log(`  • Clients Table: ${results.database.clients?.status || 'UNKNOWN'}`)
    console.log(`  • Forms Table: ${results.database.forms?.status || 'UNKNOWN'}`)

    console.log('Webhook System:')
    console.log(`  • Trigger Insert: ${results.webhookTrigger.insert?.status || 'UNKNOWN'}`)
    console.log(`  • Notification Creation: ${results.webhookTrigger.notification?.status || 'UNKNOWN'}`)
    console.log(`  • Processing Function: ${results.webhookProcessing.call?.status || 'UNKNOWN'}`)

    console.log('Email System:')
    console.log(`  • Sending Function: ${results.emailSending.call?.status || 'UNKNOWN'}`)

    // Recommendations
    if (results.overall.overall === 'ALL_SYSTEMS_WORKING') {
      console.log('\n🎉 SUCCESS! All systems are working correctly!')
    } else {
      console.log('\n⚠️ Issues found. Key problems:')
      if (!dbOk) console.log('  • Database access issues')
      if (!webhookOk) console.log('  • Webhook trigger or processing issues')
      if (!emailOk) console.log('  • Email sending issues')
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error)
  }

  console.log('\n🏁 Comprehensive test completed')
  return results
}

// Run the comprehensive test
comprehensiveSystemTest().then(results => {
  console.log('📄 Complete results:', results)
})