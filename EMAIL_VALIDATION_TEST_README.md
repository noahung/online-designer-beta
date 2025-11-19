# Email Validation & Brevo Integration Test

This test file (`test-email-validation.js`) validates that your email validation functions are working correctly and that Brevo API integration is properly configured.

## How to Run the Test

1. **Open your Online Designer Beta application** in the browser (must be logged in)
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to the Console tab**
4. **Copy and paste the entire contents** of `test-email-validation.js` into the console
5. **Press Enter** to run the test

**Important**: The test must be run in the browser console of your running application, not in Node.js, because it needs access to the Supabase client.

## What the Test Checks

### Email Validation
- ✅ Tests 25 different email formats (8 valid, 17 invalid)
- ✅ Uses the same validation as your application
- ✅ Specifically tests complex emails like Monday.com addresses
- ✅ Validates that invalid emails are properly rejected

### Brevo API Integration
- 🔑 Checks if `BREVO_API_KEY` is configured in **user_settings table** (not environment variables)
- 🌐 Tests actual connectivity to Brevo API
- 📧 Verifies API key is valid and can authenticate

### System Integration
- 🔍 Tests email validation against real client data in your database
- 📊 Shows validation results for all client additional emails

## Expected Results

### Email Validation
```
Valid emails: 8
Invalid emails: 17
Monday.com email test: ✅ VALID
```

### Brevo Configuration
```
✅ BREVO_API_KEY configured in user_settings
✅ Brevo API connection successful
```

## Troubleshooting

### If email validation fails:
- Check that `FormEmbed.tsx` and `Clients.tsx` have the updated `isValidEmail` function
- Ensure the validation logic matches exactly between files

### If Brevo API fails:
- Verify `BREVO_API_KEY` is set in your **user_settings** (Settings page in the app)
- Check that the API key is valid in your Brevo account
- Ensure the API key has the necessary permissions
- Make sure you are logged in when running the test

### If system test fails:
- Make sure Supabase is properly configured
- Check that you have clients with additional emails in the database

## Test Output Example

```
🧪 Email Validation & Brevo Integration Test Results:
=====================================================
✅ simple@test.com
✅ user.name+tag@domain.co.uk
✅ test@monday.com
✅ complex.email@sub.domain.monday.com
✅ user_name123@test-domain.org
✅ adverto-medialtd-company_pulse_7576953447_158df1fbfb09becd31d1__36913538@use1.mx.monday.com
❌ invalid-email@
❌ @invalid.com
❌ invalid@.com
❌ test..double@test.com
❌ .startswithdot@test.com
❌ endswithdot.@test.com
❌ test@domain..com
❌ test@.domain.com
❌ test@-domain.com
❌ test@domain-.com
❌ test@domain
❌ test@domain.
❌ .test@domain.com
❌ test.@domain.com
❌ test@domain..com
❌ test@domain.c
❌ test@domain.123
❌ test@domain.-com
❌ test@-domain.com

📋 Summary:
Total emails tested: 19
Valid emails: 6
Invalid emails: 13

🎯 Monday.com email test: ✅ VALID

🔑 Testing Brevo API Configuration...
Environment BREVO_API_KEY: Set
✅ BREVO_API_KEY configured in user_settings

🌐 Testing Brevo API Connection...
✅ Brevo API connection successful
📧 Account: your-email@domain.com

🏁 FINAL SUMMARY
================
Email Validation: 8 valid, 17 invalid
Brevo API Key: ✅ Configured in user_settings
Brevo API Connection: ✅ Connected

🎉 SUCCESS! Email validation and Brevo are properly configured!
```

## Next Steps

1. **Configure your Brevo API key** in the **Settings page** of your Online Designer Beta application:
   - Go to Settings
   - Find the "Brevo API Key" field
   - Enter your Brevo API key
   - Save the settings

2. **Run the test** using the instructions above

3. **If the test shows issues**, check the troubleshooting section in this file

4. **Once everything passes**, your email notifications should work correctly for all valid email formats including complex ones like Monday.com