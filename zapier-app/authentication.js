const performAuth = (z, bundle) => {
  // Use Supabase function to validate API key
  const options = {
    url: 'https://bahloynyhjgmdndqabhu.supabase.co/rest/v1/rpc/validate_api_key',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0',
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0`,
    },
    body: {
      api_key_param: bundle.authData.api_key
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const result = response.json;

    // Check if the API key is valid
    if (result && result.valid === true) {
      return { success: true, user_id: result.user_id };
    }
    
    throw new Error('Invalid API key');
  });
};

const authentication = {
  type: 'custom',
  test: performAuth,
  fields: [
    {
      computed: false,
      key: 'api_key',
      required: true,
      label: 'API Key',
      type: 'string',
      helpText: 'Get your API key from the Settings page in your Online Designer account. Make sure to copy the entire key including any prefixes.',
    },
  ],
  // The test method allows Zapier to verify that the credentials are valid
  connectionLabel: 'Online Designer Forms ({{username}})',
};

module.exports = {
  authentication,
};
