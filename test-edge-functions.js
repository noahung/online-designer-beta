// Browser-based test for Edge Functions with proper authentication
// Run this in your browser console after logging into the app

async function testEdgeFunctions() {
  console.log('🧪 TESTING EDGE FUNCTIONS WITH AUTH')
  console.log('=====================================')

  const results = {
    webhookProcessing: {},
    emailSending: {}
  }

  try {
    // Get the Supabase client from the window (should be available in the app)
    const supabase = window.supabase
    if (!supabase) {
      console.error('❌ Supabase client not available. Make sure you\'re logged into the app.')
      return
    }

    console.log('✅ Supabase client available')

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ No active session. Please log in first.')
      return
    }

    console.log('✅ User authenticated')

    // ===== TEST WEBHOOK PROCESSING =====
    console.log('\n🔗 TESTING WEBHOOK PROCESSING')
    try {
      const response = await fetch('/functions/v1/process-webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      results.webhookProcessing = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        response: await response.text()
      }

      if (response.ok) {
        console.log('✅ Webhook processing function accessible')
        console.log('📄 Response:', results.webhookProcessing.response)
      } else {
        console.error('❌ Webhook processing function error:', response.status)
        console.error('📄 Error response:', results.webhookProcessing.response)
      }
    } catch (e) {
      results.webhookProcessing = { status: 'ERROR', error: e.message }
      console.error('❌ Webhook processing test failed:', e)
    }

    // ===== TEST EMAIL SENDING =====
    console.log('\n📧 TESTING EMAIL SENDING')
    try {
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

      results.emailSending = {
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        response: await response.text()
      }

      if (response.ok) {
        console.log('✅ Email sending function accessible')
        console.log('📄 Response:', results.emailSending.response)
      } else {
        console.error('❌ Email sending function error:', response.status)
        console.error('📄 Error response:', results.emailSending.response)
      }
    } catch (e) {
      results.emailSending = { status: 'ERROR', error: e.message }
      console.error('❌ Email sending test failed:', e)
    }

    // ===== FINAL RESULTS =====
    console.log('\n📊 FINAL EDGE FUNCTION TEST RESULTS')
    console.log('=====================================')

    console.log('🔗 Webhook Processing:', results.webhookProcessing.status)
    console.log('📧 Email Sending:', results.emailSending.status)

    const allWorking = results.webhookProcessing.status === 'OK' && results.emailSending.status === 'OK'

    if (allWorking) {
      console.log('\n🎉 SUCCESS! All Edge Functions are working correctly!')
    } else {
      console.log('\n⚠️ Some functions have issues. Check the details above.')
    }

  } catch (error) {
    console.error('❌ Edge function test failed:', error)
  }

  console.log('\n🏁 Edge function testing completed')
  return results
}

// Run the test
testEdgeFunctions().then(results => {
  console.log('📄 Complete results:', results)
})