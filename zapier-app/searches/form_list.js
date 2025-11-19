const perform = (z, bundle) => {
  const options = {
    url: `${process.env.BASE_URL}/api/forms`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    qs: {
      api_key: bundle.authData.api_key
    }
  };

  return z.request(options).then((response) => {
    response.throwForStatus();
    const forms = response.json;

    if (Array.isArray(forms) && forms.length > 0) {
      let filteredForms = forms;
      
      // Filter by name if search term provided
      if (bundle.inputData.name) {
        const searchTerm = bundle.inputData.name.toLowerCase();
        filteredForms = forms.filter(form => 
          form.name && form.name.toLowerCase().includes(searchTerm)
        );
      }
      
      return filteredForms.map(form => ({
        id: form.id.toString(),
        name: form.name || `Form ${form.id}`,
        description: form.description || `Form created on ${form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Unknown date'}`,
        created_at: form.created_at
      }));
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
  key: 'formSearch',
  noun: 'Form',
  display: {
    label: 'Find Forms',
    description: 'Finds forms in your account',
    hidden: false
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'name',
        label: 'Form Name',
        helpText: 'Search for forms by name (optional)',
        required: false
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
