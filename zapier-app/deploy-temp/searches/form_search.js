const perform = (z, bundle) => {
  const options = {
    url: 'https://bahloynyhjgmdndqabhu.supabase.co/rest/v1/rpc/get_forms_by_api_key',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'
    },
    body: JSON.stringify({
      api_key_param: bundle.authData.api_key
    })
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const forms = response.json;

    if (Array.isArray(forms) && forms.length > 0) {
      let processedForms = forms.map(form => ({
        id: form.id.toString(),
        name: form.name || `Form ${form.id}`,
        description: form.description || `Form created on ${form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Unknown date'}`,
        created_at: form.created_at
      }));

      // If there's a search term, filter the results
      if (bundle.inputData && bundle.inputData.name) {
        const searchTerm = bundle.inputData.name.toLowerCase();
        processedForms = processedForms.filter(form => 
          form.name.toLowerCase().includes(searchTerm) ||
          form.description.toLowerCase().includes(searchTerm)
        );
      }

      return processedForms;
    }

    // If no forms or invalid response, return empty array
    return [];
  }).catch((error) => {
    // Log error for debugging but return empty array to prevent Zapier failures
    z.console.log('Error fetching forms:', error.message);
    return [];
  });
};

module.exports = {
  key: 'formListSearch',
  noun: 'Form',
  display: {
    label: 'Find a Form',
    description: 'Search for forms in your account',
    hidden: false
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'name',
        label: 'Form Name',
        type: 'string',
        required: false,
        helpText: 'Search for forms by name'
      }
    ],
    sample: {
      id: '1',
      name: 'Contact Form',
      description: 'Form created on 2025-01-15',
      created_at: '2025-01-15T10:00:00Z'
    }
  }
};
