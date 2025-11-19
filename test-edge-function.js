// Test the Edge Function with your service role key
// Replace YOUR_SERVICE_ROLE_KEY with the actual key from Supabase

const testFunction = async () => {
  const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY'; // Replace this!

  if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.log('❌ Please replace YOUR_SERVICE_ROLE_KEY with your actual Supabase service role key');
    console.log('   Get it from: Supabase Dashboard → Settings → API → service_role key');
    return;
  }

  const https = require('https');

  const options = {
    hostname: 'bahloynyhjgmdndqabhu.supabase.co',
    path: '/functions/v1/process-webhooks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  };

  const req = https.request(options, (res) => {
    console.log('✅ Function Response Status:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('✅ Function Response:', data);

      if (res.statusCode === 200) {
        console.log('🎉 SUCCESS! The function is working correctly!');
        console.log('📋 Next: Add this key to GitHub secrets and the cron job will work');
      } else {
        console.log('❌ Function returned error. Check the response above.');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request Error:', e.message);
  });

  req.write('{}');
  req.end();
};

testFunction();