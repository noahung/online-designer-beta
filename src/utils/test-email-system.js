// Test script for email notification system
// Run this in browser console or create as a standalone test

const testEmailNotification = async () => {
  try {
    console.log('🧪 Testing Email Notification System...')
    
    // 1. Check if Brevo API key is configured
    const brevoKey = import.meta.env.VITE_BREVO_API_KEY || process.env.VITE_BREVO_API_KEY
    
    if (!brevoKey) {
      console.error('❌ VITE_BREVO_API_KEY not found in environment variables')
      console.log('📝 Add your Brevo API key to .env file:')
      console.log('   VITE_BREVO_API_KEY=xkeysib-your-key-here')
      return false
    }
    
    console.log('✅ Brevo API key found:', brevoKey.substring(0, 10) + '...')
    
    // 2. Test Brevo API connection
    console.log('🌐 Testing Brevo API connection...')
    
    const testEmailPayload = {
      sender: {
        name: "Online Designer Test",
        email: "designer@advertomedia.co.uk"
      },
      to: [{
        email: "your-test-email@example.com", // Replace with your email
        name: "Test User"
      }],
      subject: "Test Email - Online Designer Notification System",
      htmlContent: `
        <h1>🎉 Email System Test</h1>
        <p>This is a test email from your Online Designer notification system.</p>
        <p>If you received this, the email system is working correctly!</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      `,
      textContent: `
        Email System Test
        
        This is a test email from your Online Designer notification system.
        If you received this, the email system is working correctly!
        
        Timestamp: ${new Date().toLocaleString()}
      `
    }
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoKey
      },
      body: JSON.stringify(testEmailPayload)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Test email sent successfully!', result)
      console.log('📧 Check your email inbox for the test message')
      return true
    } else {
      const error = await response.text()
      console.error('❌ Brevo API error:', response.status, error)
      
      if (response.status === 401) {
        console.log('🔑 Check your API key - it might be invalid or expired')
      } else if (response.status === 400) {
        console.log('📝 Check the email format - make sure sender email is valid')
      }
      
      return false
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Run the test
testEmailNotification().then(success => {
  if (success) {
    console.log('🎉 Email notification system is ready to use!')
  } else {
    console.log('🔧 Please fix the issues above and try again')
  }
})

// Export for manual testing
window.testEmailSystem = testEmailNotification
