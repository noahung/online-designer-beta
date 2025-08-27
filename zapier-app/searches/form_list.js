const perform = (z, bundle) => {
  // Use Supabase function to get forms by API key
  const options = {
    url: 'https://bahloynyhjgmdndqabhu.supabase.co/rest/v1/rpc/get_forms_by_api_key',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMzMwNzAsImV4cCI6MjAzOTgwOTA3MH0.9N2hBVXbPdxDPKXUYKHrpQ-ZXN6YYV6VU3_7LMsXfPg',
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMzMwNzAsImV4cCI6MjAzOTgwOTA3MH0.9N2hBVXbPdxDPKXUYKHrpQ-ZXN6YYV6VU3_7LMsXfPg`,
    },
    body: {
      api_key_param: bundle.authData.api_key
    },
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const forms = response.json;

    // The function returns a JSON array of forms
    if (Array.isArray(forms)) {
      return forms.map(form => ({
        id: form.id,
        name: form.name,
        description: form.description || '',
        created_at: form.created_at
      }));
    }

    return [];
  });
};

module.exports = {
  key: 'formList',
  noun: 'Form',
  display: {
    label: 'Find Forms',
    description: 'List all your forms',
    hidden: true, // This is used internally by Zapier to populate dropdowns
  },
  operation: {
    perform: perform,
  },
};
