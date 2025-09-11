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
