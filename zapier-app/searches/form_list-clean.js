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
    hidden: true
  },
  operation: {
    perform: perform
  }
};
