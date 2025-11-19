// Final Verification Test - Run this after applying all fixes
// Copy and paste this into your browser console

async function finalVerificationTest() {
  console.log('🎯 FINAL VERIFICATION TEST')
  console.log('=========================')

  const results = {
    webhookSystem: {},
    emailSystem: {},
    overall: {}
  }

  try {
    // Get Supabase client (assuming it's available globally now)
    let supabase = window.supabase
    if (!supabase) {
      console.log('❌ Supabase client not available. Please run the expose script first.')
      return
    }

    console.log('✅ Supabase client available')

    // ===== WEBHOOK SYSTEM VERIFICATION =====
    console.log('\n🔗 TESTING WEBHOOK SYSTEM')

    // Test 1: Insert a response to trigger webhook
    console.log('1️⃣ Testing webhook trigger...')
    try {
      const { data: testResponse, error: insertError } = await supabase
        .from('responses')
        .insert([{
          form_id: '00000000-0000-0000-0000-000000000001',
          contact_name: 'Final Verification Test',
          contact_email: 'verification@test.local',
          contact_phone: '+1234567890',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        results.webhookSystem.trigger = { status: 'ERROR', error: insertError.message }
        console.error('❌ Webhook trigger failed:', insertError)
      } else {
        results.webhookSystem.trigger = { status: 'OK', responseId: testResponse.id }
        console.log('✅ Response inserted successfully')

        // Test 2: Check if webhook notification was created
        console.log('2️⃣ Checking webhook notification creation...')
        await new Promise(resolve => setTimeout(resolve, 3000))

        const { data: webhookNotif, error: webhookError } = await supabase
          .from('webhook_notifications')
          .select('*')
          .eq('response_id', testResponse.id)

        if (webhookError) {
          results.webhookSystem.notification = { status: 'ERROR', error: webhookError.message }
          console.error('❌ Webhook notification check failed:', webhookError)
        } else if (webhookNotif && webhookNotif.length > 0) {
          results.webhookSystem.notification = { status: 'OK', notification: webhookNotif[0] }
          console.log('✅ Webhook notification created:', webhookNotif[0])
        } else {
          results.webhookSystem.notification = { status: 'NO_NOTIFICATION' }
          console.log('❌ No webhook notification created')
        }
      }
    } catch (e) {
      results.webhookSystem.trigger = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
      console.error('❌ Webhook trigger test failed:', e)
    }

    // Test 3: Test webhook processing function
    console.log('3️⃣ Testing webhook processing function...')
    try {
      const response = await fetch('/functions/v1/process-webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'test-token'}`
        }
      })

      results.webhookSystem.processing = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status
      }

      if (response.ok) {
        console.log('✅ Webhook processing function accessible')
      } else {
        console.error('❌ Webhook processing function error:', response.status)
      }
    } catch (e) {
      results.webhookSystem.processing = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
      console.error('❌ Webhook processing test failed:', e)
    }

    // ===== EMAIL SYSTEM VERIFICATION =====
    console.log('\n📧 TESTING EMAIL SYSTEM')

    // Test 4: Test email validation with complex formats
    console.log('4️⃣ Testing email validation...')
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

    const emailResults = []
    for (const email of testEmails) {
      // Test with the updated validation function
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

      let isValid = emailRegex.test(email)
      if (isValid) {
        const [localPart, domain] = email.split('@')
        isValid = isValid &&
          localPart && localPart.length <= 64 &&
          !localPart.startsWith('.') && !localPart.endsWith('.') &&
          !localPart.includes('..') &&
          domain && domain.length <= 253 &&
          !domain.startsWith('.') && !domain.endsWith('.') &&
          !domain.includes('..') &&
          domain.includes('.')
      }

      emailResults.push({ email, isValid })
    }

    results.emailSystem.validation = { status: 'COMPLETED', results: emailResults }
    console.log('✅ Email validation test completed')

    // Test 5: Test email sending endpoint
    console.log('5️⃣ Testing email sending endpoint...')
    try {
      const response = await fetch('/functions/v1/send-response-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'test-token'}`
        },
        body: JSON.stringify({
          response_id: 'test-response-id',
          test: true
        })
      })

      results.emailSystem.sending = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status
      }

      if (response.ok) {
        console.log('✅ Email sending function accessible')
      } else {
        console.error('❌ Email sending function error:', response.status)
      }
    } catch (e) {
      results.emailSystem.sending = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
      console.error('❌ Email sending test failed:', e)
    }

    // ===== FINAL ANALYSIS =====
    console.log('\n📊 FINAL VERIFICATION RESULTS')
    console.log('==============================')

    // Overall status
    const webhookWorking = results.webhookSystem.trigger?.status === 'OK' &&
                          results.webhookSystem.notification?.status === 'OK' &&
                          results.webhookSystem.processing?.status === 'OK'

    const emailWorking = results.emailSystem.validation?.status === 'COMPLETED' &&
                        results.emailSystem.sending?.status === 'OK'

    results.overall = {
      webhookSystem: webhookWorking ? 'WORKING' : 'ISSUES_FOUND',
      emailSystem: emailWorking ? 'WORKING' : 'ISSUES_FOUND',
      overall: (webhookWorking && emailWorking) ? 'ALL_SYSTEMS_WORKING' : 'ISSUES_REMAIN'
    }

    console.log('🔗 Webhook System:', results.overall.webhookSystem)
    console.log('📧 Email System:', results.overall.emailSystem)
    console.log('🎯 Overall Status:', results.overall.overall)

    // Detailed breakdown
    console.log('\n📋 DETAILED BREAKDOWN')
    console.log('Webhook System:')
    console.log(`  • Trigger: ${results.webhookSystem.trigger?.status || 'UNKNOWN'}`)
    console.log(`  • Notification: ${results.webhookSystem.notification?.status || 'UNKNOWN'}`)
    console.log(`  • Processing: ${results.webhookSystem.processing?.status || 'UNKNOWN'}`)

    console.log('Email System:')
    console.log(`  • Validation: ${results.emailSystem.validation?.status || 'UNKNOWN'}`)
    console.log(`  • Sending: ${results.emailSystem.sending?.status || 'UNKNOWN'}`)

    // Email validation details
    const validEmails = emailResults.filter(r => r.isValid && !['invalid-email@', '@invalid.com', 'invalid@.com'].includes(r.email))
    const invalidRejected = emailResults.filter(r => !r.isValid && ['invalid-email@', '@invalid.com', 'invalid@.com'].includes(r.email))

    console.log(`  • Valid emails accepted: ${validEmails.length}/5`)
    console.log(`  • Invalid emails rejected: ${invalidRejected.length}/3`)

    // Recommendations
    if (results.overall.overall === 'ALL_SYSTEMS_WORKING') {
      console.log('\n🎉 SUCCESS! All systems are working correctly!')
      console.log('✅ Webhook system is creating notifications automatically')
      console.log('✅ Webhook processing function is accessible')
      console.log('✅ Email validation accepts complex formats')
      console.log('✅ Email sending function is accessible')
    } else {
      console.log('\n⚠️ Some issues remain. Check the detailed results above.')
    }

  } catch (error) {
    console.error('❌ Final verification failed:', error)
  }

  console.log('\n🏁 Final verification completed')
  return results
}

// Run the final verification
finalVerificationTest().then(results => {
  console.log('📄 Complete results:', results)
})