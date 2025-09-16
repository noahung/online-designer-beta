// Comprehensive Diagnostic Test for Webhook and Email Systems
// Run this in browser console to diagnose both systems

async function comprehensiveDiagnostic() {
  console.log('🔍 Comprehensive Diagnostic Starting...')
  console.log('=====================================')

  const results = {
    webhookSystem: {},
    emailSystem: {},
    database: {},
    recommendations: []
  }

  try {
    // ===== DATABASE CHECKS =====
    console.log('📊 DATABASE CHECKS')
    console.log('------------------')

    // Check webhook_notifications table
    console.log('1️⃣ Checking webhook_notifications table...')
    try {
      const { data: notifications, error } = await supabase
        .from('webhook_notifications')
        .select('*')
        .limit(1)

      if (error) {
        results.database.webhookTable = { status: 'ERROR', error: error.message }
        console.error('❌ webhook_notifications table error:', error)
      } else {
        results.database.webhookTable = { status: 'OK', count: notifications?.length || 0 }
        console.log('✅ webhook_notifications table accessible')
      }
    } catch (e) {
      results.database.webhookTable = { status: 'ERROR', error: e.message }
      console.error('❌ webhook_notifications table check failed:', e)
    }

    // Check clients table webhook_url column
    console.log('2️⃣ Checking clients webhook_url column...')
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, webhook_url')
        .not('webhook_url', 'is', null)
        .neq('webhook_url', '')

      if (error) {
        results.database.clientsWebhook = { status: 'ERROR', error: error.message }
        console.error('❌ clients webhook_url check error:', error)
      } else {
        results.database.clientsWebhook = { status: 'OK', count: clients?.length || 0, clients }
        console.log(`✅ Found ${clients?.length || 0} clients with webhook URLs`)
      }
    } catch (e) {
      results.database.clientsWebhook = { status: 'ERROR', error: e.message }
      console.error('❌ clients webhook_url check failed:', e)
    }

    // Check recent responses
    console.log('3️⃣ Checking recent responses...')
    try {
      const { data: responses, error } = await supabase
        .from('responses')
        .select('id, form_id, contact_email, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(5)

      if (error) {
        results.database.recentResponses = { status: 'ERROR', error: error.message }
        console.error('❌ recent responses check error:', error)
      } else {
        results.database.recentResponses = { status: 'OK', responses }
        console.log(`✅ Found ${responses?.length || 0} recent responses`)
      }
    } catch (e) {
      results.database.recentResponses = { status: 'ERROR', error: e.message }
      console.error('❌ recent responses check failed:', e)
    }

    // ===== WEBHOOK SYSTEM CHECKS =====
    console.log('\n🔗 WEBHOOK SYSTEM CHECKS')
    console.log('------------------------')

    // Check webhook trigger function
    console.log('4️⃣ Testing webhook trigger function...')
    try {
      const { data: testResponse, error: insertError } = await supabase
        .from('responses')
        .insert([{
          form_id: '00000000-0000-0000-0000-000000000001', // Test UUID
          contact_name: 'Diagnostic Test',
          contact_email: 'diagnostic@test.local',
          contact_phone: '+1234567890',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        results.webhookSystem.triggerTest = { status: 'ERROR', error: insertError.message }
        console.error('❌ Webhook trigger test failed:', insertError)
      } else {
        results.webhookSystem.triggerTest = { status: 'OK', responseId: testResponse.id }
        console.log('✅ Test response created successfully')

        // Wait and check for webhook notification
        console.log('⏳ Waiting for webhook notification creation...')
        await new Promise(resolve => setTimeout(resolve, 3000))

        const { data: webhookNotif, error: webhookError } = await supabase
          .from('webhook_notifications')
          .select('*')
          .eq('response_id', testResponse.id)

        if (webhookError) {
          results.webhookSystem.notificationCheck = { status: 'ERROR', error: webhookError.message }
          console.error('❌ Webhook notification check failed:', webhookError)
        } else if (webhookNotif && webhookNotif.length > 0) {
          results.webhookSystem.notificationCheck = { status: 'OK', notification: webhookNotif[0] }
          console.log('✅ Webhook notification created:', webhookNotif[0])
        } else {
          results.webhookSystem.notificationCheck = { status: 'NO_NOTIFICATION' }
          console.log('❌ No webhook notification was created')
        }
      }
    } catch (e) {
      results.webhookSystem.triggerTest = { status: 'ERROR', error: e.message }
      console.error('❌ Webhook trigger test failed:', e)
    }

    // Test webhook processing function
    console.log('5️⃣ Testing webhook processing function...')
    try {
      const response = await fetch('/functions/v1/process-webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'test-token'}`
        }
      })

      results.webhookSystem.processingTest = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        statusText: response.statusText
      }

      if (response.ok) {
        console.log('✅ Webhook processing function accessible')
      } else {
        const errorText = await response.text()
        console.error('❌ Webhook processing function error:', response.status, errorText)
      }
    } catch (e) {
      results.webhookSystem.processingTest = { status: 'ERROR', error: e.message }
      console.error('❌ Webhook processing test failed:', e)
    }

    // ===== EMAIL SYSTEM CHECKS =====
    console.log('\n📧 EMAIL SYSTEM CHECKS')
    console.log('----------------------')

    // Test email validation function
    console.log('6️⃣ Testing email validation...')
    const testEmails = [
      'simple@test.com',
      'user.name+tag@domain.co.uk',
      'test@monday.com',
      'complex.email@sub.domain.monday.com',
      'user_name123@test-domain.org',
      'invalid-email@',
      '@invalid.com',
      'invalid@.com'
    ]

    const emailValidationResults = []
    for (const email of testEmails) {
      try {
        // Test the email validation function (assuming it's available globally)
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Basic validation
        emailValidationResults.push({ email, isValid })
      } catch (e) {
        emailValidationResults.push({ email, error: e.message })
      }
    }

    results.emailSystem.validationTest = { status: 'COMPLETED', results: emailValidationResults }
    console.log('✅ Email validation test completed')

    // Test email sending function
    console.log('7️⃣ Testing email sending function...')
    try {
      const response = await fetch('/api/send-response-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: 'diagnostic@test.local',
          subject: 'Diagnostic Test Email',
          html: '<p>This is a diagnostic test email.</p>',
          test: true
        })
      })

      results.emailSystem.sendTest = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        statusText: response.statusText
      }

      if (response.ok) {
        console.log('✅ Email sending function accessible')
      } else {
        const errorText = await response.text()
        console.error('❌ Email sending function error:', response.status, errorText)
      }
    } catch (e) {
      results.emailSystem.sendTest = { status: 'ERROR', error: e.message }
      console.error('❌ Email sending test failed:', e)
    }

    // ===== ANALYSIS AND RECOMMENDATIONS =====
    console.log('\n📋 ANALYSIS & RECOMMENDATIONS')
    console.log('-----------------------------')

    // Analyze webhook system
    if (results.database.webhookTable.status === 'ERROR') {
      results.recommendations.push('❌ webhook_notifications table does not exist or is inaccessible')
      results.recommendations.push('   → Run the webhook_notifications table creation SQL')
    }

    if (results.database.clientsWebhook.status === 'OK' && results.database.clientsWebhook.count === 0) {
      results.recommendations.push('⚠️ No clients have webhook URLs configured')
      results.recommendations.push('   → Configure webhook URLs in the Clients section')
    }

    if (results.webhookSystem.triggerTest.status === 'OK' && results.webhookSystem.notificationCheck.status === 'NO_NOTIFICATION') {
      results.recommendations.push('❌ Database trigger is not creating webhook notifications')
      results.recommendations.push('   → Check and recreate the webhook trigger function')
    }

    if (results.webhookSystem.processingTest.status === 'ERROR') {
      results.recommendations.push('❌ Webhook processing function is not accessible')
      results.recommendations.push('   → Check Edge Function deployment and configuration')
    }

    // Analyze email system
    const failedEmails = emailValidationResults.filter(r => !r.isValid && !r.error)
    if (failedEmails.length > 0) {
      results.recommendations.push(`❌ Email validation failing for: ${failedEmails.map(r => r.email).join(', ')}`)
      results.recommendations.push('   → Update email validation regex to be more permissive')
    }

    if (results.emailSystem.sendTest.status === 'ERROR') {
      results.recommendations.push('❌ Email sending function is not working')
      results.recommendations.push('   → Check Brevo API configuration and credentials')
    }

    // Print results summary
    console.log('\n📊 DIAGNOSTIC RESULTS SUMMARY')
    console.log('=============================')

    console.log('Database Status:')
    console.log(`  • webhook_notifications table: ${results.database.webhookTable.status}`)
    console.log(`  • Clients with webhook URLs: ${results.database.clientsWebhook.status} (${results.database.clientsWebhook.count || 0})`)
    console.log(`  • Recent responses: ${results.database.recentResponses.status}`)

    console.log('Webhook System Status:')
    console.log(`  • Trigger function: ${results.webhookSystem.triggerTest.status}`)
    console.log(`  • Notification creation: ${results.webhookSystem.notificationCheck.status}`)
    console.log(`  • Processing function: ${results.webhookSystem.processingTest.status}`)

    console.log('Email System Status:')
    console.log(`  • Validation: ${results.emailSystem.validationTest.status}`)
    console.log(`  • Sending function: ${results.emailSystem.sendTest.status}`)

    if (results.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDED FIXES:')
      results.recommendations.forEach(rec => console.log(`  ${rec}`))
    } else {
      console.log('\n✅ All systems appear to be working correctly!')
    }

  } catch (error) {
    console.error('❌ Comprehensive diagnostic failed:', error)
  }

  console.log('\n🏁 Comprehensive diagnostic completed')
  return results
}

// Run the diagnostic
comprehensiveDiagnostic().then(results => {
  console.log('📄 Full results object:', results)
})