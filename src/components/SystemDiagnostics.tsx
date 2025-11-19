import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

interface DiagnosticResults {
  webhookSystem: {
    triggerTest?: { status: string; error?: string; responseId?: string }
    notificationCheck?: { status: string; error?: string; notification?: any }
    processingTest?: { status: string; statusCode?: number; statusText?: string; error?: string }
  }
  emailSystem: {
    validationTest?: { status: string; results?: any[] }
    sendTest?: { status: string; statusCode?: number; statusText?: string; endpoint?: string; error?: string }
  }
  database: {
    webhookTable?: { status: string; error?: string; count?: number }
    clientsWebhook?: { status: string; error?: string; count?: number; clients?: any[] }
    recentResponses?: { status: string; error?: string; responses?: any[] }
  }
  recommendations: string[]
}

export default function SystemDiagnostics() {
  const [results, setResults] = useState<DiagnosticResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    const diagnosticResults: DiagnosticResults = {
      webhookSystem: {},
      emailSystem: {},
      database: {},
      recommendations: []
    }

    try {
      console.log('🔍 Running System Diagnostics...')

      // ===== DATABASE CHECKS =====
      console.log('📊 DATABASE CHECKS')

      // Check webhook_notifications table
      console.log('1️⃣ Checking webhook_notifications table...')
      try {
        const { data: notifications, error } = await supabase
          .from('webhook_notifications')
          .select('*')
          .limit(1)

        if (error) {
          diagnosticResults.database.webhookTable = { status: 'ERROR', error: error.message }
          console.error('❌ webhook_notifications table error:', error)
        } else {
          diagnosticResults.database.webhookTable = { status: 'OK', count: notifications?.length || 0 }
          console.log('✅ webhook_notifications table accessible')
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        diagnosticResults.database.webhookTable = { status: 'ERROR', error: errorMessage }
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
          diagnosticResults.database.clientsWebhook = { status: 'ERROR', error: error.message }
          console.error('❌ clients webhook_url check error:', error)
        } else {
          diagnosticResults.database.clientsWebhook = { status: 'OK', count: clients?.length || 0, clients }
          console.log(`✅ Found ${clients?.length || 0} clients with webhook URLs`)
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        diagnosticResults.database.clientsWebhook = { status: 'ERROR', error: errorMessage }
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
          diagnosticResults.database.recentResponses = { status: 'ERROR', error: error.message }
          console.error('❌ recent responses check error:', error)
        } else {
          diagnosticResults.database.recentResponses = { status: 'OK', responses }
          console.log(`✅ Found ${responses?.length || 0} recent responses`)
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        diagnosticResults.database.recentResponses = { status: 'ERROR', error: errorMessage }
        console.error('❌ recent responses check failed:', e)
      }

      // ===== WEBHOOK SYSTEM CHECKS =====
      console.log('🔗 WEBHOOK SYSTEM CHECKS')

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
          diagnosticResults.webhookSystem.triggerTest = { status: 'ERROR', error: insertError.message }
          console.error('❌ Webhook trigger test failed:', insertError)
        } else {
          diagnosticResults.webhookSystem.triggerTest = { status: 'OK', responseId: testResponse.id }
          console.log('✅ Test response created successfully')

          // Wait and check for webhook notification
          console.log('⏳ Waiting for webhook notification creation...')
          await new Promise(resolve => setTimeout(resolve, 3000))

          const { data: webhookNotif, error: webhookError } = await supabase
            .from('webhook_notifications')
            .select('*')
            .eq('response_id', testResponse.id)

          if (webhookError) {
            diagnosticResults.webhookSystem.notificationCheck = { status: 'ERROR', error: webhookError.message }
            console.error('❌ Webhook notification check failed:', webhookError)
          } else if (webhookNotif && webhookNotif.length > 0) {
            diagnosticResults.webhookSystem.notificationCheck = { status: 'OK', notification: webhookNotif[0] }
            console.log('✅ Webhook notification created:', webhookNotif[0])
          } else {
            diagnosticResults.webhookSystem.notificationCheck = { status: 'NO_NOTIFICATION' }
            console.log('❌ No webhook notification was created')
          }
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        diagnosticResults.webhookSystem.triggerTest = { status: 'ERROR', error: errorMessage }
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

        diagnosticResults.webhookSystem.processingTest = {
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
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        diagnosticResults.webhookSystem.processingTest = { status: 'ERROR', error: errorMessage }
        console.error('❌ Webhook processing test failed:', e)
      }

      // ===== EMAIL SYSTEM CHECKS =====
      console.log('📧 EMAIL SYSTEM CHECKS')

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
          const errorMessage = e instanceof Error ? e.message : 'Unknown error'
          emailValidationResults.push({ email, error: errorMessage })
        }
      }

      diagnosticResults.emailSystem.validationTest = { status: 'COMPLETED', results: emailValidationResults }
      console.log('✅ Email validation test completed')

      // Test email sending function - try different endpoint paths
      console.log('7️⃣ Testing email sending function...')
      const emailEndpoints = [
        '/api/send-response-email',
        '/src/api/send-response-email',
        '/send-response-email'
      ]

      let emailTestResult = null
      for (const endpoint of emailEndpoints) {
        try {
          console.log(`Testing endpoint: ${endpoint}`)
          const response = await fetch(endpoint, {
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

          if (response.ok || response.status !== 404) {
            emailTestResult = {
              status: response.ok ? 'OK' : 'ERROR',
              statusCode: response.status,
              statusText: response.statusText,
              endpoint: endpoint
            }
            console.log(`✅ Email endpoint found: ${endpoint} (${response.status})`)
            break
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error'
          console.log(`❌ Endpoint ${endpoint} failed:`, errorMessage)
        }
      }

      if (!emailTestResult) {
        emailTestResult = { status: 'ERROR', statusCode: 404, statusText: 'Not Found', endpoint: 'none' }
        console.error('❌ No working email endpoint found')
      }

      diagnosticResults.emailSystem.sendTest = emailTestResult

      // ===== ANALYSIS AND RECOMMENDATIONS =====
      console.log('📋 ANALYSIS & RECOMMENDATIONS')

      // Analyze webhook system
      if (diagnosticResults.database.webhookTable.status === 'ERROR') {
        diagnosticResults.recommendations.push('❌ webhook_notifications table does not exist or is inaccessible')
        diagnosticResults.recommendations.push('   → Run the webhook_notifications table creation SQL')
      }

      if (diagnosticResults.database.clientsWebhook.status === 'OK' && diagnosticResults.database.clientsWebhook.count === 0) {
        diagnosticResults.recommendations.push('⚠️ No clients have webhook URLs configured')
        diagnosticResults.recommendations.push('   → Configure webhook URLs in the Clients section')
      }

      if (diagnosticResults.webhookSystem.triggerTest?.status === 'OK' && diagnosticResults.webhookSystem.notificationCheck?.status === 'NO_NOTIFICATION') {
        diagnosticResults.recommendations.push('❌ Database trigger is not creating webhook notifications')
        diagnosticResults.recommendations.push('   → Check and recreate the webhook trigger function')
      }

      if (diagnosticResults.webhookSystem.processingTest.status === 'ERROR') {
        diagnosticResults.recommendations.push('❌ Webhook processing function is not accessible')
        diagnosticResults.recommendations.push('   → Check Edge Function deployment and configuration')
      }

      // Analyze email system
      const failedEmails = emailValidationResults.filter(r => !r.isValid && !r.error)
      if (failedEmails.length > 0) {
        diagnosticResults.recommendations.push(`❌ Email validation failing for: ${failedEmails.map(r => r.email).join(', ')}`)
        diagnosticResults.recommendations.push('   → Update email validation regex to be more permissive')
      }

      if (diagnosticResults.emailSystem.sendTest.status === 'ERROR') {
        diagnosticResults.recommendations.push('❌ Email sending function is not working')
        diagnosticResults.recommendations.push('   → Check Brevo API configuration and credentials')
      }

      console.log('🏁 Diagnostics completed')
      setResults(diagnosticResults)

    } catch (error) {
      console.error('❌ Diagnostic failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔍 System Diagnostics</h2>
        <p className="text-gray-600 mb-6">
          Run comprehensive diagnostics to identify issues with webhook and email systems.
        </p>

        <Button
          onClick={runDiagnostics}
          disabled={loading}
          className="mb-6"
        >
          {loading ? '🔄 Running Diagnostics...' : '🚀 Run Diagnostics'}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">❌ Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Database Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">📊 Database Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>webhook_notifications table:</span>
                  <span className={results.database.webhookTable?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.database.webhookTable?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clients with webhook URLs:</span>
                  <span className={results.database.clientsWebhook?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.database.clientsWebhook?.status || 'Unknown'} ({results.database.clientsWebhook?.count || 0})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recent responses:</span>
                  <span className={results.database.recentResponses?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.database.recentResponses?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Webhook System Status */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">🔗 Webhook System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Trigger function:</span>
                  <span className={results.webhookSystem.triggerTest?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.webhookSystem.triggerTest?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Notification creation:</span>
                  <span className={results.webhookSystem.notificationCheck?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.webhookSystem.notificationCheck?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing function:</span>
                  <span className={results.webhookSystem.processingTest?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.webhookSystem.processingTest?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Email System Status */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">📧 Email System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Validation:</span>
                  <span className={results.emailSystem.validationTest?.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}>
                    {results.emailSystem.validationTest?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sending function:</span>
                  <span className={results.emailSystem.sendTest?.status === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {results.emailSystem.sendTest?.status || 'Unknown'} ({results.emailSystem.sendTest?.endpoint || 'none'})
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-800 font-semibold mb-3">🔧 Recommended Fixes</h3>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-yellow-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Message */}
            {results.recommendations.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold">✅ All Systems Working</h3>
                <p className="text-green-700">All diagnostic checks passed successfully!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}