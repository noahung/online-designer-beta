// Comprehensive email validation and Brevo integration test
// Run this in browser console to test email validation and Brevo API

// Access the supabase client from the window (assuming it's available globally)
const supabase = window.supabase || window.supabaseClient;

function isValidEmail(email) {
  // More permissive validation that allows complex emails like Monday.com
  if (!email || typeof email !== 'string') return false
  const trimmedEmail = email.trim()

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) return false

  const [localPart, domain] = trimmedEmail.split('@')

  // Allow longer local parts for complex emails
  if (!localPart || localPart.length === 0 || localPart.length > 100) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (localPart.includes('..')) return false

  // Domain validation
  if (!domain || domain.length === 0 || domain.length > 253) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false
  if (!domain.includes('.')) return false

  // Check domain parts
  const domainParts = domain.split('.')
  for (const part of domainParts) {
    if (part.length === 0 || part.length > 63) return false
    if (part.startsWith('-') || part.endsWith('-')) return false
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false
  }

  // TLD validation (allow longer TLDs for complex domains)
  const tld = domainParts[domainParts.length - 1]
  if (!tld || tld.length < 2 || tld.length > 10) return false

  // Final checks
  if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) return false
  if (localPart.includes('..') || domain.includes('..')) return false

  return true
}

// Test various email formats including complex ones
const testEmails = [
  // Valid emails
  'simple@test.com',
  'user.name+tag@domain.co.uk',
  'test@monday.com',
  'complex.email@sub.domain.monday.com',
  'user_name123@test-domain.org',
  'adverto-medialtd-company_pulse_7576953447_158df1fbfb09becd31d1__36913538@use1.mx.monday.com',

  // Invalid emails that should be rejected
  'invalid-email@',
  '@invalid.com',
  'invalid@.com',
  'test..double@test.com',
  '.startswithdot@test.com',
  'endswithdot.@test.com',
  'test@domain..com',
  'test@.domain.com',
  'test@-domain.com',
  'test@domain-.com',
  'test@domain',
  'test@domain.',
  '.test@domain.com',
  'test.@domain.com',
  'test@domain..com',
  'test@domain.c',
  'test@domain.123',
  'test@domain.-com',
  'test@-domain.com'
]

console.log('🧪 Email Validation & Brevo Integration Test Results:')
console.log('=====================================================')

const results = {
  validation: { valid: 0, invalid: 0 },
  brevo: { configured: false, connected: false }
}

testEmails.forEach(email => {
  const isValid = isValidEmail(email)
  console.log(`${isValid ? '✅' : '❌'} ${email}`)
  if (isValid) results.validation.valid++
  else results.validation.invalid++
})

console.log('\n📋 Summary:')
console.log(`Total emails tested: ${testEmails.length}`)
console.log(`Valid emails: ${results.validation.valid}`)
console.log(`Invalid emails: ${results.validation.invalid}`)

// Test the Monday.com email specifically
const mondayEmail = 'adverto-medialtd-company_pulse_7576953447_158df1fbfb09becd31d1__36913538@use1.mx.monday.com'
console.log(`\n🎯 Monday.com email test: ${isValidEmail(mondayEmail) ? '✅ VALID' : '❌ INVALID'}`)

// Test Brevo API configuration
async function testBrevoConfiguration() {
  console.log('\n🔑 Testing Brevo API Configuration...')

  // Check if supabase is available
  if (!supabase) {
    console.error('❌ Supabase client not found in browser context')
    console.log('💡 Make sure you are running this test in the browser console of your Online Designer Beta application')
    results.brevo.configured = false
    results.brevo.connected = false
    return
  }

  try {
    // First try to get the current user to fetch their API key from user_settings
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.warn('⚠️ No authenticated user found, cannot fetch Brevo API key from user_settings')
      console.log('💡 Make sure you are logged in to test Brevo API configuration')
      results.brevo.configured = false
      return
    }

    console.log('👤 User authenticated:', user.email)

    // Fetch Brevo API key from user_settings table (same as application)
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('brevo_api_key')
      .eq('user_id', user.id)
      .maybeSingle()

    if (settingsError) {
      console.warn('⚠️ Could not fetch user settings:', settingsError.message)
      results.brevo.configured = false
      return
    }

    let brevoApiKey = settings?.brevo_api_key || null
    console.log('Database BREVO_API_KEY:', brevoApiKey ? 'Set' : 'Not set')

    if (!brevoApiKey) {
      console.warn('⚠️ BREVO_API_KEY not configured in user settings')
      results.brevo.configured = false
      return
    }

    results.brevo.configured = true
    console.log('✅ BREVO_API_KEY configured in user settings')

    // Test Brevo API connectivity
    console.log('\n🌐 Testing Brevo API Connection...')

    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': brevoApiKey
      }
    })

    if (response.ok) {
      const accountData = await response.json()
      console.log('✅ Brevo API connection successful')
      console.log(`📧 Account: ${accountData.email}`)
      results.brevo.connected = true
    } else {
      console.error(`❌ Brevo API connection failed: ${response.status} ${response.statusText}`)
      results.brevo.connected = false
    }

  } catch (error) {
    console.error('❌ Brevo API test failed:', error.message)
    results.brevo.connected = false
  }
}

// Test email validation in different contexts
async function testEmailInSystem() {
  console.log('\n🔍 Testing email validation in system...')

  // Check if supabase is available
  if (!supabase) {
    console.warn('⚠️ Supabase client not available, skipping system test')
    return
  }

  try {
    // Test with a client that has the Monday.com email
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, additional_emails')
      .not('additional_emails', 'is', null)

    if (error) {
      console.error('❌ Error fetching clients:', error)
      return
    }

    console.log('📊 Clients with additional emails:')
    clients.forEach(client => {
      if (client.additional_emails && client.additional_emails.length > 0) {
        console.log(`Client: ${client.name}`)
        client.additional_emails.forEach(email => {
          const isValid = isValidEmail(email)
          console.log(`  ${isValid ? '✅' : '❌'} ${email}`)
        })
      }
    })

  } catch (error) {
    console.error('❌ System test failed:', error)
  }
}

// Run all tests
async function runAllTests() {
  await testBrevoConfiguration()
  await testEmailInSystem()

  console.log('\n🏁 FINAL SUMMARY')
  console.log('================')
  console.log(`Email Validation: ${results.validation.valid} valid, ${results.validation.invalid} invalid`)
  console.log(`Brevo API Key: ${results.brevo.configured ? '✅ Configured in user_settings' : '❌ Not configured in user_settings'}`)
  console.log(`Brevo API Connection: ${results.brevo.connected ? '✅ Connected' : '❌ Failed'}`)

  const allGood = results.validation.valid === 8 && // Should have exactly 8 valid emails now
                   results.brevo.configured &&
                   results.brevo.connected

  if (allGood) {
    console.log('\n🎉 SUCCESS! Email validation and Brevo are properly configured!')
  } else {
    console.log('\n⚠️ Issues found:')
    if (results.validation.valid !== 8) {
      console.log('  • Email validation may not be working correctly')
      console.log(`    Expected 8 valid emails, got ${results.validation.valid}`)
    }
    if (!results.brevo.configured) {
      console.log('  • BREVO_API_KEY not configured in user_settings')
      console.log('  • Go to Settings page and add your Brevo API key')
    }
    if (!results.brevo.connected) {
      console.log('  • Brevo API connection issues')
      console.log('  • Check your Brevo API key is valid')
    }
  }

  return results
}

// Run the tests
runAllTests().then(results => {
  console.log('\n📄 Complete test results:', results)
})